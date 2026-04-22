const path = require('path');
const fs = require('fs');

const salesDir = path.join(__dirname, '..', '..', 'uploads', 'marketing');
const salesFilePath = path.join(salesDir, 'sales.json');

const ensureStorage = () => {
  fs.mkdirSync(salesDir, {recursive: true});
  if (!fs.existsSync(salesFilePath)) {
    fs.writeFileSync(salesFilePath, '[]', 'utf8');
  }
};

const readSales = () => {
  try {
    ensureStorage();
    const raw = fs.readFileSync(salesFilePath, 'utf8');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error leyendo marketing sales:', error);
    return [];
  }
};

const writeSales = (sales) => {
  try {
    ensureStorage();
    fs.writeFileSync(salesFilePath, JSON.stringify(sales, null, 2), 'utf8');
  } catch (error) {
    console.error('Error guardando marketing sales:', error);
    throw error;
  }
};

const sortByCreatedDesc = (list) =>
  [...list].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime(),
  );

/**
 * GET /api/marketing/sales — catálogo público (todos los usuarios ven lo mismo)
 */
const listSales = async (req, res) => {
  try {
    const sales = sortByCreatedDesc(readSales());
    res.json({success: true, sales});
  } catch (error) {
    console.error('listSales:', error);
    res.status(500).json({success: false, error: 'Error al listar ventas'});
  }
};

/**
 * POST /api/marketing/sales — requiere JWT; ownerUserId = usuario autenticado
 */
const createSale = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      brandModel,
      priceMx,
      category,
      photoUri,
      photoUris: rawPhotoUris,
      homeDelivery,
      deliveryFeeMx,
      saleType,
      listingFeeMx,
    } = req.body;

    let photoUris = Array.isArray(rawPhotoUris)
      ? rawPhotoUris.filter((u) => u && String(u).trim() !== '').map((u) => String(u))
      : [];
    if (photoUris.length === 0 && photoUri) {
      photoUris = [String(photoUri)];
    }

    if (!brandModel || String(brandModel).trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Marca / modelo es requerido',
      });
    }

    const item = {
      id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      brandModel: String(brandModel).trim(),
      priceMx: priceMx != null ? String(priceMx) : '',
      category: category != null ? String(category) : '',
      photoUri: photoUris[0] || (photoUri ? String(photoUri) : null),
      photoUris: photoUris.length > 0 ? photoUris : null,
      createdAt: new Date().toISOString(),
      homeDelivery: Boolean(homeDelivery),
      deliveryFeeMx: Number(deliveryFeeMx) || 0,
      saleType: saleType || 'gratis',
      listingFeeMx: Number(listingFeeMx) || 0,
      ownerUserId: String(userId),
    };

    const all = readSales();
    all.unshift(item);
    writeSales(all);
    res.status(201).json({success: true, sale: item});
  } catch (error) {
    console.error('createSale:', error);
    res.status(500).json({success: false, error: 'Error al publicar'});
  }
};

/**
 * DELETE /api/marketing/sales/:id — solo el dueño
 */
const deleteSale = async (req, res) => {
  try {
    const {id} = req.params;
    const userId = String(req.userId);
    const all = readSales();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({success: false, error: 'Publicación no encontrada'});
    }
    if (String(all[idx].ownerUserId) !== userId) {
      return res.status(403).json({success: false, error: 'No autorizado'});
    }
    all.splice(idx, 1);
    writeSales(all);
    res.json({success: true});
  } catch (error) {
    console.error('deleteSale:', error);
    res.status(500).json({success: false, error: 'Error al eliminar'});
  }
};

/**
 * PUT /api/marketing/sales/:id — solo el dueño (campos editables en Menú ventas)
 */
const updateSale = async (req, res) => {
  try {
    const {id} = req.params;
    const userId = String(req.userId);
    const {brandModel, priceMx, category} = req.body;
    const all = readSales();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({success: false, error: 'Publicación no encontrada'});
    }
    if (String(all[idx].ownerUserId) !== userId) {
      return res.status(403).json({success: false, error: 'No autorizado'});
    }
    const prev = all[idx];
    all[idx] = {
      ...prev,
      brandModel:
        brandModel != null && String(brandModel).trim() !== ''
          ? String(brandModel).trim()
          : prev.brandModel,
      priceMx:
        priceMx != null && String(priceMx).trim() !== ''
          ? String(priceMx).trim()
          : prev.priceMx,
      category:
        category != null && String(category).trim() !== ''
          ? String(category).trim()
          : prev.category,
    };
    writeSales(all);
    res.json({success: true, sale: all[idx]});
  } catch (error) {
    console.error('updateSale:', error);
    res.status(500).json({success: false, error: 'Error al actualizar'});
  }
};

module.exports = {
  listSales,
  createSale,
  deleteSale,
  updateSale,
};
