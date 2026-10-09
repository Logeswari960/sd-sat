const express = require('express');
const { beneficiaries } = require('../services/dataStore');
const { createBeneficiary, removeBeneficiary } = require('../services/bankingService');

const router = express.Router();

router.get('/', (req, res) => {
  return res.json({ beneficiaries: Array.from(beneficiaries.values()) });
});

router.post('/', (req, res) => {
  const result = createBeneficiary(req.body || {});
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(201).json(result);
});

router.delete('/:id', (req, res) => {
  const result = removeBeneficiary(req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(200).json({ message: 'Beneficiary deleted.' });
});

module.exports = router;
