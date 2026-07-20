#!/usr/bin/env node

/**
 * Script de test de connexion à la base de données Neon
 * Usage: node test-db-connection.js
 */

import { neon } from '@neondatabase/serverless';

async function testConnection() {
  console.log('🔍 Test de connexion à Neon...\n');

  // Vérifier que DATABASE_URL est défini
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERREUR: La variable DATABASE_URL n\'est pas définie.');
    console.error('\n📝 Solution:');
    console.error('   1. Créez un fichier .env.local à la racine du projet');
    console.error('   2. Ajoutez: DATABASE_URL=postgresql://...');
    console.error('   3. Obtenez l\'URI depuis: https://console.neon.tech\n');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL trouvée\n');

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Test 1: Connexion simple
    console.log('📡 Test 1: Connexion basique...');
    const versionResult = await sql`SELECT version()`;
    console.log('✅ Connexion réussie!');
    console.log(`   PostgreSQL: ${versionResult[0].version.split(',')[0]}\n`);

    // Test 2: Vérifier les tables
    console.log('📋 Test 2: Vérifier les tables...');
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    if (tablesResult.length === 0) {
      console.log('   ⚠️  Aucune table trouvée (base vide)');
      console.log('   → Les tables seront créées automatiquement au premier appel\n');
    } else {
      console.log(`✅ Trouvées ${tablesResult.length} table(s):`);
      tablesResult.forEach(t => console.log(`   - ${t.table_name}`));
      console.log();
    }

    // Test 3: Essayer d'initialiser la DB
    console.log('🔧 Test 3: Initialiser la base de données...');
    
    // Créer les tables si elles n'existent pas
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Tables créées/vérifiées avec succès\n');

    // Test 4: Vérifier les données
    console.log('📊 Test 4: Nombre de soumissions...');
    const countResult = await sql`SELECT COUNT(*) as count FROM submissions`;
    console.log(`✅ Trouvées ${countResult[0].count} soumission(s)\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TOUS LES TESTS RÉUSSIS!');
    console.log('Votre application est correctement liée à Neon.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ ERREUR DE CONNEXION:\n');
    console.error(error.message || error);
    
    console.error('\n📝 Dépannage:');
    console.error('   1. Vérifiez que le DATABASE_URL est correct');
    console.error('   2. Vérifiez que Neon est actif (console.neon.tech)');
    console.error('   3. Vérifiez votre connexion internet');
    console.error('   4. Si en prod, vérifiez les env vars dans Vercel\n');
    
    process.exit(1);
  }
}

testConnection();
