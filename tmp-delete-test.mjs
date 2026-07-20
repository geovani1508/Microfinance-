import jwt from 'jsonwebtoken';
import sql from './api/db.js';
import handler from './api/delete.js';

const inserted = await sql`INSERT INTO submissions (email, full_name) VALUES ('delete-test@example.com','Delete Test') RETURNING id`;
const id = inserted[0].id;
const token = jwt.sign({ id: 1, email: 'admin@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });

const req = {
  method: 'DELETE',
  headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
  body: { id }
};

const res = {
  headers: {},
  setHeader(name, val) { this.headers[name] = val; },
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; console.log(JSON.stringify(payload)); },
  end() { console.log('END'); }
};

await handler(req, res);
console.log('status=', res.statusCode);
