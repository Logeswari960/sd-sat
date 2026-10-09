# SimpleBank

A beginner-friendly online banking demo for a college System Design practical. It includes a responsive dashboard, a working Express REST API, in-memory sample data, transfer validation, and a standalone API reference at `/api.html`.

> **Demo only:** No real bank accounts or payments are connected. Data is reset whenever the server restarts.

## Requirements

- Node.js 18 or later
- npm

## Install and run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard. Open [http://localhost:3000/api.html](http://localhost:3000/api.html) for the API documentation. To restart automatically after code changes, use `npm run dev`.

## Sample data

- Account ID: `1024`
- Starting balance: `INR 48,250.75`
- Beneficiaries: `B001`, `B002`, and `B003`

## API endpoints

All request and response bodies use JSON. The examples use the local server at `http://localhost:3000`.

| Method | URI | Purpose | Success |
| --- | --- | --- | --- |
| GET | `/accounts/:id` | Get customer and account details | `200 OK` |
| GET | `/accounts/:id/balance` | Check the current balance | `200 OK` |
| GET | `/accounts/:id/transactions` | Read transaction history | `200 OK` |
| POST | `/transfers` | Transfer sample funds and record a transaction | `201 Created` (first request), `200 OK` (same-key replay) |
| GET | `/beneficiaries` | List beneficiaries | `200 OK` |
| POST | `/beneficiaries` | Add a beneficiary | `201 Created` |
| DELETE | `/beneficiaries/:id` | Delete a beneficiary | `200 OK` |

### Transfer request

`POST /transfers` requires an `Idempotency-Key` header. Reusing that key with the same request returns the original result without transferring again. Reusing it with different request data returns `409 Conflict`.

```http
POST /transfers
Content-Type: application/json
Idempotency-Key: demo-transfer-001

{
  "fromAccount": "1024",
  "beneficiaryId": "B001",
  "amount": 500,
  "remarks": "Monthly payment"
}
```

A successful response includes the transaction and new balance:

```json
{
  "transaction": {
    "id": "TXN-58321",
    "beneficiaryId": "B001",
    "beneficiary": "Jordan Lee",
    "amount": -500,
    "date": "2026-10-09T10:00:00.000Z",
    "status": "Completed",
    "remarks": "Monthly payment"
  },
  "availableBalance": 47750.75,
  "replayed": false
}
```

Other response codes include `400 Bad Request` for invalid amounts, missing required data, or insufficient balance; `404 Not Found` for an unknown account or beneficiary; and `409 Conflict` for a conflicting idempotency-key reuse. A repeated identical transfer returns `200 OK` and `replayed: true`.

### Beneficiary request

```http
POST /beneficiaries
Content-Type: application/json

{ "name": "Jamie Patel", "bankName": "Northstar Bank", "accountNumber": "12345678" }
```

The response is `201 Created` with the new beneficiary. Account numbers are masked in the response.

## Project structure

```text
public/
  index.html       Dashboard structure
  style.css        Responsive dashboard and shared styles
  script.js        Browser interactions and API calls
  api.html         API reference and system flow
  api.css          API reference styles
routes/
  accounts.js      Account, balance, and transaction endpoints
  beneficiaries.js Beneficiary endpoints
  transfers.js     Transfer endpoint
services/
  bankingService.js Validation and banking operations
  dataStore.js     In-memory sample accounts and records
server.js          Express setup, static files, and error handling
```

## Low-level design

`Customer → Frontend → Express REST API → Banking Service → Data Storage → JSON Response`

The frontend uses `fetch()` to call the routes. Routes validate the request shape and delegate banking rules to `services/bankingService.js`. The service reads or updates `services/dataStore.js`, then the route returns JSON with an appropriate HTTP status code.

## Transfer rules

- The amount must be a positive number with at most two decimal places.
- The source account and beneficiary must exist.
- The available balance must cover the amount.
- An `Idempotency-Key` prevents a retried request from applying twice.
- After validation, the service updates the balance and transaction history synchronously in the same Node.js process.

The last point is suitable only for this single-process demonstration. Real banking systems require secure authentication and authorization, durable database transactions, encrypted communications and storage, audit logging, and additional security controls. This demo is not production banking software.

## Tests

Run the built-in Node.js tests with `npm test`.
