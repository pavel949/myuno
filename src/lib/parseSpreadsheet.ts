/**
 * Shared spreadsheet parser for CSV, TSV, and XLSX.
 * Used by ContactImportPage and can be used by useDataImport.
 */
import Papa from 'papaparse';

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, string>[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function toString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return String(value);
}

export function parseCSVOrTSV(file: File, delimiter?: string): Promise<ParsedSpreadsheet> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: delimiter ?? undefined,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = (results.data as Record<string, unknown>[]).map((row) => {
          const out: Record<string, string> = {};
          for (const h of headers) {
            out[h] = toString(row[h]);
          }
          return out;
        });
        resolve({ headers, rows });
      },
      error: (err) => reject(err),
    });
  });
}

export async function parseXLSX(file: File): Promise<ParsedSpreadsheet> {
  const arrayBuffer = await file.arrayBuffer();
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error('Worksheet is empty');
  }

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? '').trim() || `Column${colNumber}`;
  });

  const rows: Record<string, string>[] = [];
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    const rowData: Record<string, string> = {};
    let hasData = false;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        let value: unknown = cell.value;
        if (value != null && typeof value === 'object' && 'result' in value) {
          value = (value as { result: unknown }).result;
        }
        if (value != null && typeof value === 'object' && 'text' in value) {
          value = (value as { text: unknown }).text;
        }
        const str = toString(value);
        rowData[header] = str;
        if (str !== '') hasData = true;
      }
    });
    if (hasData) rows.push(rowData);
  }

  return { headers: headers.filter(Boolean), rows };
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum size is 10MB.');
  }
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'csv') {
    return parseCSVOrTSV(file);
  }
  if (ext === 'tsv') {
    return parseCSVOrTSV(file, '\t');
  }
  if (ext === 'xlsx') {
    return parseXLSX(file);
  }
  if (ext === 'xls') {
    throw new Error('Legacy .xls is not supported. Please save as .xlsx or .csv');
  }
  throw new Error(`Unsupported format: .${ext}. Use .csv, .tsv or .xlsx`);
}
