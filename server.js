import express from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { neon } from '@neondatabase/serverless';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ========== CHARGEMENT .env.local ==========
function loadLocalEnv() {
  const envPath = path.resolve(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env.local non trouvé. Utilisation des variables d\'environnement système.');
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}
loadLocalEnv();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'microfinance-secret-key-change-in-production';

// Vérification de DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ ERREUR: La variable DATABASE_URL n\'est pas définie.');
  console.error('   Créez un fichier .env.local avec: DATABASE_URL=postgresql://...');
  process.exit(1);
}

// Connexion à Neon PostgreSQL
const sql = neon(process.env.DATABASE_URL);

// ========== INITIALISATION DE LA BASE DE DONNÉES ==========
async function initDatabase() {
  try {
    console.log('📡 Connexion à Neon PostgreSQL...');

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
    console.log('✅ Table "submissions" prête');

    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `;
    console.log('✅ Table "admins" prête');

    const adminEmail = (process.env.ADMIN_EMAIL || 'wabogeovani02@gmail.com').trim();
    const adminPassword = (process.env.ADMIN_PASSWORD || 'VaNeLlE@20').trim();
    const hash = bcrypt.hashSync(adminPassword, 10);

    const existing = await sql`SELECT id FROM admins WHERE email = ${adminEmail}`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO admins (email, password_hash)
        VALUES (${adminEmail}, ${hash})
      `;
      console.log('✅ Compte admin créé');
    } else {
      await sql`
        UPDATE admins SET password_hash = ${hash}
        WHERE email = ${adminEmail}
      `;
      console.log('✅ Compte admin synchronisé');
    }

    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur d\'initialisation de la base de données:', error);
    process.exit(1);
  }
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (index.html, images)
app.use(express.static(path.join(__dirname)));

// ========== ENVOI EMAIL GMAIL SMTP ==========
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

async function sendNotificationEmail(subject, htmlContent) {
  const tr = getTransporter();
  if (!tr) return;

  // Destinataires : les deux emails administrateurs
  const recipients = ['Lenewnico2@gmail.com', 'wabogeovani02@gmail.com'];

  for (const toEmail of recipients) {
    try {
      const info = await tr.sendMail({
        from: `"Microfinance Officielle" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: subject,
        html: htmlContent
      });
      console.log(`✅ Email envoyé à ${toEmail} (ID: ${info.messageId})`);
    } catch (err) {
      console.warn(`⚠️ Erreur envoi email à ${toEmail}:`, err.message);
    }
  }
}

// Fonction pour formatter l'email de notification
function formatEmailHtml(data) {
  const waLink = `https://wa.me/639071042504?text=Nouveau%20client%3A%20${encodeURIComponent(data.fullName || '')}%20-%20${encodeURIComponent(data.phone || '')}%20-%20${data.loanAmount || ''}%20FCFA`;
  
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#2dd4bf,#60a5fa);padding:20px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#001018;margin:0;font-size:22px;">📩 Nouvelle Demande de Prêt</h1>
      </div>
      <div style="background:#f8f9fa;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e9ecef;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Nom</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.fullName || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Email</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.email || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Téléphone</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.phone || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Montant</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.loanAmount || '-'} FCFA</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Emploi</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.job || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #dee2e6;font-weight:bold;color:#333;">Objet</td><td style="padding:8px;border-bottom:1px solid #dee2e6;">${data.purpose || '-'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#333;">Date</td><td style="padding:8px;">${new Date().toLocaleString('fr-FR')}</td></tr>
        </table>
        <div style="margin-top:20px;text-align:center;">
          <a href="http://localhost:${process.env.PORT || 3001}/#admin" style="display:inline-block;background:#2dd4bf;color:#001018;padding:12px 32px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:16px;">🔐 Voir dans l'Admin</a>
        </div>
        <div style="margin-top:12px;text-align:center;">
          <a href="${waLink}" style="display:inline-block;background:#25D366;color:white;padding:12px 32px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:16px;">💬 Contacter sur WhatsApp</a>
        </div>
      </div>
    </div>
  `;
}

// ========== API ROUTES ==========

// POST /api/submit - Soumettre le formulaire
app.post('/api/submit', async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.email || !data.fullName) {
      return res.status(400).json({ error: 'Email et nom complet requis' });
    }

    // Vérifier si l'email existe déjà
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

    // Envoyer email de notification Gmail aux deux administrateurs (fire & forget)
    const subject = `📩 Nouvelle demande - ${data.fullName || 'Inconnu'} - ${data.loanAmount || ''} FCFA`;
    const html = formatEmailHtml(data);
    sendNotificationEmail(subject, html);

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
});

// POST /api/login - Connexion admin
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const admins = await sql`
      SELECT id, email, password_hash FROM admins WHERE LOWER(email) = LOWER(${email.trim()})
    `;

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const admin = admins[0];
    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      admin: { email: admin.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// GET /api/responses - Liste des soumissions
app.get('/api/responses', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    const filterEmail = req.query.email?.trim().toLowerCase() || '';

    let submissions;
    if (filterEmail) {
      submissions = await sql`
        SELECT id, email, full_name, phone, loan_amount, created_at
        FROM submissions
        WHERE LOWER(email) LIKE ${'%' + filterEmail + '%'}
        ORDER BY created_at DESC
      `;
    } else {
      submissions = await sql`
        SELECT id, email, full_name, phone, loan_amount, created_at
        FROM submissions
        ORDER BY created_at DESC
      `;
    }

    return res.status(200).json({
      success: true,
      submissions
    });

  } catch (error) {
    console.error('Responses error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// GET /api/response/:id - Détail d'une soumission
app.get('/api/response/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'ID requis' });
    }

    const submissions = await sql`
      SELECT * FROM submissions WHERE id = ${id}
    `;

    if (submissions.length === 0) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }

    return res.status(200).json({
      success: true,
      submission: submissions[0]
    });

  } catch (error) {
    console.error('Response detail error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// DELETE /api/delete - Supprimer une soumission
app.delete('/api/delete', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    const rawId = req.body?.id || req.query?.id;
    const parsedId = parseInt(rawId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({ error: 'ID requis' });
    }

    await sql`DELETE FROM submissions WHERE id = ${parsedId}`;

    return res.status(200).json({
      success: true,
      message: 'Soumission supprimée avec succès'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Rediriger toutes les autres routes vers index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrer le serveur (après initialisation de la base de données)
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=== SERVEUR MICROFINANCE OFFICIELLE ===`);
    console.log(`URL locale : http://localhost:${PORT}`);
    console.log(`Adresse IP locale : http://192.168.1.x:${PORT}`);
    console.log(`(Remplacez 192.168.1.x par votre vraie adresse IP)`);
    console.log(`Identifiants admin :`);
    console.log(`  Email : wabogeovani02@gmail.com`);
    console.log(`  Mot de passe : VaNeLlE@20`);
    console.log(`Base de données : Neon PostgreSQL ✅`);
    console.log(`====================================`);
  });
}).catch((err) => {
  console.error('❌ Impossible de démarrer le serveur:', err);
  process.exit(1);
});

