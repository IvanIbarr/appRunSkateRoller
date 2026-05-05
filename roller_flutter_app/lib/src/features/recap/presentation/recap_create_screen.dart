import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/ui/page_scaffold.dart';
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

  @override
  Widget build(BuildContext context) {
    final route = widget.input.route;
    final hasRoute = route.length >= 2;
    final center = hasRoute ? route.first : const LatLng(19.4326, -99.1332);

    final km = widget.input.km ?? 0;
    final duration = widget.input.durationSeconds ?? 0;
    final avg = widget.input.avgKmh ?? 0;

    return PageScaffold(
      title: 'Crear Recap',
      maxWidth: 1100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Vista previa. En Web puedes generar y descargar el video (formato .webm).',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              height: 420,
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: center,
                  initialZoom: 12,
                  interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'roller_flutter_app',
                  ),
                  if (route.isNotEmpty)
                    PolylineLayer(
                      polylines: [
                        Polyline(points: route, strokeWidth: 8, color: Colors.white.withValues(alpha: 0.85)),
                      ],
                    ),
                  if (route.isNotEmpty)
                    PolylineLayer(
                      polylines: [
                        Polyline(points: route, strokeWidth: 4.5, color: const Color(0xFFFF3EA5)),
                      ],
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _StatChip(label: 'Distancia', value: '${km.toStringAsFixed(2)} km'),
              _StatChip(label: 'Tiempo', value: _fmtDuration(duration)),
              _StatChip(label: 'Promedio', value: '${avg.toStringAsFixed(1)} km/h'),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.go('/recap/plan'),
                  child: const Text('Elegir plan'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: _busy
                      ? null
                      : () async {
                          if (!hasRoute) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Primero traza una ruta para generar el recap.')),
                            );
                            return;
                          }
                          setState(() => _busy = true);
                          try {
                            final stats = RecapVideoStats(
                              km: km,
                              durationSec: duration,
                              avgKmh: avg,
                            );
                            await generateAndDownloadRecapWebm(route: route, stats: stats, title: 'RunSkateRoller');
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Listo: se descargó el video (o inició descarga).')),
                            );
                          } catch (e) {
                            if (!context.mounted) return;
                            final msg = kIsWeb
                                ? 'No se pudo generar: $e'
                                : 'En móvil: $e';
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
                          } finally {
                            if (mounted) setState(() => _busy = false);
                          }
                        },
                  child: Text(_busy ? 'Generando...' : 'Generar video (Web)'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});

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
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
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

