import { extractIntakeDocument, type IntakeDocumentKind } from "../../../supabase/functions/_shared/intake-documents.ts";
import { ZipWriter, Uint8ArrayWriter, TextReader } from "npm:@zip.js/zip.js@2.25.0";

function assert(ok: unknown, message = "Assertion failed"): asserts ok { if (!ok) throw new Error(message); }
async function rejects(f: () => Promise<unknown>) {
  try { await f(); } catch { return; } throw new Error("Expected rejection");
}
const word = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const sheet = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const pkg = "http://schemas.openxmlformats.org/package/2006/relationships";
const ct = "http://schemas.openxmlformats.org/package/2006/content-types";
const manifest = (main: string, mime: string) => '<Types xmlns="'+ct+'"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/'+main+'" ContentType="'+mime+'"/></Types>';
const relationship = (id: string, kind: string, target: string) => '<Relationship Id="'+id+'" Type="'+rel+'/'+kind+'" Target="'+target+'"/>';
const relationships = (items: string) => '<Relationships xmlns="'+pkg+'">'+items+'</Relationships>';
async function zip(parts: Record<string, string>): Promise<Uint8Array> {
  const writer = new ZipWriter(new Uint8ArrayWriter(), { useWebWorkers: false });
  for (const [name, value] of Object.entries(parts)) await writer.add(name, new TextReader(value), { useWebWorkers: false });
  return await writer.close();
}
function wordParts(body = '<w:p><w:r><w:t>Villa &amp; pool — Пхукет</w:t></w:r></w:p>') {
  return {
    "[Content_Types].xml": manifest("word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"),
    "_rels/.rels": relationships(relationship("r1","officeDocument","word/document.xml")),
    "word/document.xml": '<w:document xmlns:w="'+word+'"><w:body>'+body+'</w:body></w:document>',
  };
}
function xlsxParts() {
  return {
    "[Content_Types].xml": manifest("xl/workbook.xml", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"),
    "_rels/.rels": relationships(relationship("r1","officeDocument","xl/workbook.xml")),
    "xl/workbook.xml": '<workbook xmlns="'+sheet+'" xmlns:r="'+rel+'"><sheets><sheet name="Prices" sheetId="1" r:id="r1"/><sheet name="Stock" sheetId="2" r:id="r2"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels": relationships(relationship("r1","worksheet","worksheets/sheet1.xml")+relationship("r2","worksheet","worksheets/sheet2.xml")+relationship("r3","sharedStrings","sharedStrings.xml")),
    "xl/sharedStrings.xml": '<sst xmlns="'+sheet+'"><si><t>Villa</t></si></sst>',
    "xl/worksheets/sheet1.xml": '<worksheet xmlns="'+sheet+'"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>100</v></c><c r="C1"><f>SUM(B1,1)</f><v>101</v></c></row></sheetData></worksheet>',
    "xl/worksheets/sheet2.xml": '<worksheet xmlns="'+sheet+'"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Available</t></is></c><c r="B1" t="b"><v>1</v></c></row></sheetData></worksheet>',
  };
}
// A real minimal PDF with font, page, text stream and computed cross-reference table.
function pdf(text: string) {
  const stream = "BT /F1 12 Tf 72 720 Td (" + text + ") Tj ET\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length "+stream.length+" >>\nstream\n"+stream+"endstream",
  ];
  let src = "%PDF-1.4\n";
  const offsets = [0];
  for (const [i, obj] of objects.entries()) { offsets.push(src.length); src += (i+1)+" 0 obj\n"+obj+"\nendobj\n"; }
  const xref = src.length;
  src += "xref\n0 "+offsets.length+"\n0000000000 65535 f \n"+offsets.slice(1).map(n=>String(n).padStart(10,"0")+" 00000 n \n").join("")+
    "trailer\n<< /Size "+offsets.length+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF\n";
  return new TextEncoder().encode(src);
}
Deno.test("PDF extracts real page text", async () => assert((await extractIntakeDocument("pdf",pdf("Synthetic villa price 100"))).includes("Synthetic villa price 100")));
Deno.test("DOCX extracts Unicode and XML entities, not deleted text", async () => {
  const f=await zip(wordParts('<w:p><w:r><w:t>Villa &amp; pool — Пхукет</w:t></w:r><w:del><w:r><w:t>DELETED</w:t></w:r></w:del></w:p>'));
  const value=await extractIntakeDocument("docx",f);
  assert(value.includes("Villa & pool — Пхукет") && !value.includes("DELETED"));
});
Deno.test("XLSX extracts two sheets, shared and inline strings and cached formula values", async () => {
  const value=await extractIntakeDocument("xlsx",await zip(xlsxParts()));
  for(const term of ["Sheet: Prices","A1=Villa","B1=100","C1=101 [cached formula]","Sheet: Stock","A1=Available","B1=true"]) assert(value.includes(term),term);
});
Deno.test("rejects invalid PDF, missing text and unsupported legacy formats", async () => {
  await rejects(()=>extractIntakeDocument("pdf",new TextEncoder().encode("not PDF")));
  await rejects(()=>extractIntakeDocument("pdf",pdf("")));
  for(const kind of ["doc","xls","docm","xlsm"]) await rejects(()=>extractIntakeDocument(kind as IntakeDocumentKind,new Uint8Array([80,75,3,4])));
});
Deno.test("rejects renamed Office format", async()=> { const data=await zip(wordParts()); await rejects(()=>extractIntakeDocument("xlsx",data)); });
Deno.test("rejects external relationships without fetching", async()=>{
  const data=await zip({...wordParts(), "word/_rels/document.xml.rels":relationships('<Relationship Id="external" Type="'+rel+'/hyperlink" Target="https://example.invalid/private" TargetMode="External"/>')});
  await rejects(()=>extractIntakeDocument("docx",data));
});
Deno.test("rejects DTD and active Office parts", async()=>{
  const data=await zip({...wordParts(),"word/document.xml":'<!DOCTYPE w:document [<!ENTITY x "boom">]><w:document xmlns:w="'+word+'"><w:body><w:p><w:r><w:t>&x;</w:t></w:r></w:p></w:body></w:document>'});
  await rejects(()=>extractIntakeDocument("docx",data));
  const macro=await zip({...wordParts(),"word/vbaProject.bin":"not a real macro"});
  await rejects(()=>extractIntakeDocument("docx",macro));
});
Deno.test("rejects formula without cached value", async()=>{
  const parts=xlsxParts(); parts["xl/worksheets/sheet1.xml"]=parts["xl/worksheets/sheet1.xml"].replace("<v>101</v>","");
  const data=await zip(parts);await rejects(()=>extractIntakeDocument("xlsx",data));
});
Deno.test("rejects text and expanded archive limits", async()=>{
  const data=await zip(wordParts('<w:p><w:r><w:t>'+Array.from({length:9000},(_,i)=>String.fromCharCode(65+i%26)).join("")+'</w:t></w:r></w:p>'));
  await rejects(()=>extractIntakeDocument("docx",data));
  const bomb=await zip({...wordParts(),"word/oversize.xml":"A".repeat(2*1024*1024)});
  await rejects(()=>extractIntakeDocument("docx",bomb));
});
