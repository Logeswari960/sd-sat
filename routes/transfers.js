const express = require('express');
const { transferMoney } = require('../services/bankingService');

const router = express.Router();

router.post('/', (req, res) => {
  const result = transferMoney(req.body || {}, req.get('Idempotency-Key'));
  if (result.error) return res.status(result.status).json({ error: result.error });
  const status = result.replayed ? 200 : 201;
  return res.status(status).json({
    transaction: result.transaction,
    availableBalance: result.availableBalance,
    replayed: result.replayed
  });
});

module.exports = router;
