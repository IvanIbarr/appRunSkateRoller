import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/maps/mapbox_service.dart';
import '../../../core/ui/app_theme.dart';
import '../../seguimiento/data/seguimiento_repository.dart';
import '../../recap/models/recap_input.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class InicioScreen extends ConsumerStatefulWidget {
  const InicioScreen({super.key});

  @override
  ConsumerState<InicioScreen> createState() => _InicioScreenState();
}

class _InicioScreenState extends ConsumerState<InicioScreen> {
  final _origenCtrl = TextEditingController();
  final _destinoCtrl = TextEditingController();

  // Centro default (CDMX aprox) para que siempre “se vea mapa”.
  LatLng _center = const LatLng(19.4326, -99.1332);
  List<LatLng> _route = [];
  double? _distance;
  double? _duration;
  bool _calculating = false;
  bool _tracking = false;
  String? _seguimientoId;
  bool _origenSeleccionado = false;
  String? _shareUrl;
  bool _showShareModal = false;

  @override
  void dispose() {
    _origenCtrl.dispose();
    _destinoCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // RN (NavegacionScreen.tsx) usa fondo patines y ScrollView.
    final titleStyle = GoogleFonts.permanentMarker(
      fontSize: 31,
      fontWeight: FontWeight.w700,
      color: const Color(0xFFFFFFFF),
      shadows: const [
        Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
      ],
    );
    final subtitleStyle = GoogleFonts.permanentMarker(
      fontSize: 21,
      fontWeight: FontWeight.w600,
      color: const Color(0xFFFFFFFF),
      shadows: const [
        Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
      ],
    );
    const labelWhite = TextStyle(
      color: Color(0xFFFFFFFF),
      shadows: [
        Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
      ],
    );

    Future<void> calcularRuta() async {
      if (_origenCtrl.text.trim().isEmpty || _destinoCtrl.text.trim().isEmpty) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Por favor ingresa origen y destino')));
        }
        return;
      }
      setState(() => _calculating = true);
      try {
        final r = await MapboxService.cyclingRoute(
          originText: _origenCtrl.text,
          destText: _destinoCtrl.text,
        );
        final pts = r.coordinates.map((e) => LatLng(e[1], e[0])).toList();
        setState(() {
          _route = pts;
          _distance = r.distanceMeters;
          _duration = r.durationSeconds;
          if (pts.isNotEmpty) _center = pts.first;
        });
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ruta: $e')));
        }
      } finally {
        if (mounted) setState(() => _calculating = false);
      }
    }

    Future<void> iniciarTracking() async {
      if (!_origenSeleccionado || _route.isEmpty) return;
      try {
        final s = await ref.read(seguimientoRepositoryProvider).create(
              origen: _origenCtrl.text,
              destino: _destinoCtrl.text,
            );
        final id = (s['id'] ?? '').toString();
        setState(() {
          _tracking = true;
          _seguimientoId = id;
        });
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Iniciar: $e')));
        }
      }
    }

    Future<void> terminarTracking() async {
      if (_seguimientoId == null) return;
      try {
        await ref.read(seguimientoRepositoryProvider).finish(_seguimientoId!);
        setState(() {
          _tracking = false;
          _seguimientoId = null;
        });
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Terminar: $e')));
        }
      }
    }

    Future<void> openShareModal() async {
      if (_seguimientoId == null) return;
      final host = (Uri.base.host.isEmpty ? 'localhost' : Uri.base.host);
      final scheme = (Uri.base.scheme.isEmpty ? 'http' : Uri.base.scheme);
      final url = '$scheme://$host:3001/api/seguimiento/${_seguimientoId!}';
      setState(() {
        _shareUrl = url;
        _showShareModal = true;
      });
    }

    Future<void> copyLink() async {
      if ((_shareUrl ?? '').isEmpty) return;
      await Clipboard.setData(ClipboardData(text: _shareUrl!));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('URL copiada')));
      }
      setState(() => _showShareModal = false);
    }

    Widget shareModal() {
      if (!_showShareModal) return const SizedBox.shrink();
      return Positioned.fill(
        child: GestureDetector(
          onTap: () => setState(() => _showShareModal = false),
          child: Container(
            color: const Color.fromRGBO(0, 0, 0, 0.7),
            padding: const EdgeInsets.all(20),
            alignment: Alignment.center,
            child: GestureDetector(
              onTap: () {},
              child: Container(
                width: 360,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A1A2E),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.15)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Compartir seguimiento',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Elige una opción para compartir tu ruta',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Color(0xFFC7D0E0)),
                    ),
                    const SizedBox(height: 16),
                    _ShareOptionButton(label: 'WhatsApp', background: const Color(0xFF25D366), onTap: copyLink),
                    const SizedBox(height: 10),
                    _ShareOptionButton(label: 'Facebook', background: const Color(0xFF1877F2), onTap: copyLink),
                    const SizedBox(height: 10),
                    _ShareOptionButton(label: 'Instagram', background: const Color(0xFFC13584), onTap: copyLink),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: copyLink,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color.fromRGBO(255, 255, 255, 0.10),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.20)),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'Copiar enlace',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    InkWell(
                      onTap: () => setState(() => _showShareModal = false),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 10),
                        child: Text(
                          'Cancelar',
                          style: TextStyle(color: Color(0xFFC7D0E0), fontSize: 13, fontWeight: FontWeight.w600),
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

    Widget routeInfo() {
      if (_distance == null || _duration == null) return const SizedBox.shrink();
      return Container(
        margin: const EdgeInsets.only(top: 20),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color.fromRGBO(255, 255, 255, 0.95),
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.15), blurRadius: 8, offset: Offset(0, 4)),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            Expanded(child: _RouteInfoItem(label: 'Distancia:', value: _formatDistance(_distance!))),
            Expanded(child: _RouteInfoItem(label: 'Duración:', value: _formatDuration(_duration!))),
            Expanded(child: _RouteInfoItem(label: 'Calorías:', value: '${((_distance! / 1000) * 50).round()}')),
          ],
        ),
      );
    }

    Widget trackingInfo() {
      if (!_tracking) return const SizedBox.shrink();
      return Container(
        margin: const EdgeInsets.only(top: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color.fromRGBO(255, 255, 255, 0.95),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF34C759), width: 2),
          boxShadow: const [
            BoxShadow(color: Color.fromRGBO(52, 199, 89, 0.20), blurRadius: 8, offset: Offset(0, 4)),
          ],
        ),
        child: const Column(
          children: [
            _TrackingRow(label: 'Estado', value: 'Activo', valueColor: Color(0xFF34C759)),
            SizedBox(height: 12),
            _TrackingRow(label: 'GPS', value: 'En progreso', valueColor: Color(0xFF34C759)),
          ],
        ),
      );
    }

    Widget mapWrapper() {
      return Container(
        margin: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: const Color.fromRGBO(224, 224, 224, 0.85),
        ),
        clipBehavior: Clip.antiAlias,
        child: SizedBox(
          height: 420,
          child: Stack(
            children: [
              FlutterMap(
                options: MapOptions(
                  initialCenter: _center,
                  initialZoom: 12,
                  interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'roller_flutter_app',
                  ),
                  if (_route.isNotEmpty)
                    PolylineLayer(
                      polylines: [
                        Polyline(points: _route, strokeWidth: 8, color: Colors.white.withValues(alpha: 0.85)),
                        Polyline(points: _route, strokeWidth: 4.5, color: AppTheme.accent),
                      ],
                    ),
                ],
              ),
              if (_calculating)
                Positioned.fill(
                  child: Container(
                    color: const Color.fromRGBO(255, 255, 255, 0.90),
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        CircularProgressIndicator(),
                        SizedBox(height: 10),
                        Text('Calculando ruta...', style: TextStyle(fontSize: 16, color: Color(0xFF666666))),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      );
    }

    final showCalcular = _origenSeleccionado && _destinoCtrl.text.trim().isNotEmpty;

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset('assets/patines-fondo-nuevo.jpeg', fit: BoxFit.cover),
          ),
          SafeArea(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: const Color.fromRGBO(2, 6, 23, 0.62),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(Icons.person, color: Color(0xFFE2E8F0)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            children: [
                              Text('Inicio de Recorrido', textAlign: TextAlign.center, style: titleStyle),
                              const SizedBox(height: 4),
                              Text('Navegación y Tracking', textAlign: TextAlign.center, style: subtitleStyle),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        if (!_origenSeleccionado)
                          TextField(
                            controller: _origenCtrl,
                            decoration: const InputDecoration(labelText: 'Origen').copyWith(labelStyle: labelWhite),
                            onSubmitted: (_) => setState(() => _origenSeleccionado = _origenCtrl.text.trim().isNotEmpty),
                          )
                        else
                          Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: const Color.fromRGBO(255, 255, 255, 0.95),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFF007AFF), width: 2),
                              boxShadow: const [
                                BoxShadow(color: Color.fromRGBO(0, 122, 255, 0.25), blurRadius: 8, offset: Offset(0, 4)),
                              ],
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'ORIGEN:',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF666666)),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _origenCtrl.text,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 16, color: Color(0xFF333333), fontWeight: FontWeight.w500),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                InkWell(
                                  onTap: () {
                                    setState(() {
                                      _origenSeleccionado = false;
                                      _origenCtrl.clear();
                                      _destinoCtrl.clear();
                                      _route = [];
                                      _distance = null;
                                      _duration = null;
                                    });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(color: const Color(0xFF007AFF), borderRadius: BorderRadius.circular(8)),
                                    child: const Text('✏️ Editar', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        if (_origenSeleccionado) ...[
                          TextField(
                            controller: _destinoCtrl,
                            decoration: const InputDecoration(labelText: 'Destino').copyWith(labelStyle: labelWhite),
                            onChanged: (_) => setState(() {}),
                          ),
                          const SizedBox(height: 8),
                          if (showCalcular)
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _calculating ? null : calcularRuta,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF007AFF),
                                  shadowColor: const Color(0xFF007AFF),
                                  elevation: 2,
                                  minimumSize: const Size(0, 56),
                                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 32),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: Text(
                                  _calculating ? 'Calculando...' : 'Calcular Ruta',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                ),
                              ),
                            ),
                        ],
                        routeInfo(),
                        if (_distance != null && _duration != null) ...[
                          const SizedBox(height: 16),
                          if (!_tracking)
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: iniciarTracking,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF34C759),
                                  shadowColor: const Color(0xFF34C759),
                                  elevation: 2,
                                  minimumSize: const Size(0, 56),
                                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 32),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const Text(
                                  'Iniciar Recorrido',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 0.5, color: Colors.white),
                                ),
                              ),
                            )
                          else
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: terminarTracking,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFFF3B30),
                                  shadowColor: const Color(0xFFFF3B30),
                                  elevation: 2,
                                  minimumSize: const Size(0, 56),
                                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 32),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const Text(
                                  'Detener Recorrido',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 0.5, color: Colors.white),
                                ),
                              ),
                            ),
                          trackingInfo(),
                          if (_tracking && _seguimientoId != null) ...[
                            const SizedBox(height: 12),
                            InkWell(
                              onTap: openShareModal,
                              child: Container(
                                margin: const EdgeInsets.only(top: 12),
                                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF9B59B6),
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: const [
                                    BoxShadow(color: Color.fromRGBO(155, 89, 182, 0.30), blurRadius: 8, offset: Offset(0, 4)),
                                  ],
                                ),
                                alignment: Alignment.center,
                                child: const Text(
                                  'Compartir',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: () async {
                                  if (_route.isEmpty) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Primero traza una ruta.')));
                                    }
                                    return;
                                  }
                                  final input = RecapInput(
                                    route: List<LatLng>.from(_route),
                                    distanceMeters: _distance,
                                    durationSeconds: _duration,
                                    origen: _origenCtrl.text,
                                    destino: _destinoCtrl.text,
                                  );
                                  context.go('/recap/crear', extra: input);
                                },
                                child: const Text('Crear Recap'),
                              ),
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),
                  mapWrapper(),
                ],
              ),
            ),
          ),
          shareModal(),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(2, 6, 23, 0.62),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}

class _RouteInfoItem extends StatelessWidget {
  const _RouteInfoItem({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Color(0xFF666666), fontWeight: FontWeight.w500),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF007AFF)),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _TrackingRow extends StatelessWidget {
  const _TrackingRow({required this.label, required this.value, required this.valueColor});
  final String label;
  final String value;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 15, color: Color(0xFF333333), fontWeight: FontWeight.w600)),
        Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: valueColor)),
      ],
    );
  }
}

class _ShareOptionButton extends StatelessWidget {
  const _ShareOptionButton({required this.label, required this.background, required this.onTap});
  final String label;
  final Color background;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
        ),
      ),
    );
  }
}

String _formatDistance(double meters) {
  if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(2)} km';
  return '${meters.toStringAsFixed(0)} m';
}

String _formatDuration(double seconds) {
  final s = seconds.round();
  final h = s ~/ 3600;
  final m = (s % 3600) ~/ 60;
  if (h > 0) return '${h}h ${m}m';
  return '${m}m';
}

