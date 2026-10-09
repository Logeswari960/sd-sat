// In-memory demonstration data. All changes reset when the server restarts.
const accounts = new Map([
  ['1024', {
    id: '1024',
    customerName: 'Alex Morgan',
    accountNumber: '•••• •••• 1024',
    accountType: 'Savings Account',
    status: 'Active',
    balance: 48250.75,
    currency: 'INR'
  }]
]);

const beneficiaries = new Map([
  ['B001', { id: 'B001', name: 'Jordan Lee', bankName: 'Northstar Bank', accountNumber: '•••• 8842' }],
  ['B002', { id: 'B002', name: 'Sam Rivera', bankName: 'Citywide Bank', accountNumber: '•••• 2307' }],
  ['B003', { id: 'B003', name: 'Taylor Chen', bankName: 'Harbor Bank', accountNumber: '•••• 6119' }]
]);

const transactions = new Map([
  ['1024', [
    { id: 'TXN-24018', beneficiaryId: 'B001', beneficiary: 'Jordan Lee', amount: -1250, date: '2026-10-07T10:25:00.000Z', status: 'Completed', remarks: 'Utilities' },
    { id: 'TXN-24017', beneficiaryId: 'B002', beneficiary: 'Sam Rivera', amount: -800, date: '2026-10-05T08:10:00.000Z', status: 'Completed', remarks: 'Dinner split' },
    { id: 'TXN-24016', beneficiaryId: null, beneficiary: 'Monthly interest', amount: 324.5, date: '2026-10-01T04:00:00.000Z', status: 'Completed', remarks: 'Interest credit' },
    { id: 'TXN-24015', beneficiaryId: 'B003', beneficiary: 'Taylor Chen', amount: -2200, date: '2026-09-28T12:40:00.000Z', status: 'Completed', remarks: 'Rent share' }
  ]]
]);

const idempotencyKeys = new Map();

module.exports = { accounts, beneficiaries, transactions, idempotencyKeys };
