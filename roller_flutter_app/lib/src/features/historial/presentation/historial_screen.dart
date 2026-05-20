import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/ui/rn_mirror_layouts.dart';
import '../../../core/ui/user_profile_avatar.dart';
import '../data/historial_providers.dart';
import 'widgets/historial_sport_widgets.dart';

/// Historial / ranking deportivo (homologado visualmente con [/ruta]).
class HistorialScreen extends ConsumerWidget {
  const HistorialScreen({super.key});

  static String formatDuration(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    if (h > 0) return '${h}h ${m}m';
    if (m > 0) return '${m}m ${s}s';
    return '${s}s';
  }

  static String formatDistanceMeters(num meters) {
    if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(2)} km';
    return '${meters.toStringAsFixed(0)} m';
  }

  static String _formatDate(dynamic raw) {
    if (raw == null) return '—';
    final d = DateTime.tryParse(raw.toString());
    if (d == null) return raw.toString();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recAsync = ref.watch(historialRecorridosProvider);
    final statsAsync = ref.watch(historialUserStatsProvider);
    final lbAsync = ref.watch(historialLeaderboardProvider);
    final meAsync = ref.watch(historialMeProvider);

    return RnMirrorHistorialLayout(
      scrollChild: RefreshIndicator(
        color: HistorialSportTheme.cyan,
        onRefresh: () async {
          ref.invalidate(historialRecorridosProvider);
          ref.invalidate(historialUserStatsProvider);
          ref.invalidate(historialLeaderboardProvider);
          ref.invalidate(historialMeProvider);
          await Future.wait([
            ref.read(historialRecorridosProvider.future),
            ref.read(historialUserStatsProvider.future),
            ref.read(historialLeaderboardProvider.future),
          ]);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(height: kIsWeb ? 12 : 32),
              _SportHeader(meAsync: meAsync),
              const SizedBox(height: 16),
              _LeaderboardSection(lbAsync: lbAsync, meAsync: meAsync),
              const SizedBox(height: 20),
              statsAsync.when(
                data: (s) => _SummarySection(stats: s),
                loading: () => const Center(
                  child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator(color: HistorialSportTheme.cyan)),
                ),
                error: (_, _) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 20),
              recAsync.when(
                data: (items) => _MisRecorridosSection(items: items),
                loading: () => const Center(child: CircularProgressIndicator(color: HistorialSportTheme.cyan)),
                error: (e, _) => _MisRecorridosSection(items: const [], error: '$e'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SportHeader extends StatelessWidget {
  const _SportHeader({required this.meAsync});

  final AsyncValue<Map<String, dynamic>> meAsync;

  @override
  Widget build(BuildContext context) {
    return meAsync.when(
      data: (me) {
        return Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            UserProfileAvatar.fromUser(
              me,
              size: 72,
              borderColor: HistorialSportTheme.cyan.withValues(alpha: 0.65),
              borderWidth: 2,
              backgroundColor: const Color.fromRGBO(2, 6, 23, 0.72),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Historial',
                    style: GoogleFonts.permanentMarker(
                      fontSize: 30,
                      fontWeight: FontWeight.w800,
                      color: HistorialSportTheme.textPrimary,
                      shadows: const [
                        Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
                      ],
                    ),
                  ),
                  Text(
                    'Tus recorridos anteriores',
                    style: GoogleFonts.permanentMarker(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: HistorialSportTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
      loading: () => const SizedBox(height: 72),
      error: (_, _) => const HistorialSportSectionTitle(
        icon: '🏆',
        title: 'Historial',
        subtitle: 'Tus recorridos anteriores',
      ),
    );
  }
}

class _SummarySection extends StatelessWidget {
  const _SummarySection({required this.stats});

  final Map<String, dynamic> stats;

  @override
  Widget build(BuildContext context) {
    final km = double.tryParse((stats['totalKilometros'] ?? 0).toString()) ?? 0;
    final rec = int.tryParse((stats['totalRecorridos'] ?? 0).toString()) ?? 0;
    final dur = int.tryParse((stats['totalDuracion'] ?? stats['duracionTotal'] ?? 0).toString()) ?? 0;
    final velMps = double.tryParse((stats['velocidadPromedioGeneral'] ?? stats['velocidadPromedio'] ?? 0).toString()) ?? 0;
    final kmh = velMps * 3.6;
    final semRec = int.tryParse((stats['recorridosSemana'] ?? 0).toString()) ?? 0;
    final mesRec = int.tryParse((stats['recorridosMes'] ?? 0).toString()) ?? 0;
    final kmSem = double.tryParse((stats['kmSemana'] ?? 0).toString()) ?? 0;
    final kmMes = double.tryParse((stats['kmMes'] ?? 0).toString()) ?? 0;

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
                  child: HistorialStatCard(icon: '📍', label: 'Kilómetros', value: km.toStringAsFixed(1), unit: 'km', accent: HistorialSportTheme.cyan),
                ),
                SizedBox(
                  width: w,
                  child: HistorialStatCard(icon: '🛼', label: 'Recorridos', value: '$rec', unit: 'viajes', accent: HistorialSportTheme.green),
                ),
                SizedBox(
                  width: w,
                  child: HistorialStatCard(icon: '⚡', label: 'Velocidad', value: kmh.toStringAsFixed(1), unit: 'km/h', accent: HistorialSportTheme.orange),
                ),
                SizedBox(
                  width: w,
                  child: HistorialStatCard(icon: '⏱️', label: 'Tiempo total', value: HistorialScreen.formatDuration(dur), unit: 'activo', accent: HistorialSportTheme.violet),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 16),
        HistorialSportGlassPanel(
          accent: HistorialSportTheme.cyan,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const HistorialSportSectionTitle(
                icon: '📊',
                title: 'Resumen periódico',
                subtitle: 'Actividad reciente',
                accent: HistorialSportTheme.cyan,
              ),
              const SizedBox(height: 12),
              _periodRow('Recorridos esta semana', '$semRec'),
              _periodRow('Recorridos este mes', '$mesRec'),
              _periodRow('Km esta semana', '${kmSem.toStringAsFixed(1)} km'),
              _periodRow('Km este mes', '${kmMes.toStringAsFixed(1)} km', isLast: true),
            ],
          ),
        ),
      ],
    );
  }

  Widget _periodRow(String label, String value, {bool isLast = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: isLast ? null : Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.08))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: GoogleFonts.permanentMarker(fontSize: 14, color: HistorialSportTheme.textMuted)),
          ),
          Text(
            value,
            style: GoogleFonts.permanentMarker(fontSize: 16, fontWeight: FontWeight.w800, color: HistorialSportTheme.cyan),
          ),
        ],
      ),
    );
  }
}

