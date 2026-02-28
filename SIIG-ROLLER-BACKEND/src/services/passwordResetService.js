const crypto = require('crypto');

const RESET_TTL_MS = 10 * 60 * 1000; // 10 minutos
const MAX_ATTEMPTS = 5;

class PasswordResetService {
  constructor() {
    this.store = new Map();
  }

  normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  generateToken() {
    return crypto.randomBytes(24).toString('hex');
  }

  createReset(email) {
    const normalized = this.normalizeEmail(email);
    const code = this.generateCode();
    const entry = {
      code,
      expiresAt: Date.now() + RESET_TTL_MS,
      attempts: 0,
      token: null,
      verified: false,
    };
    this.store.set(normalized, entry);
    return {code, expiresAt: entry.expiresAt};
  }

  verifyCode(email, code) {
    const normalized = this.normalizeEmail(email);
    const entry = this.store.get(normalized);
    if (!entry) {
      return {success: false, error: 'Código no encontrado'};
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(normalized);
      return {success: false, error: 'El código expiró'};
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
      this.store.delete(normalized);
      return {success: false, error: 'Se excedieron los intentos permitidos'};
    }
    if (entry.code !== String(code)) {
      entry.attempts += 1;
      return {success: false, error: 'Código incorrecto'};
    }
    entry.verified = true;
    entry.token = this.generateToken();
    return {success: true, token: entry.token};
  }

  consumeToken(email, token) {
    const normalized = this.normalizeEmail(email);
    const entry = this.store.get(normalized);
    if (!entry) {
      return {success: false, error: 'Solicitud no encontrada'};
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(normalized);
      return {success: false, error: 'El código expiró'};
    }
    if (!entry.verified || entry.token !== token) {
      return {success: false, error: 'Token inválido'};
    }
    this.store.delete(normalized);
    return {success: true};
  }
}

module.exports = new PasswordResetService();
