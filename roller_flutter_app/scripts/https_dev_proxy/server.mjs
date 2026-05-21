/**
 * Proxy HTTPS local: Flutter (8080) + API/Socket.IO (3001) en un solo origen.
 * Necesario para GPS en Safari iOS (requiere HTTPS y sin mixed-content).
 */
import express from 'express';
import https from 'node:https';
import { createProxyMiddleware } from 'http-proxy-middleware';
import selfsigned from 'selfsigned';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEV_IP = process.env.DEV_IP || '192.168.1.79';
const HTTPS_PORT = Number(process.env.HTTPS_PORT || 8443);
const FLUTTER_TARGET = process.env.FLUTTER_TARGET || 'http://127.0.0.1:8080';
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:3001';

const certDir = join(__dirname, '.certs');
mkdirSync(certDir, { recursive: true });

const attrs = [{ name: 'commonName', value: 'RunSkateRoller Dev' }];
const pems = selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: DEV_IP },
      ],
    },
  ],
});

const keyPath = join(certDir, 'dev-key.pem');
const certPath = join(certDir, 'dev-cert.pem');
writeFileSync(keyPath, pems.private);
writeFileSync(certPath, pems.cert);

/** Express quita el prefijo del mount; el backend espera /api/..., /uploads/..., etc. */
const pathWithPrefix = (prefix) => (path) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p === prefix || p.startsWith(`${prefix}/`)) return p;
  return `${prefix}${p}`;
};

const apiProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  ws: true,
  pathRewrite: pathWithPrefix('/api'),
});

const uploadsProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  pathRewrite: pathWithPrefix('/uploads'),
});

const healthProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  pathRewrite: pathWithPrefix('/health'),
});

const socketProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  ws: true,
  pathRewrite: pathWithPrefix('/socket.io'),
});

const app = express();
app.use('/api', apiProxy);
app.use('/uploads', uploadsProxy);
app.use('/health', healthProxy);
app.use('/socket.io', socketProxy);
app.use('/', createProxyMiddleware({ target: FLUTTER_TARGET, changeOrigin: true, ws: true }));

https
  .createServer({ key: pems.private, cert: pems.cert }, app)
  .listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log('');
    console.log('RunSkateRoller HTTPS dev proxy');
    console.log(`  Móvil (GPS):  https://${DEV_IP}:${HTTPS_PORT}`);
    console.log(`  PC:           https://localhost:${HTTPS_PORT}`);
    console.log(`  Flutter ←    ${FLUTTER_TARGET}`);
    console.log(`  API ←        ${API_TARGET}`);
    console.log('');
    console.log('En iPhone: acepta el aviso de certificado no confiable la primera vez.');
    console.log('Luego: Ajustes → Safari → Ubicación → Permitir para este sitio.');
  });