class _LeaderboardSection extends ConsumerStatefulWidget {
  const _LeaderboardSection({required this.lbAsync, required this.meAsync});

  final AsyncValue<List<Map<String, dynamic>>> lbAsync;
  final AsyncValue<Map<String, dynamic>> meAsync;

  @override
  ConsumerState<_LeaderboardSection> createState() => _LeaderboardSectionState();
}

class _LeaderboardSectionState extends ConsumerState<_LeaderboardSection> {
  bool _top10Expanded = false;

  @override
  Widget build(BuildContext context) {
    const lbLabels = {'week': 'Semana', 'month': 'Mes', 'year': 'Año'};
    final lbPeriod = ref.watch(historialLeaderboardPeriodProvider);
    final myId = widget.meAsync.valueOrNull?['id']?.toString() ?? '';

    return HistorialSportGlassPanel(
      accent: HistorialSportTheme.orange,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const HistorialSportSectionTitle(
            icon: '🏆',
            title: 'Top Rollers por kilómetros',
            subtitle: 'Compite y motívate con la comunidad',
            accent: HistorialSportTheme.orange,
          ),
          const SizedBox(height: 12),
          HistorialFilterChips(
            labels: lbLabels,
            selected: lbPeriod,
            accent: HistorialSportTheme.orange,
            onSelected: (k) {
              ref.read(historialLeaderboardPeriodProvider.notifier).state = k;
              ref.invalidate(historialLeaderboardProvider);
              setState(() => _top10Expanded = false);
            },
          ),
          const SizedBox(height: 12),
          widget.lbAsync.when(
            data: (lb) {
              if (lb.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Aún no hay ranking para este período',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.permanentMarker(fontSize: 13, color: HistorialSportTheme.textMuted),
                  ),
                );
              }
              final maxKm = lb
                  .map((u) => double.tryParse((u['totalKilometros'] ?? 0).toString()) ?? 0)
                  .fold<double>(0, (a, b) => b > a ? b : a);
              final showExpand = lb.length > 3;

              return Column(
                children: [
                  HistorialSportPodium(entries: lb),
                  if (showExpand) ...[
                    const SizedBox(height: 12),
                    Material(
                      color: HistorialSportTheme.orange.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        onTap: () => setState(() => _top10Expanded = !_top10Expanded),
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _top10Expanded ? 'Ocultar top 10' : 'Ver top 10 completo',
                                  style: GoogleFonts.permanentMarker(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: HistorialSportTheme.orange,
                                  ),
                                ),
                              ),
                              Icon(
                                _top10Expanded ? Icons.expand_less : Icons.expand_more,
                                color: HistorialSportTheme.orange,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                  if (_top10Expanded) ...[
                    const SizedBox(height: 10),
                    for (var i = 0; i < lb.length && i < 10; i++)
                      HistorialRankingRow(
                        user: lb[i],
                        rank: i + 1,
                        maxKm: maxKm > 0 ? maxKm : 1,
                        isCurrentUser: _isMe(lb[i], myId),
                      ),
                  ],
                ],
              );
            },
            loading: () => const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator())),
            error: (e, _) => Padding(
                  padding: const EdgeInsets.all(8),
                  child: Text(
                    'No se pudo cargar el ranking',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.permanentMarker(fontSize: 13, color: Colors.redAccent),
                  ),
                ),
          ),
        ],
      ),
    );
  }

  bool _isMe(Map<String, dynamic> u, String myId) {
    if (myId.isEmpty) return false;
    final id = u['id']?.toString() ?? u['usuarioId']?.toString();
    return id != null && id == myId;
  }
}

