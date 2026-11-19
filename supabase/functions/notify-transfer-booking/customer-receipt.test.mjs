import assert from 'node:assert/strict';
import { test } from 'node:test';
import { transferCustomerReceiptCopy, transferReceiptLanguage } from './customer-receipt.ts';

for (const [language, awaiting] of [['ru', /ожидает подтверждения/], ['en', /awaiting confirmation/], ['th', /รอการยืนยัน/]]) {
  test(`the ${language} receipt confirms intake and leaves fulfillment pending`, () => {
    const copy = transferCustomerReceiptCopy(transferReceiptLanguage(language));
    assert.match(copy.subject('TEST123'), /TEST123/);
    assert.match(copy.subject('TEST123'), awaiting);
    assert.match(copy.operatorLine, /myUNO/);
    assert.doesNotMatch(copy.operatorLine, /Klod|30|<b>/i);
  });
}

test('unsupported customer languages preserve the existing default locale', () => {
  for (const value of ['fr', '', null, undefined, '__proto__']) assert.equal(transferReceiptLanguage(value), 'ru');
});
