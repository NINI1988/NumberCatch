import { writeFileSync } from 'node:fs';

const url = process.env.NG_APP_SUPABASE_URL ?? '';
const key = process.env.NG_APP_SUPABASE_ANON_KEY ?? '';
const content = `export const environment = { production: true, supabaseUrl: ${JSON.stringify(url)}, supabaseAnonKey: ${JSON.stringify(key)} } as const;\n`;
writeFileSync('src/environments/environment.prod.ts', content);
