import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'microfinance-secret-key-change-in-production';

// Administrateur unique (hardcodé)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'wabogeovani02@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VaNeLlE@20';

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Vérifier les identifiants
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: 1, email: ADMIN_EMAIL },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      admin: { email: ADMIN_EMAIL }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
}
