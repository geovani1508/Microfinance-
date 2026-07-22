 import sql from './db.js';
import nodemailer from 'nodemailer';

// Transporteur Gmail (réutilisé)
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) {
    console.warn('⚠️ GMAIL_USER ou GMAIL_PASS non définis - Email non envoyé');
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
  return transporter;
}

async function sendNotificationEmail(data) {
  const tr = getTransporter();
  if (!tr) return;

  const recipients = ['Lenewnico2@gmail.com', 'wabogeovani02@gmail.com'];
  const adminEmail = process.env.NOTIFY_EMAIL;
  if (adminEmail && !recipients.some(r => r.toLowerCase() === adminEmail.toLowerCase())) {
    recipients.push(adminEmail);
  }

  const waLink = `https://wa.me/639071042504?text=Nouveau%20client%3A%20${encodeURIComponent(data.full_name || '')}%20-%20${encodeURIComponent(data.phone || '')}%20-%20${data.loan_amount || ''}%20FCFA`;

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#2dd4bf,#60a5fa);padding:20px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#001018;margin:0;font-size:22px;">📩 Nouvelle Demande de Prêt</h1>
      </div>
      <div style="background:#f8f9fa;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e9ecef;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Nom</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.full_name || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Email</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.email || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Téléphone</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.phone || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Montant</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.loan_amount || '-'} FCFA</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Emploi</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.job || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Objet</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.purpose || '-'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#333;">Date</td><td style="padding:8px;">${new Date().toLocaleString('fr-FR')}</td></tr>
        </table>
        <div style="margin-top:20px;text-align:center;">
          <a href="${process.env.APP_URL || 'https://microfinance-officielle.vercel.app'}/#admin" style="display:inline-block;background:#2dd4bf;color:#001018;padding:12px 32px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:16px;">🔐 Voir dans l'Admin</a>
        </div>
        <div style="margin-top:12px;text-align:center;">
          <a href="${waLink}" style="display:inline-block;background:#25D366;color:white;padding:12px 32px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:16px;">💬 Contacter sur WhatsApp</a>
        </div>
    </div>
  `;

  for (const toEmail of recipients) {
    try {
      const info = await tr.sendMail({
        from: `"Microfinance Officielle" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `📩 Nouvelle demande - ${data.full_name || 'Inconnu'} - ${data.loan_amount || ''} FCFA`,
        html: htmlContent
      });
      console.log(`✅ Email envoyé à ${toEmail} (ID: ${info.messageId})`);
    } catch (err) {
      console.warn(`⚠️ Erreur envoi email à ${toEmail}:`, err.message);
    }
  }
}

export default async function handler(req, res) {
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
    const data = req.body;

    if (!data.email || !data.fullName) {
      return res.status(400).json({ error: 'Email et nom complet requis' });
    }

    // Vérifier si l'email existe déjà dans Neon
    const existing = await sql`
      SELECT id FROM submissions WHERE LOWER(email) = LOWER(${data.email.trim()})
    `;

    let result;
    if (existing.length > 0) {
      // Mise à jour
      result = await sql`
        UPDATE submissions SET
          full_name = ${data.fullName?.trim() || ''},
          birth_date = ${data.birthDate || ''},
          address = ${data.address?.trim() || ''},
          phone = ${data.phone?.trim() || ''},
          id_doc = ${data.idDoc || ''},
          id_doc_file_name = ${data.idDocFileName || ''},
          id_doc_file_mime = ${data.idDocFileMime || ''},
          id_doc_file_base64 = ${data.idDocFileBase64 || ''},
          job = ${data.job?.trim() || ''},
          job_type = ${data.jobType || ''},
          income_monthly = ${data.incomeMonthly || ''},
          other_income = ${data.otherIncome || ''},
          loan_amount = ${data.loanAmount || ''},
          repayment_term = ${data.repaymentTerm || ''},
          previous_loan = ${data.previousLoan || ''},
          purpose = ${data.purpose?.trim() || ''},
          agree = ${data.agree || ''},
          created_at = NOW()
        WHERE LOWER(email) = LOWER(${data.email.trim()})
        RETURNING id, email, created_at
      `;
    } else {
      // Nouvelle insertion
      result = await sql`
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
    }

    // Envoyer l'email de notification (fire & forget)
    const submissionData = {
      email: data.email.trim(),
      full_name: data.fullName?.trim() || '',
      phone: data.phone?.trim() || '',
      loan_amount: data.loanAmount || '',
      job: data.job?.trim() || '',
      purpose: data.purpose?.trim() || ''
    };
    sendNotificationEmail(submissionData);

    const statusCode = existing.length > 0 ? 200 : 201;
    const message = existing.length > 0 ? 'Demande mise à jour avec succès' : 'Demande enregistrée avec succès';

    return res.status(statusCode).json({
      success: true,
      message,
      submission: result[0]
    });

  } catch (error) {
    console.error('Submit error:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
}

