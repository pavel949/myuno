import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';

// Exercise actual ZIP/XLSX dependencies after the glob/minimatch updates.
// Synthetic financial values only; no filesystem or backend writes.
test('Excel export dependency chain round-trips amounts, currency and dates',async()=>{
 const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Synthetic receipts');
 sheet.addRow(['Receipt','RUB received','RUB per THB','THB credited','Currency','Date']);
 sheet.addRow(['synthetic-document',19000,2,9500,'THB',new Date('2030-01-10T00:00:00Z')]);
 sheet.getCell('D2').numFmt='#,##0.00';
 const bytes=await workbook.xlsx.writeBuffer();assert.ok(bytes.byteLength>1000);
 const restored=new ExcelJS.Workbook();await restored.xlsx.load(bytes);
 const row=restored.getWorksheet('Synthetic receipts').getRow(2);
 assert.equal(row.getCell(2).value,19000);assert.equal(row.getCell(3).value,2);
 assert.equal(row.getCell(4).value,9500);assert.equal(row.getCell(5).value,'THB');
 assert.equal(row.getCell(6).value.toISOString(),'2030-01-10T00:00:00.000Z');
 assert.equal(row.getCell(4).numFmt,'#,##0.00');
});
