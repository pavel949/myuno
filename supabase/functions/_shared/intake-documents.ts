/**
 * Staged document text extraction. No HTML rendering, URL fetching, macros,
 * formula execution or OCR. Do not enable in Intake until the exact parser,
 * dependency lock, local Edge runtime and Storage API acceptance are proved.
 */
import { INTAKE_MAX_FILE_BYTES, INTAKE_MAX_TEXT } from "./intake-private-contract.ts";
import { SaxesParser, type SaxesTagNS } from "npm:saxes@6.0.0";
import { ZipReader, Uint8ArrayReader, type FileEntry } from "npm:@zip.js/zip.js@2.25.0";

export type IntakeDocumentKind = "pdf" | "docx" | "xlsx";
const MAX_ARCHIVE_ENTRIES = 256;
const MAX_EXPANDED = 16 * 1024 * 1024;
const MAX_XML = 1024 * 1024;
const MAX_XML_NODES = 50000;
const MAX_XML_DEPTH = 64;
const MAX_PAGES = 20;
const MAX_SHEETS = 12;
const MAX_ROWS = 500;
const MAX_CELLS = 5000;
const MAX_SHARED_STRINGS = 4096;
const WORD = new Set(["http://schemas.openxmlformats.org/wordprocessingml/2006/main", "http://purl.oclc.org/ooxml/wordprocessingml/main"]);
const SHEET = new Set(["http://schemas.openxmlformats.org/spreadsheetml/2006/main", "http://purl.oclc.org/ooxml/spreadsheetml/main"]);
const REL = new Set(["http://schemas.openxmlformats.org/officeDocument/2006/relationships", "http://purl.oclc.org/ooxml/officeDocument/relationships"]);
const PACKAGE_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
const CONTENT_TYPES = "http://schemas.openxmlformats.org/package/2006/content-types";

