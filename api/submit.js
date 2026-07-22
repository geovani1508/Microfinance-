import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve('/tmp', 'submissions.json');

function readSubmissions() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erreur lecture fichier:', err);
  }
  return [];
}

function writeSubmissions(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Erreur écriture fichier:', err);
    return false;
  }
}

async function sendNotificationEmail(submission) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const notifyEmails = ['Lenewnico2@gmail.com'];
  const adminEmail = process.env.NOTIFY_EMAIL;
  if (adminEmail) notifyEmails.push(adminEmail);

  if (!BREVO_API_KEY) {
    console.warn('⚠️ BREVO_API_KEY non définie - Email non envoyé');
    return;
  }

  const waLink = `https://wa.me/639071042504?text=Nouveau%20client%3A%20${encodeURIComponent(submission.full_name || '')}%20-%20${encodeURIComponent(submission.phone || '')}%20-%20${submission.loan_amount || ''}%20FCFA`;

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#2dd4bf,#60a5fa);padding:20px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#001018;margin:0;font-size:22px;">📩 Nouvelle Demande de Prêt</h1>
      </div>
      <div style="background:#f8f9fa;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e9ecef;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Nom</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${submission.full_name || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Email</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${submission.email || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Téléphone</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${submission.phone || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Montant</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${submission.loan_amount || '-'} FCFA</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Emploi</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${submission.job || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Objet</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${submission.purpose || '-'}</td></tr>
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

  for (const toEmail of notifyEmails) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { email: 'wabogeovani02@gmail.com', name: 'Microfinance Officielle' },
          to: [{ email: toEmail }],
          subject: `📩 Nouvelle demande - ${submission.full_name || 'Inconnu'} - ${submission.loan_amount || ''} FCFA`,
          htmlContent: htmlContent
        })
      });

      if (response.ok) {
        console.log(`✅ Email envoyé à ${toEmail}`);
      } else {
        const err = await response.text();
        console.warn(`⚠️ Erreur envoi à ${toEmail}:`, err);
      }
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

    const submission = {
      id: Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
      email: data.email.trim(),
      full_name: data.fullName?.trim() || '',
      birth_date: data.birthDate || '',
      address: data.address?.trim() || '',
      phone: data.phone?.trim() || '',
      id_doc: data.idDoc || '',
      id_doc_file_name: data.idDocFileName || '',
      id_doc_file_mime: data.idDocFileMime || '',
      id_doc_file_base64: data.idDocFileBase64 || '',
      job: data.job?.trim() || '',
      job_type: data.jobType || '',
      income_monthly: data.incomeMonthly || '',
      other_income: data.otherIncome || '',
      loan_amount: data.loanAmount || '',
      repayment_term: data.repaymentTerm || '',
      previous_loan: data.previousLoan || '',
      purpose: data.purpose?.trim() || '',
      agree: data.agree || '',
      created_at: new Date().toISOString()
    };

    const submissions = readSubmissions();

    const existingIndex = submissions.findIndex(
      s => s.email?.toLowerCase() === submission.email.toLowerCase()
    );

    if (existingIndex >= 0) {
      submissions[existingIndex] = submission;
    } else {
      submissions.push(submission);
    }

    const saved = writeSubmissions(submissions);

    if (!saved) {
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }

    // Envoyer l'email de notification (ne bloque pas la réponse)
    sendNotificationEmail(submission);

    return res.status(existingIndex >= 0 ? 200 : 201).json({
      success: true,
      message: existingIndex >= 0 ? 'Demande mise à jour avec succès' : 'Demande enregistrée avec succès',
      submission: { id: submission.id, email: submission.email, created_at: submission.created_at }
    });

  } catch (error) {
    console.error('Submit error:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
}
