import 'dart:ui' show ImageFilter;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/ui/app_theme.dart';
import '../../../core/ui/rn_mirror_layouts.dart';
import '../models/recap_input.dart';
import '../models/recap_photo.dart';
import '../models/recap_plan_limits.dart';
import '../models/recap_video_result.dart';
import '../recap_flow_cache.dart';
import '../video/recap_share.dart';
import '../video/recap_video_generator.dart';
import 'widgets/recap_photo_editor_section.dart';
import 'widgets/recap_video_preview_panel.dart';

class RecapCreateScreen extends StatefulWidget {
  const RecapCreateScreen({super.key, required this.input});

  final RecapInput input;

  @override
  State<RecapCreateScreen> createState() => _RecapCreateScreenState();
}

class _RecapCreateScreenState extends State<RecapCreateScreen> {
  bool _busy = false;
  RecapVideoResult? _videoResult;
  String? _shareHint;
  late List<RecapPhoto> _photos;

  RecapInput get _in => widget.input.normalized();

  static const Color _neonGreen = Color(0xFF00FF7F);

  @override
  void initState() {
    super.initState();
    RecapFlowCache.lastInput = _in;
    _photos = List<RecapPhoto>.from(RecapFlowCache.photos);
  }

  @override
  void dispose() {
    if (_videoResult != null) revokeRecapPreviewUrl(_videoResult!.previewUrl);
    super.dispose();
  }

  List<RecapPhotoBytes> get _photoBytes =>
      _photos.map((p) => RecapPhotoBytes(bytes: p.bytes, label: p.timestampLabel)).toList();