class _MisRecorridosSection extends ConsumerStatefulWidget {
  const _MisRecorridosSection({required this.items, this.error});

  final List<Map<String, dynamic>> items;
  final String? error;

  @override
  ConsumerState<_MisRecorridosSection> createState() => _MisRecorridosSectionState();
}

class _MisRecorridosSectionState extends ConsumerState<_MisRecorridosSection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    const filterLabels = {'all': 'Todos', 'week': 'Semana', 'month': 'Mes', 'year': 'Año'};
    final period = ref.watch(historialPeriodProvider);
    final count = widget.items.length;

    return HistorialSportGlassPanel(
      accent: HistorialSportTheme.green,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: HistorialSportSectionTitle(
                  icon: '🗺️',
                  title: 'Mis recorridos',
                  subtitle: 'Consulta tu historial de rutas',
                  accent: HistorialSportTheme.green,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: HistorialSportTheme.green.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: HistorialSportTheme.green),
                ),
                child: Text(
                  '$count',
                  style: GoogleFonts.permanentMarker(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: HistorialSportTheme.green,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Material(
            color: HistorialSportTheme.green.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              onTap: () => setState(() => _expanded = !_expanded),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        _expanded
                            ? 'Ocultar mis recorridos'
                            : count == 0
                                ? 'Ver mis recorridos'
                                : 'Ver mis recorridos ($count)',
                        style: GoogleFonts.permanentMarker(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: HistorialSportTheme.green,
                        ),
                      ),
                    ),
                    Icon(
                      _expanded ? Icons.expand_less : Icons.expand_more,
                      color: HistorialSportTheme.green,
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (_expanded) ...[
            const SizedBox(height: 14),
            HistorialFilterChips(
              labels: filterLabels,
              selected: period,
              accent: HistorialSportTheme.green,
              onSelected: (k) {
                ref.read(historialPeriodProvider.notifier).state = k;
                ref.invalidate(historialRecorridosProvider);
                ref.invalidate(historialUserStatsProvider);
                setState(() => _expanded = true);
              },
            ),
            const SizedBox(height: 14),
            if (widget.error != null)
              Text(widget.error!, style: const TextStyle(color: Colors.redAccent)),
            if (widget.items.isEmpty)
              Column(
                children: [
                  const Text('🛤️', style: TextStyle(fontSize: 48)),
                  const SizedBox(height: 12),
                  Text(
                    'No hay recorridos en este período',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.permanentMarker(fontSize: 16, color: HistorialSportTheme.textPrimary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Inicia un recorrido desde Navegación',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.permanentMarker(fontSize: 13, color: HistorialSportTheme.textMuted),
                  ),
                ],
              )
            else
              for (var i = 0; i < widget.items.length; i++)
                _rideFromMap(widget.items[i], highlight: i == 0),
          ],
        ],
      ),
    );
  }

  Widget _rideFromMap(Map<String, dynamic> it, {required bool highlight}) {
    final origen = (it['origen'] ?? '').toString();
    final destino = (it['destino'] ?? '').toString();
    final fecha = HistorialScreen._formatDate(it['fecha'] ?? it['creadoEn']);
    final stats = it['stats'];
    final distM = num.tryParse((stats is Map ? stats['distanciaTotal'] : null)?.toString() ?? '0') ?? 0;
    final dur = int.tryParse((stats is Map ? stats['duracion'] : null)?.toString() ?? '0') ?? 0;
    final velKmh = distM > 0 && dur > 0 ? (distM / dur) * 3.6 : 0.0;
    return HistorialRideCard(
      origen: origen,
      destino: destino,
      fechaLabel: fecha,
      kmLabel: HistorialScreen.formatDistanceMeters(distM),
      duracionLabel: HistorialScreen.formatDuration(dur),
      velocidadLabel: '${velKmh.toStringAsFixed(1)} km/h',
      highlight: highlight,
    );
  }
}
