import sql from './db.js';
import initDB from './init-db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize DB tables if needed
    await initDB();

    const data = req.body;

    // Validate required fields
    if (!data.email || !data.fullName) {
      return res.status(400).json({ error: 'Email et nom complet requis' });
    }

    // Insert submission into database
    const result = await sql`
      INSERT INTO submissions (
        email, full_name, birth_date, address, phone,
        id_doc, id_doc_file_name, id_doc_file_mime, id_doc_file_base64,
        job, job_type, income_monthly, other_income,
        loan_amount, repayment_term, previous_loan, purpose, agree
      ) VALUES (
        ${data.email.trim()},
        ${data.fullName?.trim() || ''},
        ${data.birthDate || ''},
        ${data.address?.trim() || ''},
        ${data.phone?.trim() || ''},
        ${data.idDoc || ''},
        ${data.idDocFileName || ''},
        ${data.idDocFileMime || ''},
        ${data.idDocFileBase64 || ''},
        ${data.job?.trim() || ''},
        ${data.jobType || ''},
        ${data.incomeMonthly || ''},
        ${data.otherIncome || ''},
        ${data.loanAmount || ''},
        ${data.repaymentTerm || ''},
        ${data.previousLoan || ''},
        ${data.purpose?.trim() || ''},
        ${data.agree || ''}
      )
      RETURNING id, email, created_at
    `;

    return res.status(201).json({
      success: true,
      message: 'Demande enregistrée avec succès',
      submission: result[0]
    });

  } catch (error) {
    console.error('Submit error:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
}

