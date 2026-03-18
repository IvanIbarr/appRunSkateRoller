const path = require('path');
const fs = require('fs');

const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_ACTIVE_MS = 48 * 60 * 60 * 1000;
const tipsFilePath = path.join(__dirname, '..', '..', 'uploads', 'rollertips', 'rollertips.json');
const allowedReactions = ['like', 'corazon', 'asombro', 'tristeza', 'risa', 'me_encanta'];

const readTips = () => {
  try {
    if (!fs.existsSync(tipsFilePath)) {
      return [];
    }
    const raw = fs.readFileSync(tipsFilePath, 'utf8');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error leyendo rollertips:', error);
    return [];
  }
};

const writeTips = (tips) => {
  try {
    fs.writeFileSync(tipsFilePath, JSON.stringify(tips, null, 2));
  } catch (error) {
    console.error('Error guardando rollertips:', error);
  }
};

const buildTipResponse = (req, tip) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const fileUrl = `/uploads/rollertips/${tip.fileName}`;
  return {
    ...tip,
    url: `${host}${fileUrl}`,
    reactions: tip.reactions || {},
  };
};

const ensureTipTimestamps = (tip) => {
  const createdAt = tip.createdAt ? new Date(tip.createdAt) : new Date();
  const expiresAt = tip.expiresAt
    ? new Date(tip.expiresAt)
    : new Date(createdAt.getTime() + MAX_ACTIVE_MS);
  return {
    ...tip,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

const applyExpiration = (tips) => {
  const now = Date.now();
  let changed = false;
  const updated = tips.map((tip) => {
    const normalized = ensureTipTimestamps(tip);
    if (normalized.status !== 'archived' && new Date(normalized.expiresAt).getTime() <= now) {
      changed = true;
      return {
        ...normalized,
        status: 'archived',
        archivedAt: new Date().toISOString(),
      };
    }
    return normalized;
  });
  if (changed) {
    writeTips(updated);
  }
  return updated;
};

const listRollerTips = async (req, res) => {
  try {
    const scope = (req.query.scope || 'active').toString();
    const tips = applyExpiration(readTips());
    const filtered = scope === 'all'
      ? tips
      : tips.filter((tip) => (tip.status || 'active') === scope);
    const response = filtered.map((tip) => buildTipResponse(req, tip));
    return res.json({success: true, data: response});
  } catch (error) {
    console.error('Error en listRollerTips:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

const listRollerTipsByUser = async (req, res) => {
  try {
    const {userId} = req.params;
    const scope = (req.query.scope || 'active').toString();
    const tips = applyExpiration(readTips());
    const byUser = tips.filter((tip) => tip.uploadedBy === userId);

    if (scope === 'archived' && (!req.userId || req.userId !== userId)) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para ver archivos privados',
      });
    }

    const filtered = scope === 'all'
      ? byUser
      : byUser.filter((tip) => (tip.status || 'active') === scope);
    const response = filtered.map((tip) => buildTipResponse(req, tip));
    return res.json({success: true, data: response});
  } catch (error) {
    console.error('Error en listRollerTipsByUser:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

const deleteRollerTip = async (req, res) => {
  try {
    const {id} = req.params;
    const tips = readTips();
    const idx = tips.findIndex((tip) => tip.id === id);
    if (idx === -1) {
      return res.status(404).json({
        success: false,
        error: 'Video no encontrado',
      });
    }

    const tip = tips[idx];
    if (!tip.uploadedBy || tip.uploadedBy !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para eliminar este video',
      });
    }

    const filePath = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'rollertips',
      tip.fileName,
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    tips.splice(idx, 1);
    writeTips(tips);

    return res.json({
      success: true,
      message: 'Video eliminado correctamente',
    });
  } catch (error) {
    console.error('Error en deleteRollerTip:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};
const addReaction = async (req, res) => {
  try {
    const {id} = req.params;
    const {reaction} = req.body || {};

    if (!allowedReactions.includes(reaction)) {
      return res.status(400).json({
        success: false,
        error: 'Reacción no válida',
      });
    }

    const tips = readTips();
    const idx = tips.findIndex((tip) => tip.id === id);
    if (idx === -1) {
      return res.status(404).json({
        success: false,
        error: 'Video no encontrado',
      });
    }

    const tip = tips[idx];
    tip.reactions = tip.reactions || {};
    tip.reactions[reaction] = (tip.reactions[reaction] || 0) + 1;
    tips[idx] = tip;
    writeTips(tips);

    return res.json({
      success: true,
      data: buildTipResponse(req, tip),
    });
  } catch (error) {
    console.error('Error en addReaction:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

const createRollerTip = async (req, res) => {
  try {
    const description = (req.body.description || '').trim();

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video requerido',
      });
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        success: false,
        error: 'La descripción no puede exceder 1024 caracteres',
      });
    }

    const newTip = {
      id: req.file.filename,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      description,
      uploadedBy: req.userId || null,
      uploaderName: req.body.uploaderName || null,
      uploaderEmail: req.body.uploaderEmail || null,
      uploaderAlias: req.body.uploaderAlias || null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + MAX_ACTIVE_MS).toISOString(),
      status: 'active',
      reactions: {
        like: 0,
        corazon: 0,
        asombro: 0,
        tristeza: 0,
        risa: 0,
        me_encanta: 0,
      },
    };

    const tips = readTips();
    tips.unshift(newTip);
    writeTips(tips);

    return res.json({
      success: true,
      data: buildTipResponse(req, newTip),
    });
  } catch (error) {
    console.error('Error en createRollerTip:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

module.exports = {
  listRollerTips,
  listRollerTipsByUser,
  createRollerTip,
  addReaction,
  deleteRollerTip,
};
