const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const file = path.resolve('config.json');
const local = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const list = value => String(value || '').split(',').map(x => x.trim()).filter(Boolean);
const baseUrl = process.env.BASE_URL || local.baseUrl || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
const raw = {
  port: Number(process.env.PORT || local.port || 3000), baseUrl,
  databaseUrl: process.env.DATABASE_URL || local.databaseUrl || 'mysql://invalid:invalid@127.0.0.1:3306/unconfigured',
  sessionSecret: process.env.SESSION_SECRET || local.sessionSecret || 'configure-session-secret-in-vercel-32-chars',
  corsOrigins: process.env.CORS_ORIGINS ? list(process.env.CORS_ORIGINS) : (local.corsOrigins || [baseUrl]),
  adminDiscordIds: process.env.ADMIN_DISCORD_IDS ? list(process.env.ADMIN_DISCORD_IDS) : (local.adminDiscordIds || []),
  discord: { clientId: process.env.DISCORD_CLIENT_ID || local.discord?.clientId || '', clientSecret: process.env.DISCORD_CLIENT_SECRET || local.discord?.clientSecret || '', callbackUrl: process.env.DISCORD_CALLBACK_URL || local.discord?.callbackUrl || `${baseUrl}/auth/discord/callback` },
  mercadoPago: { accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || local.mercadoPago?.accessToken || '', webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || local.mercadoPago?.webhookSecret || '', sandbox: String(process.env.MERCADOPAGO_SANDBOX ?? local.mercadoPago?.sandbox ?? true) === 'true' },
  upload: local.upload || { maxBytes: 4000000, allowedExtensions: ['.zip'], retentionDays: 1 }, downloads: local.downloads || { ttlMinutes: 30 }, trustProxy: process.env.VERCEL === '1' || local.trustProxy === true
};
const schema = z.object({ port:z.number().positive(),baseUrl:z.string().url(),databaseUrl:z.string(),sessionSecret:z.string().min(32),corsOrigins:z.array(z.string()),adminDiscordIds:z.array(z.string()),discord:z.object({clientId:z.string(),clientSecret:z.string(),callbackUrl:z.string().url()}),mercadoPago:z.object({accessToken:z.string(),webhookSecret:z.string(),sandbox:z.boolean()}),upload:z.any(),downloads:z.any(),trustProxy:z.boolean() });
const config = schema.parse(raw);
process.env.DATABASE_URL = config.databaseUrl;
module.exports = config;
