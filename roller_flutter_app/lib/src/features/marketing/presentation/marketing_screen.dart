import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/ui/rn_layered_styles.dart';
import '../../../core/ui/rn_mirror_layouts.dart';
import '../../../core/ui/rn_shell_bottom_tab_bar.dart';
import '../../../core/ui/user_profile_avatar.dart';
import '../../perfil/data/perfil_providers.dart';
import '../data/marketing_repository.dart';
import '../models/marketing_checkout_draft.dart';
import 'widgets/marketing_sale_image.dart';

final marketingSalesProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(marketingRepositoryProvider).listSales();
});

final _marketingMeProvider = currentMeProvider;

const _alexAzcapoUserId = 'user-alex-azcapo';

List<List<T>> _chunkPairs<T>(List<T> items) {
  final rows = <List<T>>[];
  for (var i = 0; i < items.length; i += 2) {
    rows.add(items.sublist(i, i + 2 > items.length ? items.length : i + 2));
  }
  return rows;
}

List<String> _galleryUrisForSale(Map<String, dynamic> item) {
  final uris = item['photoUris'];
  if (uris is List && uris.isNotEmpty) {
    return uris.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
  }
  final single = (item['photoUri'] ?? '').toString().trim();
  if (single.isNotEmpty) return [single];
  return [];
}

bool _isAlexAzcapoProfile(Map<String, dynamic>? u) {
  if (u == null) return false;
  if (u['id']?.toString() == _alexAzcapoUserId) return true;
  final e = (u['email'] ?? '').toString().toLowerCase().trim();
  if (e == 'alex.azcapo@roller.com') return true;
  final a = (u['alias'] ?? '').toString().trim().toLowerCase();
  return a == 'alex azcapo';
}

bool _userOwnsMarketingSale(String? saleOwnerId, Map<String, dynamic>? me) {
  if (me == null || saleOwnerId == null || saleOwnerId.isEmpty) return false;
  if (saleOwnerId == me['id']?.toString()) return true;
  if (saleOwnerId == _alexAzcapoUserId && _isAlexAzcapoProfile(me)) return true;
  return false;
}

/// Espejo de `MarketingScreen.tsx` (container, overlay, content, header, card, salesRow, saleCard, modales).
class MarketingScreen extends ConsumerStatefulWidget {
  const MarketingScreen({super.key});

  @override
  ConsumerState<MarketingScreen> createState() => _MarketingScreenState();
}

class _MarketingScreenState extends ConsumerState<MarketingScreen> {
  bool _showProposalInfo = false;
  bool _showSellModal = false;
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(marketingSalesProvider);
    final meAsync = ref.watch(_marketingMeProvider);

