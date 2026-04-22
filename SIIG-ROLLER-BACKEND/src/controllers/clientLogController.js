const logger = require('../utils/fileLogger');

function isIngestEnabled() {
  if (process.env.CLIENT_LOG_INGEST === 'false') {
    return false;
  }
  if (process.env.CLIENT_LOG_INGEST === 'true') {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
}

function clientLogSecretOk(req) {
  const secret = process.env.CLIENT_LOG_SECRET;
  if (!secret) {
    return true;
  }
  return req.get('X-Client-Log-Secret') === secret;
}

/**
 * POST /api/logs/client
 * Recibe eventos del front (web/native) para escribirlos en combined-*.log
 */
const ingest = (req, res) => {
  if (!isIngestEnabled()) {
    return res.status(404).json({success: false});
  }
  if (!clientLogSecretOk(req)) {
    return res.status(403).json({success: false, error: 'Forbidden'});
  }

  const body = req.body || {};
  const level = String(body.level || 'info').toLowerCase();
  const allowed = ['error', 'warn', 'info', 'debug'];
  const lvl = allowed.includes(level) ? level : 'info';

  const source =
    typeof body.source === 'string' ? body.source.slice(0, 48) : 'client';
  const screen =
    typeof body.screen === 'string' ? body.screen.slice(0, 120) : undefined;

  let message = '';
  if (typeof body.message === 'string') {
    message = body.message.slice(0, 8000);
  } else if (body.message != null) {
    message = String(body.message).slice(0, 500);
  }

  const context =
    body.context && typeof body.context === 'object' && !Array.isArray(body.context)
      ? body.context
      : undefined;

  const prefix = screen ? `[${screen}] ` : '';
  const line = `[CLIENT:${source}] ${prefix}${message}`;
  const meta = {
    clientIp: req.ip,
    ...(context ? {context} : {}),
  };
  if (lvl === 'error') {
    logger.error(line, meta);
  } else if (lvl === 'warn') {
    logger.warn(line, meta);
  } else if (lvl === 'debug') {
    logger.debug(line, meta);
  } else {
    logger.info(line, meta);
  }

  return res.status(204).end();
};

module.exports = {ingest};
