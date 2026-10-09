const express = require('express');
const { getAccount, getTransactions } = require('../services/bankingService');

const router = express.Router();

router.get('/:id', (req, res) => {
  const account = getAccount(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found.' });
  return res.json({ account });
});

router.get('/:id/balance', (req, res) => {
  const account = getAccount(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found.' });
  return res.json({ accountId: account.id, balance: account.balance, currency: account.currency });
});

router.get('/:id/transactions', (req, res) => {
  const accountTransactions = getTransactions(req.params.id);
  if (!accountTransactions) return res.status(404).json({ error: 'Account not found.' });
  return res.json({ accountId: req.params.id, transactions: accountTransactions });
});

module.exports = router;