function reject(message: string): never { throw new Error(message); }
function hasControlCharacter(value: string, allowTextWhitespace = false): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 32 && !(allowTextWhitespace && (code === 9 || code === 10 || code === 13))) return true;
  }
  return false;
}
class TextBudget {
  private value = "";
  add(text: string) {
    if (hasControlCharacter(text, true)) reject("Invalid document control character");
    if (this.value.length + text.length > INTAKE_MAX_TEXT) reject("Document text exceeds analysis limit");
    this.value += text;
  }
  result() {
    const result = this.value.trim();
    if (!result) reject("No extractable text; scanned or empty documents require conversion");
    return result;
  }
}
type Visitor = {
  open?: (tag: SaxesTagNS, stack: readonly SaxesTagNS[]) => void;
  close?: (tag: SaxesTagNS, stack: readonly SaxesTagNS[]) => void;
  text?: (text: string, stack: readonly SaxesTagNS[]) => void;
};
function attr(tag: SaxesTagNS, local: string, namespaces?: ReadonlySet<string>) {
  return Object.values(tag.attributes).find(a => a.local === local && (namespaces ? namespaces.has(a.uri) : a.uri === ""))?.value;
}
function scan(xml: string, visitor: Visitor) {
  if (xml.length > MAX_XML || /<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) reject("Unsafe or oversized document XML");
  const parser = new SaxesParser({ xmlns: true });
  const stack: SaxesTagNS[] = [];
  let nodes = 0;
  parser.on("doctype", () => reject("Document DTD is forbidden"));
  parser.on("processinginstruction", () => reject("Document processing instruction is forbidden"));
  parser.on("error", () => reject("Malformed document XML"));
  parser.on("opentag", tag => {
    if (++nodes > MAX_XML_NODES || stack.length >= MAX_XML_DEPTH) reject("Document XML exceeds structural limits");
    stack.push(tag);
    visitor.open?.(tag, stack);
  });
  parser.on("closetag", tag => {
    visitor.close?.(tag, stack);
    stack.pop();
  });
  parser.on("text", value => visitor.text?.(value, stack));
  parser.on("cdata", value => visitor.text?.(value, stack));
  parser.write(xml).close();
}
function hasTag(stack: readonly SaxesTagNS[], ns: ReadonlySet<string>, names: readonly string[]) {
  return stack.some(t => ns.has(t.uri) && names.includes(t.local));
}
function safePartName(name: string) {
  return !!name && name.length <= 240 && !hasControlCharacter(name) && !/[\\:%]/.test(name) &&
    !name.startsWith("/") && !name.split("/").some(p => p === "." || p === ".." || p === "");
}
function resolvePart(base: string, target: string) {
  if (!target || hasControlCharacter(target) || /[\\:%?#]/.test(target) || target.startsWith("//")) reject("Unsafe document relationship");
  const parts = target.startsWith("/") ? [] : base.split("/").slice(0, -1);
  for (const part of target.replace(/^\//, "").split("/")) {
    if (part === ".") continue;
    if (part === "..") {
      if (!parts.length) reject("Document relationship escapes package");
      parts.pop();
    } else if (part) parts.push(part);
    else reject("Invalid document relationship");
  }
  const path = parts.join("/");
  if (!safePartName(path)) reject("Invalid document part");
  return path;
}
type Relationship = { id: string; type: string; target: string };
function relationships(xml: string, base: string): Map<string, Relationship> {
  const result = new Map<string, Relationship>();
  scan(xml, { open(tag) {
    if (tag.uri !== PACKAGE_REL || tag.local !== "Relationship") return;
    const mode = attr(tag, "TargetMode");
    if (mode && mode !== "Internal") reject("External document relationships are forbidden");
    const id = attr(tag, "Id"), type = attr(tag, "Type"), target = attr(tag, "Target");
    if (!id || !type || !target || result.has(id)) reject("Invalid document relationship");
    result.set(id, { id, type, target: resolvePart(base, target) });
  }});
  return result;
}
async function withOffice<T>(bytes: Uint8Array, kind: "docx" | "xlsx",
  run: (parts: Map<string, FileEntry>, read: (name: string) => Promise<string>) => Promise<T>): Promise<T> {
  if (bytes[0] !== 80 || bytes[1] !== 75 || bytes[2] !== 3 || bytes[3] !== 4) reject("Office ZIP signature required");
  const reader = new ZipReader(new Uint8ArrayReader(bytes), { strictness: "strict", useWebWorkers: false });
  try {
    const parts = new Map<string, FileEntry>();
    const names = new Set<string>();
    let count = 0, total = 0, actualRead = 0;
    for await (const entry of reader.getEntriesGenerator()) {
      if (++count > MAX_ARCHIVE_ENTRIES) reject("Office archive has too many entries");
      if (entry.directory) continue;
      const name = entry.filename;
      const folded = name.normalize("NFC").toLowerCase();
      if (!safePartName(name) || names.has(folded) || entry.encrypted) reject("Unsafe, duplicate or encrypted Office entry");
      if (/(?:^|\/)(?:embeddings|activex|externallinks|customui|vbaproject[^/]*|vbadata[^/]*)(?:\/|$)/i.test(name)) reject("Active or embedded Office content is forbidden");
      names.add(folded);
      if (!Number.isSafeInteger(entry.uncompressedSize) || entry.uncompressedSize < 0 ||
          !Number.isSafeInteger(entry.compressedSize) || entry.compressedSize < 0 ||
          entry.uncompressedSize > MAX_EXPANDED ||
          entry.uncompressedSize > Math.max(1024, entry.compressedSize * 200)) reject("Office compression limit exceeded");
      total += entry.uncompressedSize;
      if (total > MAX_EXPANDED) reject("Office expanded size limit exceeded");
      parts.set(name, entry);
    }
    const read = async (name: string) => {
      const entry = parts.get(name);
      if (!entry || entry.uncompressedSize > MAX_XML) reject("Missing or oversized Office XML part");
      let size = 0, xml = "";
      const decoder = new TextDecoder("utf-8", { fatal: true });
      const sink = new WritableStream<Uint8Array>({
        write(chunk) {
          size += chunk.byteLength;
          actualRead += chunk.byteLength;
          if (size > MAX_XML || size > entry.uncompressedSize || actualRead > MAX_EXPANDED) reject("Office decompression limit exceeded");
          xml += decoder.decode(chunk, { stream: true });
        },
      });
      await entry.getData(sink, { checkCrc32: true, checkOverlappingEntry: true, checkLocalFilename: true, strictness: "strict", useWebWorkers: false, signal: AbortSignal.timeout(10000) });
      if (size !== entry.uncompressedSize) reject("Office entry size mismatch");
      return xml + decoder.decode();
    };
    const main = kind === "docx" ? "word/document.xml" : "xl/workbook.xml";
    const expected = kind === "docx" ?
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml" :
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml";
    let matched = false;
    scan(await read("[Content_Types].xml"), { open(tag) {
      if (tag.uri !== CONTENT_TYPES) return;
      const type = attr(tag, "ContentType") || "";
      if (/macroenabled|vba|activex|oleobject/i.test(type)) reject("Active Office content is forbidden");
      if (tag.local === "Override" && attr(tag, "PartName") === "/" + main && type === expected) matched = true;
    }});
    if (!matched || !parts.has(main)) reject("Office document type mismatch");
    const root = relationships(await read("_rels/.rels"), "");
    if (![...root.values()].some(r => r.type.endsWith("/officeDocument") && r.target === main)) reject("Missing Office root relationship");
    for (const name of parts.keys()) {
      if (name === "_rels/.rels" || !name.endsWith(".rels")) continue;
      const base = name.replace(/(^|\/)_rels\/([^/]+)\.rels$/, "$1$2");
      relationships(await read(name), base);
    }
    return await run(parts, read);
  } finally { await reader.close(); }
}
async function extractWord(bytes: Uint8Array) {
  return withOffice(bytes, "docx", async (parts, read) => {
    const out = new TextBudget();
    const names = ["word/document.xml", ...[...parts.keys()].filter(n => /^word\/(?:(?:header|footer)\d+|footnotes|endnotes)\.xml$/.test(n)).sort()];
    for (const name of names) {
      scan(await read(name), {
        open(tag, stack) {
          if (!WORD.has(tag.uri)) return;
          if (["altChunk", "object", "control"].includes(tag.local)) reject("Unsupported active Word content");
          if (!hasTag(stack, WORD, ["del", "moveFrom"])) {
            if (tag.local === "tab") out.add("\t");
            if (tag.local === "br") out.add("\n");
          }
        },
        text(value, stack) {
          const tag = stack.at(-1);
          if (tag && WORD.has(tag.uri) && tag.local === "t" && !hasTag(stack, WORD, ["del", "moveFrom", "instrText"])) out.add(value);
        },
        close(tag, stack) {
          if (!WORD.has(tag.uri) || hasTag(stack, WORD, ["del", "moveFrom"])) return;
          if (tag.local === "p" || tag.local === "tr") out.add("\n");
          else if (tag.local === "tc") out.add("\t");
        },
      });
    }
    return out.result();
  });
}
async function extractExcel(bytes: Uint8Array) {
  return withOffice(bytes, "xlsx", async (_parts, read) => {
    const out = new TextBudget();
    const rels = relationships(await read("xl/_rels/workbook.xml.rels"), "xl/workbook.xml");
    const sheets: { name: string; path: string }[] = [];
    scan(await read("xl/workbook.xml"), { open(tag) {
      if (!SHEET.has(tag.uri) || tag.local !== "sheet") return;
      const name = attr(tag, "name"), id = attr(tag, "id", REL);
      const rel = id && rels.get(id);
      if (!name || !rel || !rel.type.endsWith("/worksheet") || !/^xl\/worksheets\/[^/]+\.xml$/.test(rel.target)) reject("Unsupported workbook sheet");
      if (sheets.length >= MAX_SHEETS || sheets.some(s => s.path === rel.target)) reject("Workbook sheet limit or duplicate");
      sheets.push({ name, path: rel.target });
    }});
    if (!sheets.length) reject("Workbook has no worksheets");
    const shared: string[] = [];
    const sharedRel = [...rels.values()].filter(r => r.type.endsWith("/sharedStrings"));
    if (sharedRel.length > 1) reject("Duplicate shared strings relationship");
    if (sharedRel.length) {
      let current: string | null = null, size = 0;
      scan(await read(sharedRel[0].target), {
        open(tag) { if (SHEET.has(tag.uri) && tag.local === "si") current = ""; },
        text(value, stack) {
          const t = stack.at(-1);
          if (current !== null && t && SHEET.has(t.uri) && t.local === "t" && !hasTag(stack, SHEET, ["rPh"])) {
            size += value.length;
            if (size > MAX_XML) reject("Workbook shared strings exceed limit");
            current += value;
          }
        },
        close(tag) {
          if (SHEET.has(tag.uri) && tag.local === "si" && current !== null) {
            if (shared.length >= MAX_SHARED_STRINGS) reject("Too many workbook shared strings");
            shared.push(current); current = null;
          }
        },
      });
    }
    let rows = 0, cells = 0;
    for (const sheet of sheets) {
      out.add("Sheet: " + sheet.name + "\n");
      type Cell = { ref: string; type: string; value: string; formula: boolean; hasValue: boolean };
      let cell: Cell | null = null;
      scan(await read(sheet.path), {
        open(tag) {
          if (!SHEET.has(tag.uri)) return;
          if (tag.local === "row" && ++rows > MAX_ROWS) reject("Workbook row limit exceeded");
          if (tag.local === "c") {
            if (++cells > MAX_CELLS || cell) reject("Workbook cell limit or malformed cell");
            const ref = attr(tag, "r") || "";
            if (!/^[A-Z]{1,3}[1-9][0-9]{0,6}$/.test(ref)) reject("Missing or invalid cell reference");
            cell = { ref, type: attr(tag, "t") || "n", value: "", formula: false, hasValue: false };
          }
          if (cell && tag.local === "f") cell.formula = true;
          if (cell && tag.local === "v") cell.hasValue = true;
        },
        text(value, stack) {
          const t = stack.at(-1);
          if (!cell || !t || !SHEET.has(t.uri)) return;
          if (t.local === "v" || (t.local === "t" && hasTag(stack, SHEET, ["is"]) && !hasTag(stack, SHEET, ["rPh"]))) {
            if (cell.value.length + value.length > INTAKE_MAX_TEXT) reject("Workbook cell text exceeds limit");
            cell.value += value;
          }
        },
        close(tag) {
          if (!SHEET.has(tag.uri)) return;
          if (tag.local === "row") out.add("\n");
          if (tag.local !== "c" || !cell) return;
          let value = cell.value;
          if (cell.formula && (!cell.hasValue || !value.trim())) reject("Formula has no cached value; export calculated values");
          if (cell.type === "s") {
            if (!/^(0|[1-9]\d*)$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) >= shared.length) reject("Invalid shared string index");
            value = shared[Number(value)];
          } else if (cell.type === "b") {
            if (value !== "0" && value !== "1") reject("Invalid workbook boolean");
            value = value === "1" ? "true" : "false";
          } else if (!["n", "str", "inlineStr", "d"].includes(cell.type)) reject("Unsupported workbook cell type or error cell");
          if (value.trim()) out.add(cell.ref + "=" + value + (cell.formula ? " [cached formula]" : "") + "\t");
          cell = null;
        },
      });
    }
    if (!cells) reject("Workbook has no cells");
    return out.result();
  });
}
async function extractPdf(bytes: Uint8Array) {
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") reject("PDF signature required");
  const { getDocument } = await import("npm:unpdf@1.9.1/pdfjs");
  // Do not render, load external resources, execute document actions or inspect links.
  const options = { data: bytes.slice(), stopAtErrors: true, isEvalSupported: false, disableFontFace: true,
    useSystemFonts: false, useWorkerFetch: false, useWasm: false, enableXfa: false, disableAutoFetch: true,
    disableRange: true, disableStream: true, maxImageSize: 1000000 };
  const task = getDocument(options);
  try {
    const pdf = await task.promise;
    if (!pdf.numPages || pdf.numPages > MAX_PAGES) reject("PDF page limit exceeded");
    const out = new TextBudget();
    let count = 0;
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const stream = page.streamTextContent().getReader();
      try {
        while (true) {
          const next = await stream.read();
          if (next.done) break;
          for (const item of next.value.items) {
            if (++count > 10000) reject("PDF text item limit exceeded");
            if ("str" in item) out.add(item.str + (item.hasEOL ? "\n" : " "));
          }
        }
      } finally { await stream.cancel().catch(() => {}); stream.releaseLock(); }
      out.add("\n");
      page.cleanup();
    }
    return out.result();
  } finally { await task.destroy(); }
}
export async function extractIntakeDocument(kind: IntakeDocumentKind, bytes: Uint8Array): Promise<string> {
  if (!bytes.length || bytes.length > INTAKE_MAX_FILE_BYTES) reject("Invalid document file size");
  switch (kind) {
    case "pdf": return extractPdf(bytes);
    case "docx": return extractWord(bytes);
    case "xlsx": return extractExcel(bytes);
    default: return reject("Unsupported document format; convert legacy DOC/XLS to DOCX/XLSX");
  }
}
