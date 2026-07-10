const fs = require('fs');
const crypto = require('crypto');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const productionUrl = process.argv[2] || 'https://decrypt-tebex.vercel.app';
const databaseIsPlaceholder = !config.databaseUrl || /user:password|usuario:senha|localhost/i.test(config.databaseUrl);

const values = {
  BASE_URL: productionUrl,
  DATABASE_URL: databaseIsPlaceholder ? 'COLOQUE_A_URL_DO_MYSQL_EXTERNO' : config.databaseUrl,
  SESSION_SECRET: config.sessionSecret?.length >= 32 ? config.sessionSecret : crypto.randomBytes(48).toString('hex'),
  CORS_ORIGINS: productionUrl,
  ADMIN_DISCORD_IDS: (config.adminDiscordIds || []).join(','),
  DISCORD_CLIENT_ID: config.discord?.clientId || 'COLOQUE_O_CLIENT_ID',
  DISCORD_CLIENT_SECRET: config.discord?.clientSecret || 'COLOQUE_O_CLIENT_SECRET',
  DISCORD_CALLBACK_URL: `${productionUrl}/auth/discord/callback`,
  MERCADOPAGO_ACCESS_TOKEN: config.mercadoPago?.accessToken || 'COLOQUE_O_ACCESS_TOKEN',
  MERCADOPAGO_WEBHOOK_SECRET: config.mercadoPago?.webhookSecret || 'COLOQUE_O_WEBHOOK_SECRET',
  MERCADOPAGO_SANDBOX: String(config.mercadoPago?.sandbox ?? true)
};

const quote = value => JSON.stringify(String(value));
fs.writeFileSync('.env.vercel', Object.entries(values).map(([key, value]) => `${key}=${quote(value)}`).join('\n') + '\n', { mode: 0o600 });
console.log('.env.vercel criado. Complete os valores COLOQUE_* antes de importar.');
