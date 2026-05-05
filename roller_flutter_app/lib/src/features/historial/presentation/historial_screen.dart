import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/api_client.dart';
import '../data/seguimiento_repository.dart' as hist;
import '../../seguimiento/data/seguimiento_repository.dart' as seg;

final _periodProvider = StateProvider<String>((ref) => 'all');

final _leaderboardPeriodProvider = StateProvider<String>((ref) => 'week');

final historialProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final period = ref.watch(_periodProvider);
  return ref.watch(hist.seguimientoRepositoryProvider).getHistory(period: period);
});

final userStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final period = ref.watch(_periodProvider);
  return ref.watch(seguimientoRepositoryProvider2).userStats(period: period);
});

final leaderboardProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final period = ref.watch(_leaderboardPeriodProvider);
  return ref.watch(seguimientoRepositoryProvider2).leaderboard(period: period, limit: 10);
});

/// Espejo de `HistorialScreen.tsx` (StyleSheet: container, overlay, statCard, filters, leaderboard, recorridoCard).
class HistorialScreen extends ConsumerWidget {
  const HistorialScreen({super.key});

  static TextStyle _marker(double size, {FontWeight w = FontWeight.w700, Color c = Colors.white}) {
    return GoogleFonts.permanentMarker(fontSize: size, fontWeight: w, color: c);
  }

  static String _formatDurationRn(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    if (h > 0) return '${h}h ${m}m';
    if (m > 0) return '${m}m ${s}s';
    return '${s}s';
  }

  static String _formatDistanceMeters(num meters) {
    if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(2)} km';
    return '${meters.toStringAsFixed(0)} m';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(historialProvider);
    final statsAsync = ref.watch(userStatsProvider);
    final lbAsync = ref.watch(leaderboardProvider);
    TextStyle titleStyle() => GoogleFonts.permanentMarker(
          fontSize: 31,
          fontWeight: FontWeight.w700,
          color: Colors.white,
          shadows: const [
            Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
          ],
        );

    TextStyle subtitleStyle() => GoogleFonts.permanentMarker(
          fontSize: 21,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          shadows: const [
            Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
          ],
        );

