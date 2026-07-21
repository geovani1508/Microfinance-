import submitHandler from './api/submit.js';

const makeRes = () => {
  const res = {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; }
  };
  return res;
};

const req = {
  method: 'POST',
  body: {
    email: 'test@example.com',
    fullName: 'Test User',
    birthDate: '1990-01-01',
    address: 'Test address',
    phone: '+22501010101',
    idDoc: 'CNI',
    idDocFileName: 'test.png',
    idDocFileMime: 'image/png',
    idDocFileBase64: 'data:image/png;base64,AAA',
    job: 'Dev',
    jobType: 'Independant',
    incomeMonthly: '100 000 FCFA',
    otherIncome: 'Non',
    loanAmount: '500000',
    repaymentTerm: '6 mois',
    previousLoan: 'Non',
    purpose: 'Test',
    agree: 'Oui'
  }
};

const res = makeRes();
await submitHandler(req, res);
console.log(JSON.stringify(res.body));