    return _shell(
      child: async.when(
        data: (items) => meAsync.when(
          data: (me) => _scrollBody(
            sales: items,
            me: me,
          ),
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(48),
              child: CircularProgressIndicator(color: Color(0xFF38BDF8)),
            ),
          ),
          error: (_, _) => _scrollBody(sales: items, me: null),
        ),
        loading: () => const Center(
          child: Padding(
            padding: EdgeInsets.all(48),
            child: CircularProgressIndicator(color: Color(0xFF38BDF8)),
          ),
        ),
        error: (_, _) => meAsync.when(
          data: (me) => _scrollBody(sales: const [], me: me),
          loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8))),
          error: (_, _) => _scrollBody(sales: const [], me: null),
        ),
      ),
    );
  }

  Widget _shell({required Widget child}) {
    return RnMirrorBrandTabLayout(
      overlay: const Color.fromRGBO(10, 12, 24, 0.6),
      overlays: [
        if (_showProposalInfo) _proposalModal(),
        if (_showSellModal) _sellModal(),
      ],
      child: child,
    );
  }

  Widget _scrollBody({
    required List<Map<String, dynamic>> sales,
    required Map<String, dynamic>? me,
  }) {
    return RefreshIndicator(
      color: const Color(0xFF38BDF8),
      onRefresh: () async {
        ref.invalidate(marketingSalesProvider);
        ref.invalidate(_marketingMeProvider);
        await ref.read(marketingSalesProvider.future);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          RnBottomNavigationSlot.totalHeight + 40,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _header(me),
            const SizedBox(height: 16),
            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Panel en construcción',
                    style: GoogleFonts.permanentMarker(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFF8FAFC),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _actionButton(
                          icon: '🛒',
                          label: 'Vender',
                          onTap: () {
                            setState(() => _showSellModal = true);
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _actionButton(
                          icon: '🧩',
                          label: 'Categoria',
                          onTap: () {},
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Búsqueda',
                    style: GoogleFonts.permanentMarker(
                      fontSize: 12,
                      color: const Color(0xFFE2E8F0),
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _searchCtrl,
                    style: const TextStyle(color: Color(0xFFF8FAFC), fontSize: 13),
                    cursorColor: Color(0xFF38BDF8),
                    decoration: RnLayeredStyles.textField(
                      hintText: 'Busca productos o vendedores...',
                      borderRadius: 10,
                    ).copyWith(isDense: true, contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14)),
                    minLines: 1,
                    maxLines: 1,
                  ),
                ],
              ),
            ),
            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Publicaciones recientes',
                    style: GoogleFonts.permanentMarker(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFF8FAFC),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Con el servidor activo, todas las cuentas ven el mismo listado en '
                    'tiempo real. Si no hay conexión al API, se usa solo el almacenamiento '
                    'de este dispositivo.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF94A3B8),
                      height: 17 / 12,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (sales.isEmpty)
                    const Text(
                      'Aún no hay publicaciones.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFFE2E8F0),
                        height: 18 / 13,
                      ),
                    )
                  else
                    ..._chunkPairs(sales).map((pair) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: _SalePublicationCard(
                                item: pair[0],
                                showComprar: !_userOwnsMarketingSale(
                                  pair[0]['ownerUserId']?.toString(),
                                  me,
                                ),
                                onComprar: () => _onComprar(context, pair[0]),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: pair.length > 1
                                  ? _SalePublicationCard(
                                      item: pair[1],
                                      showComprar: !_userOwnsMarketingSale(
                                        pair[1]['ownerUserId']?.toString(),
                                        me,
                                      ),
                                      onComprar: () => _onComprar(context, pair[1]),
                                    )
                                  : const _SaleCardPlaceholder(),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _onComprar(BuildContext context, Map<String, dynamic> it) {
    final saleId = (it['id'] ?? '').toString();
    final title = (it['brandModel'] ?? 'Producto').toString();
    final price = (it['priceMx'] ?? '').toString();
    final draft = MarketingCheckoutDraft(
      saleId: saleId,
      brandModel: title,
      priceMx: price.isEmpty ? '0' : price,
    );
    context.go('/marketing/comprar/envio', extra: draft);
  }

  Widget _header(Map<String, dynamic>? me) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(15, 23, 42, 0.55),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
      ),
      child: Row(
        children: [
          if (me != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: UserProfileAvatar.header(
                me,
                backgroundColor: const Color(0xFF1E293B),
              ),
            ),
          Expanded(
            child: Text(
              'Marketing',
              textAlign: TextAlign.center,
              style: GoogleFonts.permanentMarker(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: const Color(0xFFF8FAFC),
              ),
            ),
          ),
          Material(
            color: const Color.fromRGBO(15, 23, 42, 0.35),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.2)),
            ),
            child: InkWell(
              onTap: () => setState(() => _showProposalInfo = true),
              borderRadius: BorderRadius.circular(10),
              child: const Padding(
                padding: EdgeInsets.all(6),
                child: Text('ℹ️', style: TextStyle(fontSize: 16)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(15, 23, 42, 0.75),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
      ),
      child: child,
    );
  }

  Widget _actionButton({
    required String icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: const Color.fromRGBO(56, 189, 248, 0.12),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.4)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(icon, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF7DD3FC),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _proposalModal() {
    return Positioned.fill(
      child: Material(
        color: const Color.fromRGBO(2, 6, 23, 0.7),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Center(
            child: SingleChildScrollView(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color.fromRGBO(15, 23, 42, 0.95),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Propuesta de Marketing',
                      style: GoogleFonts.permanentMarker(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFF8FAFC),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _modalSection(
                      'Marketplace Roller',
                      'Venta de patines y accesorios nuevos o usados (kit de protección, '
                      'ropa, ruedas, herramientas). Catálogo con fotos, estado, talla, '
                      'compatibilidad y precio.',
                    ),
                    _modalSection(
                      'Flujo de compra segura',
                      '1) Publicar producto\n'
                      '2) Comprador paga y se retiene el dinero\n'
                      '3) Vendedor imprime guía y entrega a paquetería\n'
                      '4) Entrega confirmada\n'
                      '5) Pago liberado al vendedor menos comisión',
                    ),
                    _modalSection(
                      'Pagos y comisiones',
                      'Integración con Mercado Pago o PayPal. Se cobra comisión por '
                      'transacción (porcentaje + tarifa fija). La comisión se descuenta '
                      'antes de transferir al vendedor.',
                    ),
                    _modalSection(
                      'Envíos a domicilio',
                      'Solo envíos con guía tendrán costo extra y es generada por Mercado '
                      'Envíos, Estafeta, DHL o FedEx. El vendedor imprime la guía y deja '
                      'el paquete en la paquetería.',
                    ),
                    _modalSection(
                      'Seguridad y confianza',
                      'Verificación de identidad, reputación por ventas, reportes, '
                      'revisión de fotos y bloqueo de cuentas sospechosas.',
                    ),
                    _modalSection(
                      'Carrito y checkout',
                      'Carrito con múltiples productos, cálculo de envío, total final y '
                      'confirmación de compra. Historial de pedidos y estatus de envío.',
                    ),
                    _modalSection(
                      'Ingreso extra',
                      'Banner de anuncios para proveedores. Cobro mensual por presencia '
                      'destacada y opción de campañas por temporada.',
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Material(
                        color: const Color.fromRGBO(56, 189, 248, 0.12),
                        borderRadius: BorderRadius.circular(10),
                        child: InkWell(
                          onTap: () => setState(() => _showProposalInfo = false),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: const Color.fromRGBO(56, 189, 248, 0.5),
                              ),
                            ),
                            child: const Text(
                              'Cerrar',
                              style: TextStyle(
                                color: Color(0xFF7DD3FC),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _modalSection(String title, String body) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.permanentMarker(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: const Color(0xFFF8FAFC),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFFE2E8F0),
              height: 18 / 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _sellModal() {
    return Positioned.fill(
      child: Material(
        color: const Color.fromRGBO(2, 6, 23, 0.7),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color.fromRGBO(15, 23, 42, 0.95),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.12)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Publicar venta',
                    style: GoogleFonts.permanentMarker(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFF8FAFC),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Selecciona el tipo de publicación:',
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFFE2E8F0),
                      height: 18 / 13,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _sellTypeCard(
                          icon: '🛼',
                          label: 'Patines',
                          active: false,
                          onTap: () {
                            setState(() => _showSellModal = false);
                            context.go('/marketing/vender');
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _sellTypeCard(
                          icon: '🧩',
                          label: 'Accesorio',
                          active: false,
                          onTap: () {},
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Material(
                      color: const Color.fromRGBO(56, 189, 248, 0.12),
                      borderRadius: BorderRadius.circular(10),
                      child: InkWell(
                        onTap: () => setState(() => _showSellModal = false),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: const Color.fromRGBO(56, 189, 248, 0.5),
                            ),
                          ),
                          child: const Text(
                            'Cerrar',
                            style: TextStyle(
                              color: Color(0xFF7DD3FC),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _sellTypeCard({
    required String icon,
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return Material(
      color: active
          ? const Color.fromRGBO(56, 189, 248, 0.12)
          : const Color.fromRGBO(15, 23, 42, 0.5),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          height: 90,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: active
                  ? const Color.fromRGBO(56, 189, 248, 0.6)
                  : const Color.fromRGBO(255, 255, 255, 0.12),
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(icon, style: const TextStyle(fontSize: 22)),
              const SizedBox(height: 6),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFFE2E8F0),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SaleCardPlaceholder extends StatelessWidget {
  const _SaleCardPlaceholder();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 188,
      child: DecoratedBox(
        decoration: BoxDecoration(color: Colors.transparent),
      ),
    );
  }
}

class _SalePublicationCard extends StatefulWidget {
  const _SalePublicationCard({
    required this.item,
    required this.showComprar,
    required this.onComprar,
  });

  final Map<String, dynamic> item;
  final bool showComprar;
  final VoidCallback onComprar;

  @override
  State<_SalePublicationCard> createState() => _SalePublicationCardState();
}

class _SalePublicationCardState extends State<_SalePublicationCard> {
  bool _galleryOpen = false;
  int _galleryIndex = 0;

  @override
  Widget build(BuildContext context) {
    final gallery = _galleryUrisForSale(widget.item);
    final coverRaw = gallery.isNotEmpty ? gallery.first : '';
    final showPhoto = coverRaw.isNotEmpty;
    final brand = (widget.item['brandModel'] ?? '-').toString();
    final priceRaw = (widget.item['priceMx'] ?? '').toString();
    final priceLabel = priceRaw.isNotEmpty ? '\$$priceRaw MXN' : r'$0 MXN';
    final category = (widget.item['category'] ?? '—').toString();

    return SizedBox(
      height: 188,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (showPhoto)
              Positioned.fill(
                child: MarketingSaleImage(uri: coverRaw, fit: BoxFit.cover),
              )
            else
              const Positioned.fill(
                child: ColoredBox(
                  color: Color.fromRGBO(15, 23, 42, 0.92),
                  child: Center(
                    child: Text(
                      'Sin foto',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                    ),
                  ),
                ),
              ),
            const ColoredBox(color: Color.fromRGBO(2, 6, 23, 0.42)),
            if (gallery.isNotEmpty)
              Positioned(
                top: 8,
                right: 8,
                child: Material(
                  color: const Color.fromRGBO(15, 23, 42, 0.88),
                  borderRadius: BorderRadius.circular(20),
                  child: InkWell(
                    onTap: () => setState(() {
                      _galleryOpen = true;
                      _galleryIndex = 0;
                    }),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.45)),
                      ),
                      child: Text(
                        gallery.length > 1 ? '🔍 ${gallery.length} fotos' : '🔍 Ver foto',
                        style: const TextStyle(
                          color: Color(0xFFE0F2FE),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    brand,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      height: 15 / 12,
                      color: const Color(0xFFF8FAFC),
                      fontWeight: FontWeight.w700,
                      shadows: const [
                        Shadow(
                          color: Color.fromRGBO(0, 0, 0, 0.85),
                          offset: Offset(0, 1),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    priceLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      height: 16 / 13,
                      color: const Color(0xFF7DD3FC),
                      fontWeight: FontWeight.w700,
                      shadows: const [
                        Shadow(
                          color: Color.fromRGBO(0, 0, 0, 0.85),
                          offset: Offset(0, 1),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    category,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10,
                      height: 14 / 10,
                      color: const Color(0xFFE2E8F0),
                      shadows: const [
                        Shadow(
                          color: Color.fromRGBO(0, 0, 0, 0.8),
                          offset: Offset(0, 1),
                          blurRadius: 3,
                        ),
                      ],
                    ),
                  ),
                  if (widget.showComprar) ...[
                    const SizedBox(height: 8),
                    Material(
                      color: const Color.fromRGBO(34, 197, 94, 0.35),
                      borderRadius: BorderRadius.circular(10),
                      child: InkWell(
                        onTap: widget.onComprar,
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: const Color.fromRGBO(34, 197, 94, 0.55),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: const Text(
                            'Comprar',
                            style: TextStyle(
                              color: Color(0xFFBBF7D0),
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (_galleryOpen)
              _GalleryOverlay(
                title: brand,
                uris: gallery,
                initialIndex: _galleryIndex,
                onClose: () => setState(() => _galleryOpen = false),
                onIndexChanged: (i) => _galleryIndex = i,
              ),
          ],
        ),
      ),
    );
  }
}

class _GalleryOverlay extends StatefulWidget {
  const _GalleryOverlay({
    required this.title,
    required this.uris,
    required this.initialIndex,
    required this.onClose,
    required this.onIndexChanged,
  });

  final String title;
  final List<String> uris;
  final int initialIndex;
  final VoidCallback onClose;
  final void Function(int) onIndexChanged;

  @override
  State<_GalleryOverlay> createState() => _GalleryOverlayState();
}

class _GalleryOverlayState extends State<_GalleryOverlay> {
  late final PageController _ctrl;
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex.clamp(0, widget.uris.length - 1);
    _ctrl = PageController(initialPage: _index);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final winW = mq.size.width;
    final galleryH = (mq.size.height * 0.62).clamp(200.0, 420.0);

    return Positioned.fill(
      child: Material(
        color: const Color.fromRGBO(2, 6, 23, 0.94),
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                mq.padding.top > 0 ? mq.padding.top : 12,
                16,
                8,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title.isEmpty ? 'Producto' : widget.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFFF8FAFC),
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Material(
                    color: const Color.fromRGBO(248, 113, 113, 0.2),
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: widget.onClose,
                      child: Container(
                        width: 40,
                        height: 40,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color.fromRGBO(248, 113, 113, 0.45),
                          ),
                        ),
                        child: const Text(
                          '✕',
                          style: TextStyle(
                            color: Color(0xFFFCA5A5),
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: galleryH,
              child: PageView.builder(
                controller: _ctrl,
                itemCount: widget.uris.length,
                onPageChanged: (i) {
                  setState(() => _index = i);
                  widget.onIndexChanged(i);
                },
                itemBuilder: (context, i) {
                  return SizedBox(
                    width: winW,
                    height: galleryH,
                    child: Center(
                      child: MarketingSaleImage(
                        uri: widget.uris[i],
                        fit: BoxFit.contain,
                      ),
                    ),
                  );
                },
              ),
            ),
            if (widget.uris.length > 1)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(widget.uris.length, (i) {
                    final active = i == _index;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: active ? 18 : 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: active
                              ? const Color(0xFF38BDF8)
                              : const Color.fromRGBO(148, 163, 184, 0.45),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            Padding(
              padding: EdgeInsets.only(bottom: mq.padding.bottom > 0 ? mq.padding.bottom : 16),
              child: Text(
                '${_index + 1} / ${widget.uris.length}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
