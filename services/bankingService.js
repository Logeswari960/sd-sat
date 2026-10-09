const crypto = require('crypto');
const { accounts, beneficiaries, transactions, idempotencyKeys } = require('./dataStore');

function getAccount(accountId) {
  return accounts.get(accountId) || null;
}

function getTransactions(accountId) {
  if (!accounts.has(accountId)) return null;
  return transactions.get(accountId) || [];
}

function createBeneficiary(input) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const bankName = typeof input.bankName === 'string' ? input.bankName.trim() : '';
  const accountNumber = typeof input.accountNumber === 'string' ? input.accountNumber.trim() : '';

  if (!name || !bankName || !accountNumber) {
    return { error: 'Name, bank name, and account number are required.', status: 400 };
  }

  const id = `B${String(Date.now()).slice(-5)}${crypto.randomInt(10, 99)}`;
  const beneficiary = { id, name, bankName, accountNumber: `•••• ${accountNumber.slice(-4)}` };
  beneficiaries.set(id, beneficiary);
  return { beneficiary };
}

function removeBeneficiary(beneficiaryId) {
  if (!beneficiaries.has(beneficiaryId)) {
    return { error: 'Beneficiary not found.', status: 404 };
  }
  beneficiaries.delete(beneficiaryId);
  return { deleted: true };
}

function transferMoney({ fromAccount, beneficiaryId, amount, remarks = '' }, idempotencyKey) {
  if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    return { error: 'Idempotency-Key header is required.', status: 400 };
  }

  const account = accounts.get(fromAccount);
  if (!account) return { error: 'Source account not found.', status: 404 };

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number.', status: 400 };
  }
  if (!Number.isInteger(amount * 100)) {
    return { error: 'Amount can have at most two decimal places.', status: 400 };
  }

  const beneficiary = beneficiaries.get(beneficiaryId);
  if (!beneficiary) return { error: 'Beneficiary not found.', status: 404 };

  const fingerprint = JSON.stringify({ fromAccount, beneficiaryId, amount, remarks });
  const previousRequest = idempotencyKeys.get(idempotencyKey);
  if (previousRequest) {
    if (previousRequest.fingerprint !== fingerprint) {
      return { error: 'This idempotency key was already used for a different request.', status: 409 };
    }
    return { ...previousRequest.response, replayed: true };
  }

  if (amount > account.balance) {
    return { error: 'Insufficient available balance.', status: 400 };
  }

  const updatedBalance = Math.round((account.balance - amount) * 100) / 100;
  const transaction = {
    id: `TXN-${crypto.randomInt(10000, 99999)}`,
    beneficiaryId,
    beneficiary: beneficiary.name,
    amount: -amount,
    date: new Date().toISOString(),
    status: 'Completed',
    remarks: typeof remarks === 'string' ? remarks.trim().slice(0, 120) : ''
  };

  // Both in-memory changes happen synchronously after every validation passes.
  account.balance = updatedBalance;
  const accountTransactions = transactions.get(fromAccount) || [];
  accountTransactions.unshift(transaction);
  transactions.set(fromAccount, accountTransactions);

  const response = { transaction, availableBalance: updatedBalance };
  idempotencyKeys.set(idempotencyKey, { fingerprint, response });
  return { ...response, replayed: false };
}

module.exports = { getAccount, getTransactions, createBeneficiary, removeBeneficiary, transferMoney };
