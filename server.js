const express = require('express');
const path = require('path');
const accountRoutes = require('./routes/accounts');
const beneficiaryRoutes = require('./routes/beneficiaries');
const transferRoutes = require('./routes/transfers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/accounts', accountRoutes);
app.use('/beneficiaries', beneficiaryRoutes);
app.use('/transfers', transferRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(error);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SimpleBank is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