    Widget statCard({
      required String icon,
      required String label,
      required String value,
      required String unit,
      required Color borderColor,
      Color bg = const Color.fromRGBO(255, 255, 255, 0.98),
    }) {
      return Container(
        constraints: const BoxConstraints(minWidth: 140),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: 2),
          boxShadow: const [
            BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.20), blurRadius: 12, offset: Offset(0, 4)),
          ],
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(icon, style: const TextStyle(fontSize: 20)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    label,
                    style: GoogleFonts.permanentMarker(
                      fontSize: 12,
                      color: const Color(0xFF666666),
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: GoogleFonts.permanentMarker(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF333333),
              ),
            ),
            Text(
              unit,
              style: GoogleFonts.permanentMarker(fontSize: 11, color: const Color(0xFF999999), fontWeight: FontWeight.w500),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          const ColoredBox(color: Color(0xFF0F0F1E)),
          Positioned.fill(
            child: Opacity(
              opacity: 0.45,
              child: Image.asset('assets/patines-fondo-nuevo.jpeg', fit: BoxFit.cover),
            ),
          ),
          const Positioned.fill(
            child: ColoredBox(color: Color.fromRGBO(15, 15, 30, 0.6)),
          ),
          SafeArea(
            child: async.when(
              data: (items) {
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(historialProvider);
                    ref.invalidate(userStatsProvider);
                    ref.invalidate(leaderboardProvider);
                    await Future.wait([
                      ref.read(historialProvider.future),
                      ref.read(userStatsProvider.future),
                      ref.read(leaderboardProvider.future),
                    ]);
                  },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
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
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Historial', style: titleStyle()),
                                  Text('Tus recorridos anteriores', style: subtitleStyle()),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        statsAsync.when(
                          data: (s) {
                            final km = double.tryParse((s['totalKilometros'] ?? 0).toString()) ?? 0;
                            final rec = int.tryParse((s['totalRecorridos'] ?? 0).toString()) ?? 0;
                            final dur = int.tryParse((s['totalDuracion'] ?? s['duracionTotal'] ?? 0).toString()) ?? 0;
                            final velMps =
                                double.tryParse((s['velocidadPromedioGeneral'] ?? s['velocidadPromedio'] ?? 0).toString()) ??
                                    0;
                            final kmh = velMps * 3.6;
                            final sem = int.tryParse((s['recorridosSemana'] ?? 0).toString()) ?? 0;
                            final mes = int.tryParse((s['recorridosMes'] ?? 0).toString()) ?? 0;
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                LayoutBuilder(
                                  builder: (context, c) {
                                    final w = (c.maxWidth - 12) / 2;
                                    return Wrap(
                                      spacing: 12,
                                      runSpacing: 12,
                                      children: [
                                        SizedBox(
                                          width: w,
                                          child: statCard(
                                            icon: '📍',
                                            label: 'Kilómetros',
                                            value: km.toStringAsFixed(1),
                                            unit: 'km',
                                            borderColor: const Color(0xFF007AFF),
                                          ),
                                        ),
                                        SizedBox(
                                          width: w,
                                          child: statCard(
                                            icon: '🛼',
                                            label: 'Recorridos',
                                            value: '$rec',
                                            unit: 'viajes',
                                            borderColor: const Color(0xFF34C759),
                                          ),
                                        ),
                                        SizedBox(
                                          width: w,
                                          child: statCard(
                                            icon: '⚡',
                                            label: 'Velocidad',
                                            value: kmh.toStringAsFixed(1),
                                            unit: 'km/h',
                                            borderColor: const Color(0xFFFF9500),
                                          ),
                                        ),
                                        SizedBox(
                                          width: w,
                                          child: statCard(
                                            icon: '⏱️',
                                            label: 'Tiempo Total',
                                            value: _formatDurationRn(dur),
                                            unit: 'activo',
                                            borderColor: const Color(0xFF5856D6),
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                ),
                                const SizedBox(height: 20),
                                Container(
                                  decoration: BoxDecoration(
                                    color: const Color.fromRGBO(255, 255, 255, 0.95),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.3)),
                                    boxShadow: const [
                                      BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.15), blurRadius: 12, offset: Offset(0, 4)),
                                    ],
                                  ),
                                  clipBehavior: Clip.antiAlias,
                                  child: Column(
                                    children: [
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.all(16),
                                        decoration: const BoxDecoration(
                                          color: Color.fromRGBO(0, 122, 255, 0.1),
                                          border: Border(bottom: BorderSide(color: Color(0xFF007AFF), width: 2)),
                                        ),
                                        child: Text(
                                          '📊 Resumen Periódico',
                                          style: GoogleFonts.permanentMarker(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF007AFF),
                                          ),
                                        ),
                                      ),
                                      _additionalRow(icon: '📅', label: 'Recorridos esta semana', value: '$sem'),
                                      _additionalRow(icon: '📊', label: 'Recorridos este mes', value: '$mes', isLast: true),
                                    ],
                                  ),
                                ),
                              ],
                            );
                          },
                          loading: () => const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator())),
                          error: (e, _) => Text('Stats: $e', style: const TextStyle(color: Colors.white)),
                        ),
                        const SizedBox(height: 20),
                        _leaderboardSection(context, ref, lbAsync),
                        const SizedBox(height: 20),
                        _filtersSection(context, ref),
                        const SizedBox(height: 20),
                        _recorridosSection(context, ref, items),
                      ],
                    ),
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF007AFF))),
              error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.white))),
            ),
          ),
        ],
      ),
    );
  }

  Widget _leaderboardSection(BuildContext context, WidgetRef ref, AsyncValue<List<Map<String, dynamic>>> lbAsync) {
    const labels = {'week': 'Semana', 'month': 'Mes', 'year': 'Año'};
    return Container(
      decoration: BoxDecoration(
        color: const Color.fromRGBO(255, 255, 255, 0.95),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.3)),
        boxShadow: const [
          BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.15), blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color.fromRGBO(255, 149, 0, 0.08),
              border: Border(bottom: BorderSide(color: Color.fromRGBO(255, 149, 0, 0.3))),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '🏆 Top 10 por kilómetros',
                  style: GoogleFonts.permanentMarker(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFFF9500),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Compite y motívate con otros usuarios',
                  style: GoogleFonts.permanentMarker(fontSize: 12, color: const Color(0xFF666666)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Wrap(
              spacing: 8,
              children: [
                for (final e in labels.entries)
                  Builder(
                    builder: (context) {
                      final sel = ref.watch(_leaderboardPeriodProvider) == e.key;
                      return InkWell(
                        onTap: () {
                          ref.read(_leaderboardPeriodProvider.notifier).state = e.key;
                          ref.invalidate(leaderboardProvider);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: sel ? const Color(0xFFFF9500) : const Color.fromRGBO(255, 149, 0, 0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: sel ? const Color(0xFFFF9500) : const Color.fromRGBO(255, 149, 0, 0.3),
                            ),
                          ),
                          child: Text(
                            e.value,
                            style: GoogleFonts.permanentMarker(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: sel ? Colors.white : const Color(0xFFFF9500),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: lbAsync.when(
              data: (lb) {
                if (lb.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'No hay datos para este período',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.permanentMarker(fontSize: 13, color: const Color(0xFF666666)),
                    ),
                  );
                }
                return Column(
                  children: [
                    for (var i = 0; i < lb.length; i++)
                      _leaderboardItem(lb[i], i),
                  ],
                );
              },
              loading: () => const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator())),
              error: (e, _) => Text('Leaderboard: $e'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _leaderboardItem(Map<String, dynamic> u, int index) {
    final name = (u['alias'] ?? u['email'] ?? 'user').toString();
    final rec = int.tryParse((u['totalRecorridos'] ?? 0).toString()) ?? 0;
    final km = double.tryParse((u['totalKilometros'] ?? 0).toString()) ?? 0;
    final first = index == 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: first ? const Color(0xFFFFD700) : const Color(0xFFF0F0F0)),
        boxShadow: first
            ? const [BoxShadow(color: Color.fromRGBO(255, 215, 0, 0.30), blurRadius: 6, offset: Offset(0, 2))]
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: const BoxDecoration(color: Color(0xFFFF9500), shape: BoxShape.circle),
            child: Text(
              '${index + 1}',
              style: GoogleFonts.permanentMarker(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.permanentMarker(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF333333)),
                ),
                Text(
                  '$rec recorridos',
                  style: GoogleFonts.permanentMarker(fontSize: 11, color: const Color(0xFF666666)),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                km.toStringAsFixed(1),
                style: GoogleFonts.permanentMarker(fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFFFF9500)),
              ),
              Text('km', style: GoogleFonts.permanentMarker(fontSize: 10, color: const Color(0xFF666666))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _filtersSection(BuildContext context, WidgetRef ref) {
    const labels = {'all': 'Todos', 'week': 'Semana', 'month': 'Mes', 'year': 'Año'};
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(255, 255, 255, 0.95),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.10), blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '🔍 Filtrar por período',
            style: GoogleFonts.permanentMarker(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF333333)),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final e in labels.entries)
                Builder(
                  builder: (context) {
                    final sel = ref.watch(_periodProvider) == e.key;
                    return InkWell(
                      onTap: () {
                        ref.read(_periodProvider.notifier).state = e.key;
                        ref.invalidate(historialProvider);
                        ref.invalidate(userStatsProvider);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        decoration: BoxDecoration(
                          color: sel ? const Color(0xFF007AFF) : const Color.fromRGBO(0, 122, 255, 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: sel ? const Color(0xFF007AFF) : const Color.fromRGBO(0, 122, 255, 0.3),
                            width: 2,
                          ),
                          boxShadow: sel
                              ? const [BoxShadow(color: Color.fromRGBO(0, 122, 255, 0.30), blurRadius: 4, offset: Offset(0, 2))]
                              : null,
                        ),
                        child: Text(
                          e.value,
                          style: GoogleFonts.permanentMarker(
                            fontSize: 14,
                            fontWeight: sel ? FontWeight.w700 : FontWeight.w600,
                            color: sel ? Colors.white : const Color(0xFF007AFF),
                          ),
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _recorridosSection(
    BuildContext context,
    WidgetRef ref,
    List<Map<String, dynamic>> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text(
              '🗺️ Mis Recorridos',
              style: GoogleFonts.permanentMarker(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                shadows: const [
                  Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
                ],
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF007AFF),
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [
                  BoxShadow(color: Color.fromRGBO(0, 122, 255, 0.30), blurRadius: 4, offset: Offset(0, 2)),
                ],
              ),
              child: Text(
                '${items.length}',
                style: GoogleFonts.permanentMarker(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (items.isEmpty)
          Container(
            padding: const EdgeInsets.all(48),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: const Color.fromRGBO(255, 255, 255, 0.95),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE0E0E0), width: 2),
            ),
            child: Column(
              children: [
                const Text('🛤️', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 16),
                Text(
                  'No hay recorridos en este período',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.permanentMarker(fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF333333)),
                ),
                const SizedBox(height: 8),
                Text(
                  'Inicia un recorrido desde la pantalla de Navegación',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.permanentMarker(fontSize: 14, color: const Color(0xFF666666)),
                ),
              ],
            ),
          )
        else
          for (var i = 0; i < items.length; i++)
            _recorridoCard(items[i], highlight: i == 0),
      ],
    );
  }

  Widget _recorridoCard(Map<String, dynamic> it, {required bool highlight}) {
    final origen = (it['origen'] ?? '').toString();
    final destino = (it['destino'] ?? '').toString();
    final stats = it['stats'];
    final distancia = (stats is Map ? stats['distanciaTotal'] : null)?.toString() ?? '0';
    final duracion = (stats is Map ? stats['duracion'] : null)?.toString() ?? '0';
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: highlight ? Colors.white : const Color.fromRGBO(255, 255, 255, 0.95),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: highlight ? const Color(0xFF007AFF) : const Color.fromRGBO(255, 255, 255, 0.5),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: highlight ? const Color.fromRGBO(0, 122, 255, 0.30) : const Color.fromRGBO(0, 0, 0, 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(origen.isEmpty ? 'Recorrido' : origen, style: GoogleFonts.permanentMarker(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text('→ $destino', style: GoogleFonts.permanentMarker(fontSize: 14, color: const Color(0xFF666666))),
          const SizedBox(height: 8),
          Text(
            '${_formatDistanceMeters(num.tryParse(distancia) ?? 0)} · ${_formatDurationRn(int.tryParse(duracion) ?? 0)}',
            style: GoogleFonts.permanentMarker(fontSize: 13, color: const Color(0xFF007AFF)),
          ),
        ],
      ),
    );
  }
}

Widget _additionalRow({required String icon, required String label, required String value, bool isLast = false}) {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFF0F0F0))),
    ),
    child: Row(
      children: [
        Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: icon == '📅' ? const Color(0xFFE3F2FD) : const Color(0xFFE8F5E9),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Text(icon, style: const TextStyle(fontSize: 24)),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Text(
            label,
            style: GoogleFonts.permanentMarker(fontSize: 15, color: const Color(0xFF666666), fontWeight: FontWeight.w500),
          ),
        ),
        Text(
          value,
          style: GoogleFonts.permanentMarker(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF007AFF)),
        ),
      ],
    ),
  );
}

final seguimientoRepositoryProvider2 = Provider<seg.SeguimientoRepository>((ref) {
  return seg.SeguimientoRepository(ref.watch(dioProvider));
});