  Future<void> _generate() async {
    if (!kIsWeb) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Genera el recap desde el navegador (Chrome/Safari) en tu móvil o PC: https://tu-enlace',
          ),
        ),
      );
      return;
    }

    final route = _in.route;
    if (route.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Necesitas una ruta con al menos 2 puntos.')),
      );
      return;
    }

    setState(() {
      _busy = true;
      _shareHint = null;
    });

    if (_videoResult != null) {
      revokeRecapPreviewUrl(_videoResult!.previewUrl);
      _videoResult = null;
    }

    try {
      final km = _in.km ?? 0;
      final duration = _in.durationSeconds ?? 0;
      final avg = _in.avgKmh ?? 0;
      final stats = RecapVideoStats(km: km, durationSec: duration, avgKmh: avg);
      final result = await generateRecapVideo(
        route: route,
        stats: stats,
        photos: _photoBytes,
        title: 'RunSkateRoller',
      );
      if (!mounted) return;
      setState(() => _videoResult = result);
      if (!result.playableInBrowser) {
        setState(() {
          _shareHint =
              'Formato ${result.formatLabel}: en iPhone conviene MP4. Si no se reproduce, pulsa Regenerar o Descargar.';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No se pudo generar el video: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _syncPhotosToCache(List<RecapPhoto> next) {
    RecapFlowCache.clearPhotos();
    RecapFlowCache.photos.addAll(next);
    setState(() => _photos = next);
  }

  Future<void> _share() async {
    final r = _videoResult;
    if (r == null) return;
    final outcome = await shareRecapVideo(r);
    if (!mounted) return;
    setState(() {
      _shareHint = outcome.shared
          ? 'Video compartido correctamente.'
          : (outcome.message ?? 'Descarga el video y súbelo manualmente a tus redes.');
    });
    if (!outcome.shared) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_shareHint!)),
      );
    }
  }

  void _regenerate() {
    if (_videoResult != null) {
      revokeRecapPreviewUrl(_videoResult!.previewUrl);
    }
    setState(() {
      _videoResult = null;
      _shareHint = null;
    });
    _generate();
  }

  @override
  Widget build(BuildContext context) {
    final route = _in.route;
    final hasRoute = route.length >= 2;
    final center = hasRoute ? route.first : const LatLng(19.4326, -99.1332);
    final km = _in.km ?? 0;
    final duration = _in.durationSeconds ?? 0;
    final avg = _in.avgKmh ?? 0;
    final planId = RecapFlowCache.planId;
    final planLabel = RecapPlanLimits.planLabel(planId);

    return RnMirrorRecapLayout(
      mapLayer: FlutterMap(
        key: ValueKey('${center.latitude}_${center.longitude}_${route.length}'),
        options: MapOptions(
          initialCenter: center,
          initialZoom: route.isEmpty ? 12.0 : 13.2,
          interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            subdomains: const ['a', 'b', 'c', 'd'],
            userAgentPackageName: 'roller_flutter_app',
          ),
          if (route.isNotEmpty)
            PolylineLayer(
              polylines: [
                Polyline(
                  points: route,
                  strokeWidth: 14,
                  strokeCap: StrokeCap.round,
                  strokeJoin: StrokeJoin.round,
                  color: _neonGreen.withValues(alpha: 0.18),
                ),
                Polyline(
                  points: route,
                  strokeWidth: 7,
                  strokeCap: StrokeCap.round,
                  strokeJoin: StrokeJoin.round,
                  color: _neonGreen,
                  borderStrokeWidth: 1.5,
                  borderColor: Colors.white.withValues(alpha: 0.35),
                ),
              ],
            ),
        ],
      ),
      titleRow: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
            onPressed: () => context.pop(),
          ),
          Expanded(
            child: Text('Crear Recap', style: RnMirrorTypography.heroTitle(size: 28)),
          ),
        ],
      ),
      glassBody: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.4)),
                ),
                child: Text(
                  'Plan: $planLabel',
                  style: const TextStyle(color: Color(0xFF7DD3FC), fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Resumen del recorrido',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFFF8FAFC)),
          ),
          const SizedBox(height: 6),
          Text(
            kIsWeb
                ? 'Añade fotos, genera el video (MP4 en móvil cuando el navegador lo permite) y compártelo.'
                : 'Abre esta pantalla en el navegador para generar el recap en video.',
            style: const TextStyle(fontSize: 13, color: Color(0xFFCBD5F5), height: 18 / 13),
          ),
          const SizedBox(height: 12),
          _metricsCard(km: km, duration: duration, avg: avg),
          const SizedBox(height: 14),
          RecapPhotoEditorSection(
            planId: planId,
            photos: _photos,
            onPhotosChanged: _syncPhotosToCache,
          ),
          const SizedBox(height: 14),
          if (_videoResult != null) ...[
            RecapVideoPreviewPanel(
              result: _videoResult!,
              shareMessage: _shareHint,
              onDownload: () => downloadRecapVideo(_videoResult!),
              onShare: _share,
              onRegenerate: _regenerate,
            ),
            const SizedBox(height: 14),
          ],
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.push('/recap/plan'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    foregroundColor: _neonGreen,
                    side: BorderSide(color: _neonGreen.withValues(alpha: 0.85), width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Elegir plan', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: _HudGenerateVideoButton(
                  busy: _busy,
                  enabled: hasRoute && kIsWeb,
                  label: _busy
                      ? 'Generando...'
                      : (_videoResult != null ? 'Regenerar video' : 'Generar video'),
                  onPressed: _busy || !hasRoute || !kIsWeb ? null : _generate,
                ),
              ),
            ],
          ),
          if (!kIsWeb) ...[
            const SizedBox(height: 10),
            const Text(
              'La generación de video usa canvas en el navegador. Entra desde Safari/Chrome en tu teléfono.',
              style: TextStyle(fontSize: 12, color: Color(0xFFF59E0B), height: 1.35),
            ),
          ],
        ],
      ),
    );
  }

  Widget _metricsCard({required double km, required double duration, required double avg}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: const Color(0xCC0D1117),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white10),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            child: Row(
              children: [
                Expanded(child: _metric('Distancia', '${km.toStringAsFixed(2)} km')),
                Expanded(child: _metric('Tiempo', _fmtDuration(duration))),
                Expanded(child: _metric('Promedio', '${avg.toStringAsFixed(1)} km/h')),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _metric(String l, String v) {
    return Column(
      children: [
        Text(v, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
        const SizedBox(height: 4),
        Text(l.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.45))),
      ],
    );
  }
}

class _HudGenerateVideoButton extends StatelessWidget {
  const _HudGenerateVideoButton({
    required this.busy,
    required this.enabled,
    required this.label,
    required this.onPressed,
  });

  final bool busy;
  final bool enabled;
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final active = enabled && !busy && onPressed != null;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: active ? onPressed : null,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            gradient: active
                ? const LinearGradient(
                    colors: [Color(0xFF00E8FF), AppTheme.routeElectricCta, Color(0xFF00FF9D)],
                  )
                : null,
            color: active ? null : const Color(0xFF334155),
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48),
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    color: active ? const Color(0xFF0B1224) : const Color(0xFF94A3B8),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

String _fmtDuration(double seconds) {
  final s = seconds.round();
  final minutes = (s / 60).round();
  if (minutes < 60) return '$minutes min';
  final h = minutes ~/ 60;
  final r = minutes % 60;
  return '${h}h ${r}m';
}
