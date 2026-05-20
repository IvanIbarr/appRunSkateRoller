import 'dart:ui' show ImageFilter;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/ui/app_theme.dart';
import '../../../core/ui/rn_mirror_layouts.dart';
import '../models/recap_input.dart';
import '../video/recap_video_generator.dart';

class RecapCreateScreen extends StatefulWidget {
  const RecapCreateScreen({super.key, required this.input});

  final RecapInput input;

  @override
  State<RecapCreateScreen> createState() => _RecapCreateScreenState();
}

class _RecapCreateScreenState extends State<RecapCreateScreen> {
  bool _busy = false;

  RecapInput get _in => widget.input.normalized();

  static const Color _neonGreen = Color(0xFF00FF7F);

  @override
  Widget build(BuildContext context) {
    final route = _in.route;
    final hasRoute = route.length >= 2;
    final center = hasRoute ? route.first : const LatLng(19.4326, -99.1332);

    final km = _in.km ?? 0;
    final duration = _in.durationSeconds ?? 0;
    final avg = _in.avgKmh ?? 0;

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
          const Text(
            'Resumen del recorrido',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFFF8FAFC)),
          ),
          const SizedBox(height: 6),
          Text(
            kIsWeb ? 'Genera y descarga el recap en video (.webm).' : 'Genera el recap en video desde la app.',
            style: const TextStyle(fontSize: 13, color: Color(0xFFCBD5F5), height: 18 / 13),
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: const Color(0xCC0D1117),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white10, width: 1),
                  boxShadow: const [
                    BoxShadow(color: Color(0x59000000), blurRadius: 20, offset: Offset(0, 10)),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                  child: LayoutBuilder(
                    builder: (context, c) {
                      final wide = c.maxWidth > 420;
                      final tiles = [
                        _RecapMetricTile(label: 'Distancia', value: '${km.toStringAsFixed(2)} km'),
                        _RecapMetricTile(label: 'Tiempo', value: _fmtDuration(duration)),
                        _RecapMetricTile(label: 'Promedio', value: '${avg.toStringAsFixed(1)} km/h'),
                      ];
                      if (wide) {
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            for (var i = 0; i < tiles.length; i++) ...[
                              if (i > 0) const SizedBox(width: 8),
                              Expanded(child: tiles[i]),
                            ],
                          ],
                        );
                      }
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          for (var i = 0; i < tiles.length; i++) ...[
                            if (i > 0) const SizedBox(height: 12),
                            tiles[i],
                          ],
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.go('/recap/plan'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                    foregroundColor: _neonGreen,
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    side: BorderSide(color: _neonGreen.withValues(alpha: 0.85), width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text(
                    'Elegir plan',
                    style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.3),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _HudGenerateVideoButton(
                  busy: _busy,
                  enabled: hasRoute,
                  label: _busy ? 'Generando...' : 'Generar video (Web)',
                  onPressed: _busy || !hasRoute
                      ? null
                      : () async {
                          setState(() => _busy = true);
                          try {
                            final stats = RecapVideoStats(
                              km: km,
                              durationSec: duration,
                              avgKmh: avg,
                            );
                            await generateAndDownloadRecapWebm(route: route, stats: stats, title: 'RunSkateRoller');
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('No se pudo generar el video: $e')),
                              );
                            }
                          } finally {
                            if (mounted) setState(() => _busy = false);
                          }
                        },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Métrica: valor grande arriba, etiqueta pequeña abajo (legible a golpe de vista).
class _RecapMetricTile extends StatelessWidget {
  const _RecapMetricTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            value,
            textAlign: TextAlign.center,
            maxLines: 1,
            style: const TextStyle(
              fontSize: 22,
              height: 1.05,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: 0.2,
              shadows: [
                Shadow(offset: Offset(0, 1), blurRadius: 8, color: Color(0x8F000000)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label.toUpperCase(),
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 10.5,
            height: 1.1,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.1,
            color: Colors.white.withValues(alpha: 0.45),
          ),
        ),
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
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF00E8FF),
                      AppTheme.routeElectricCta,
                      Color(0xFF00FF9D),
                    ],
                    stops: [0.0, 0.45, 1.0],
                  )
                : null,
            color: active ? null : const Color(0xFF334155),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: AppTheme.routeElectricCta.withValues(alpha: 0.55),
                      blurRadius: 15,
                      spreadRadius: 0,
                      offset: const Offset(0, 4),
                    ),
                    const BoxShadow(
                      color: Color(0x66000000),
                      blurRadius: 14,
                      offset: Offset(0, 8),
                    ),
                  ]
                : null,
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 52),
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13.5,
                    letterSpacing: 0.2,
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
