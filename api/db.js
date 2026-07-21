import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

function loadLocalEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env.local')
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;

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

    break;
  }
}

loadLocalEnv();

const sql = neon(process.env.DATABASE_URL);

export default sql;

