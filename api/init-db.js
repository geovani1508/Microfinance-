import sql from './db.js';

export default async function initDB() {
  // Create submissions table
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      birth_date VARCHAR(50),
      address TEXT,
      phone VARCHAR(50),
      id_doc VARCHAR(50),
      id_doc_file_name VARCHAR(255),
      id_doc_file_mime VARCHAR(100),
      id_doc_file_base64 TEXT,
      job VARCHAR(255),
      job_type VARCHAR(50),
      income_monthly VARCHAR(100),
      other_income VARCHAR(50),
      loan_amount VARCHAR(50),
      repayment_term VARCHAR(50),
      previous_loan VARCHAR(50),
      purpose TEXT,
      agree VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Create admins table
  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL
    );
  `;

  // Check if admin exists, if not create default admin
  const existing = await sql`SELECT id FROM admins WHERE email = ${process.env.ADMIN_EMAIL || 'admin@microfinance.com'}`;

  if (existing.length === 0) {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await sql`
      INSERT INTO admins (email, password_hash)
      VALUES (${process.env.ADMIN_EMAIL || 'admin@microfinance.com'}, ${hash})
    `;
  }

  console.log('✅ Database initialized successfully');
}

