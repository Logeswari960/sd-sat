const ACCOUNT_ID = '1024';
const API = '';
let currentBalance = 0;
let transactionData = [];
let beneficiaryData = [];

const money = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2
}).format(amount);

async function request(url, options = {}) {
  const response = await fetch(`${API}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Something went wrong.');
  return body;
}

function showNotice(message, type = 'success') {
  const notice = document.querySelector('#notice');
  notice.textContent = message;
  notice.classList.toggle('error', type === 'error');
  notice.hidden = false;
  window.clearTimeout(showNotice.timeout);
  showNotice.timeout = window.setTimeout(() => { notice.hidden = true; }, 5000);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function renderBalance(account) {
  currentBalance = account.balance;
  document.querySelector('#balance-value').textContent = money(account.balance);
  document.querySelector('#available-inline').textContent = money(account.balance);
  document.querySelector('#customer-name').textContent = account.customerName;
  document.querySelector('#account-type').textContent = account.accountType;
  document.querySelector('#details-type').textContent = account.accountType;
}

function renderTransactions(transactions) {
  transactionData = transactions;
  const recent = document.querySelector('#recent-transactions');
  const all = document.querySelector('#all-transactions');
  recent.replaceChildren();
  all.replaceChildren();

  if (transactions.length === 0) {
    recent.innerHTML = '<div class="empty-state">No transactions yet.</div>';
    all.innerHTML = '<tr><td colspan="5" class="empty-state">No transactions yet.</td></tr>';
    return;
  }

  transactions.slice(0, 4).forEach((transaction) => {
    const row = document.createElement('div');
    row.className = 'transaction-row';
    const income = transaction.amount > 0;
    row.innerHTML = `<span class="transaction-avatar ${income ? 'income' : ''}">${income ? '+' : initials(transaction.beneficiary)}</span><span><span class="transaction-name"></span><span class="transaction-meta">${formatDate(transaction.date)} · ${transaction.status}</span></span><span class="transaction-amount ${income ? 'income' : ''}">${income ? '+' : '−'}${money(Math.abs(transaction.amount))}</span>`;
    row.querySelector('.transaction-name').textContent = transaction.beneficiary;
    recent.append(row);
  });

  transactions.forEach((transaction) => {
    const row = document.createElement('tr');
    const income = transaction.amount > 0;
    row.innerHTML = `<td>${transaction.id}</td><td></td><td>${formatDate(transaction.date)}</td><td><span class="status-pill"><span class="status-dot"></span>${transaction.status}</span></td><td class="align-right ${income ? 'transaction-amount income' : 'transaction-amount'}">${income ? '+' : '−'}${money(Math.abs(transaction.amount))}</td>`;
    row.children[1].textContent = transaction.beneficiary;
    all.append(row);
  });
}

function renderBeneficiaries(beneficiaries) {
  beneficiaryData = beneficiaries;
  const select = document.querySelector('#beneficiary-select');
  const list = document.querySelector('#beneficiary-list');
  select.replaceChildren(new Option('Choose a beneficiary', ''));
  list.replaceChildren();
  document.querySelector('#beneficiary-count').textContent = `${beneficiaries.length} SAVED`;

  beneficiaries.forEach((beneficiary) => {
    select.add(new Option(`${beneficiary.name} · ${beneficiary.bankName}`, beneficiary.id));
    const row = document.createElement('div');
    row.className = 'beneficiary-row';
    row.innerHTML = `<span class="beneficiary-avatar">${initials(beneficiary.name)}</span><span><span class="beneficiary-name"></span><span class="beneficiary-bank"></span><span class="beneficiary-account"></span></span><button class="icon-button" type="button" aria-label="Delete beneficiary" title="Delete beneficiary">×</button>`;
    row.querySelector('.beneficiary-name').textContent = beneficiary.name;
    row.querySelector('.beneficiary-bank').textContent = beneficiary.bankName;
    row.querySelector('.beneficiary-account').textContent = beneficiary.accountNumber;
    row.querySelector('button').addEventListener('click', () => deleteBeneficiary(beneficiary.id));
    list.append(row);
  });

  if (beneficiaries.length === 0) list.innerHTML = '<div class="empty-state">No saved beneficiaries. Add one to make a transfer.</div>';
}

async function refreshDashboard() {
  document.querySelector('#loading').textContent = 'Refreshing demo account…';
  try {
    const [accountResult, transactionsResult, beneficiaryResult] = await Promise.all([
      request(`/accounts/${ACCOUNT_ID}`),
      request(`/accounts/${ACCOUNT_ID}/transactions`),
      request('/beneficiaries')
    ]);
    renderBalance(accountResult.account);
    renderTransactions(transactionsResult.transactions);
    renderBeneficiaries(beneficiaryResult.beneficiaries);
    document.querySelector('#loading').textContent = '';
  } catch (error) {
    document.querySelector('#loading').textContent = 'Could not connect to SimpleBank. Start the server and refresh.';
    showNotice(error.message, 'error');
  }
}

async function refreshBalance() {
  try {
    const result = await request(`/accounts/${ACCOUNT_ID}/balance`);
    renderBalance({ ...result, customerName: document.querySelector('#customer-name').textContent, accountType: document.querySelector('#details-type').textContent });
    showNotice('Your balance is up to date.');
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

async function deleteBeneficiary(id) {
  try {
    await request(`/beneficiaries/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await refreshDashboard();
    showNotice('Beneficiary removed.');
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

document.querySelector('#transfer-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const beneficiaryId = formData.get('beneficiaryId');
  const amount = Number(formData.get('amount'));
  const remarks = String(formData.get('remarks')).trim();

  if (!beneficiaryId) return showNotice('Choose a beneficiary before transferring.', 'error');
  if (!Number.isFinite(amount) || amount <= 0) return showNotice('Enter an amount greater than zero.', 'error');
  if (amount > currentBalance) return showNotice('The transfer exceeds your available balance.', 'error');

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await request('/transfers', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ fromAccount: ACCOUNT_ID, beneficiaryId, amount, remarks })
    });
    form.reset();
    await refreshDashboard();
    showNotice('Transfer complete. Your transaction has been recorded.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#beneficiary-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  if (Object.values(payload).some((value) => !String(value).trim())) return showNotice('Complete all beneficiary fields.', 'error');

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await request('/beneficiaries', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    await refreshDashboard();
    showNotice('Beneficiary added.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#refresh-balance').addEventListener('click', refreshBalance);
document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});
document.querySelectorAll('[data-go-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.goView));
});

function setView(view) {
  const titles = { overview: 'Overview', transactions: 'Transactions', beneficiaries: 'Beneficiaries' };
  document.querySelector('#page-title').textContent = titles[view];
  document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === view));
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    const active = panel.dataset.panel === view;
    panel.hidden = !active;
    panel.classList.toggle('is-visible', active);
  });
}

refreshDashboard();
