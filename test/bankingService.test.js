const test = require('node:test');
const assert = require('node:assert/strict');
const { transferMoney, getAccount, getTransactions } = require('../services/bankingService');

test('transfer rejects a zero amount without changing account data', () => {
  const before = getAccount('1024').balance;
  const result = transferMoney({ fromAccount: '1024', beneficiaryId: 'B001', amount: 0 }, 'test-zero');
  assert.equal(result.status, 400);
  assert.equal(getAccount('1024').balance, before);
});

test('transfer rejects an invalid beneficiary without changing account data', () => {
  const before = getAccount('1024').balance;
  const result = transferMoney({ fromAccount: '1024', beneficiaryId: 'missing', amount: 1 }, 'test-beneficiary');
  assert.equal(result.status, 404);
  assert.equal(getAccount('1024').balance, before);
});

test('same idempotency key and request only records one transfer', () => {
  const startingBalance = getAccount('1024').balance;
  const startingCount = getTransactions('1024').length;
  const request = { fromAccount: '1024', beneficiaryId: 'B001', amount: 25, remarks: 'Test' };
  const first = transferMoney(request, 'test-idempotency-once');
  const replay = transferMoney(request, 'test-idempotency-once');

  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.transaction.id, first.transaction.id);
  assert.equal(getAccount('1024').balance, startingBalance - 25);
  assert.equal(getTransactions('1024').length, startingCount + 1);
});

test('same idempotency key with a different request conflicts', () => {
  const key = 'test-idempotency-conflict';
  transferMoney({ fromAccount: '1024', beneficiaryId: 'B001', amount: 2 }, key);
  const result = transferMoney({ fromAccount: '1024', beneficiaryId: 'B002', amount: 2 }, key);
  assert.equal(result.status, 409);
});

test('insufficient funds leaves balance and history unchanged', () => {
  const startingBalance = getAccount('1024').balance;
  const startingCount = getTransactions('1024').length;
  const result = transferMoney({ fromAccount: '1024', beneficiaryId: 'B001', amount: startingBalance + 1 }, 'test-insufficient');
  assert.equal(result.status, 400);
  assert.equal(getAccount('1024').balance, startingBalance);
  assert.equal(getTransactions('1024').length, startingCount);
});
