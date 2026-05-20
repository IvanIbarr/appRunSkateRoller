import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/ui/rn_mirror_layouts.dart';
import '../../../core/ui/user_profile_avatar.dart';
import '../../perfil/data/perfil_providers.dart';
import 'widgets/evento_image_uploader.dart';
import '../data/evento_repository.dart';

final _calendarioMeProvider = currentMeProvider;

/// Texto de compartir alineado con `buildShareMessage` en `CalendarioScreen.tsx`.
String buildCalendarioShareMessage(Map<String, dynamic> evento) {
  final titulo = (evento['tituloRuta'] ?? evento['titulo'] ?? 'Evento Roller').toString();
  final fechaRaw = (evento['fecha'] ?? evento['fechaInicio'] ?? '').toString();
  var fechaFormateada = 'Fecha no especificada';
  if (fechaRaw.isNotEmpty) {
    fechaFormateada = fechaRaw;
  }
  final buf = StringBuffer();
  buf.writeln('🎯 $titulo\n');
  buf.writeln('📅 Fecha: $fechaFormateada');
  final hora = (evento['hora'] ?? '').toString();
  if (hora.isNotEmpty) buf.writeln('🕐 Hora: $hora');
  final salida = (evento['salida'] ?? '').toString();
  if (salida.isNotEmpty) buf.writeln('🚀 Salida: $salida');
  final nivel = (evento['nivel'] ?? '').toString();
  if (nivel.isNotEmpty) buf.writeln('⭐ Nivel: $nivel');
  final punto = (evento['puntoSalida'] ?? '').toString();
  if (punto.isNotEmpty) buf.writeln('📍 Punto de salida: $punto');
  final descripcion = (evento['descripcion'] ?? '').toString();
  if (descripcion.isNotEmpty) buf.writeln('\n$descripcion');
  final lugarDestino = (evento['lugarDestino'] ?? '').toString();
  if (lugarDestino.isNotEmpty && (lugarDestino.startsWith('http://') || lugarDestino.startsWith('https://'))) {
    buf.writeln('\n🖼️ Imagen: $lugarDestino');
  }
  final id = (evento['id'] ?? '').toString();
  if (id.isNotEmpty) {
    const webBase = 'https://app.runskateroller.com';
    buf.writeln('\n🔗 Ver detalles:\nrunskateroller://evento/$id\n$webBase/evento/$id');
  } else {
    buf.writeln('\n🔗 Ver detalles en la app');
  }
  buf.writeln('\n¡Únete a este recorrido en patines! 🛼');
  return buf.toString();
}

/// Espejo de `CalendarioScreen.tsx` (StyleSheet: container, overlay, header, calendario, eventCard, modales).
class CalendarioScreen extends ConsumerStatefulWidget {
  const CalendarioScreen({super.key});

  @override
  ConsumerState<CalendarioScreen> createState() => _CalendarioScreenState();
}

class _CalendarioScreenState extends ConsumerState<CalendarioScreen> {
  DateTime _currentMonth = DateTime.now();
  bool _deleting = false;
  Map<String, dynamic>? _eventoEliminar;
  Map<String, dynamic>? _eventoCompartir;

  int _daysInMonth(DateTime d) => DateTime(d.year, d.month + 1, 0).day;

  int _firstWeekday(DateTime d) => DateTime(d.year, d.month, 1).weekday % 7;

  String? _eventYmd(Map<String, dynamic> e) {
    final raw = (e['fecha'] ?? e['fechaInicio'] ?? '').toString();
    if (raw.isEmpty) return null;
    if (RegExp(r'^\d{4}-\d{2}-\d{2}').hasMatch(raw)) return raw.substring(0, 10);
    final slash = RegExp(r'^(\d{1,2})/(\d{1,2})/(\d{4})').firstMatch(raw);
    if (slash != null) {
      final dd = slash.group(1)!.padLeft(2, '0');
      final mm = slash.group(2)!.padLeft(2, '0');
      final yy = slash.group(3)!;
      return '$yy-$mm-$dd';
    }
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return null;
    return '${parsed.year.toString().padLeft(4, '0')}-${parsed.month.toString().padLeft(2, '0')}-${parsed.day.toString().padLeft(2, '0')}';
  }

  List<Map<String, dynamic>> _filteredSorted(List<Map<String, dynamic>> raw) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    bool notTooOld(String? ymd) {
      if (ymd == null || ymd.length < 10) return true;
      final d = DateTime.tryParse(ymd.substring(0, 10));
      if (d == null) return true;
      final eventDay = DateTime(d.year, d.month, d.day);
      final diff = today.difference(eventDay).inDays;
      return diff <= 2;
    }

    final seen = <String>{};
    final out = <Map<String, dynamic>>[];
    for (final e in raw) {
      final ymd = _eventYmd(e);
      if (!notTooOld(ymd)) continue;
      final id = (e['id'] ?? '').toString();
      final key = id.isNotEmpty ? 'id:$id' : '${e['tituloRuta'] ?? e['titulo']}|$ymd';
      if (seen.contains(key)) continue;
      seen.add(key);
      out.add(e);
    }
    out.sort((a, b) => (_eventYmd(a) ?? '').compareTo(_eventYmd(b) ?? ''));
    return out;
  }

  List<Map<String, dynamic>> _eventsForDay(List<Map<String, dynamic>> eventos, int day) {
    final ymd =
        '${_currentMonth.year}-${_currentMonth.month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
    return eventos.where((e) => _eventYmd(e) == ymd).toList();
  }

  bool _isToday(int day) {
    final t = DateTime.now();
    return t.year == _currentMonth.year && t.month == _currentMonth.month && t.day == day;
  }

  bool _isPast(int day) {
    final t = DateTime.now();
    final today = DateTime(t.year, t.month, t.day);
    final d = DateTime(_currentMonth.year, _currentMonth.month, day);
    return d.isBefore(today);
  }

  String _formatFechaRango(Map<String, dynamic> e) {
    final ymd = _eventYmd(e);
    if (ymd == null || ymd.length < 10) return '';
    final d = DateTime.tryParse(ymd.substring(0, 10));
    if (d == null) return '';
    final mes = DateFormat.MMMM('es').format(d);
    final mesCap = mes.isEmpty ? mes : '${mes[0].toUpperCase()}${mes.substring(1)}';
    return '${d.day} $mesCap';
  }

  Future<void> _confirmDelete(WidgetRef ref, String id) async {
    setState(() => _deleting = true);
    try {
      await ref.read(eventoRepositoryProvider).delete(id);
      ref.invalidate(eventosProvider);
      if (mounted) setState(() => _eventoEliminar = null);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  Widget _avatarFromMeMap(Map<String, dynamic> me) {
    return UserProfileAvatar.fromUser(me, size: 45, borderWidth: 0);
  }

  Widget _calendarioContent(List<Map<String, dynamic>> raw, {Map<String, dynamic>? syncMe, String? loadError}) {
    final eventos = _filteredSorted(raw);
    final topPad = MediaQuery.paddingOf(context).top;
    final iosHeaderTop = topPad > 0 ? topPad : 16.0;
    final Widget avatarSlot = syncMe != null
        ? _avatarFromMeMap(syncMe)
        : ref.watch(_calendarioMeProvider).when(
              data: _avatarFromMeMap,
              loading: () => const SizedBox(
                width: 45,
                height: 45,
                child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF6C63FF))),
              ),
              error: (_, _) => Container(
                width: 45,
                height: 45,
                decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF2A2A3E)),
                child: const Icon(Icons.person, size: 22, color: Colors.white54),
              ),
            );

    TextStyle pageTitle() => GoogleFonts.permanentMarker(
          fontSize: 31,
          fontWeight: FontWeight.w700,
          color: Colors.white,
          shadows: const [
            Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
          ],
        );

    TextStyle pageSubtitle() => GoogleFonts.permanentMarker(
          fontSize: 21,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          shadows: const [
            Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
          ],
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: EdgeInsets.fromLTRB(16, iosHeaderTop, 16, 12),
          decoration: const BoxDecoration(
            color: Color.fromRGBO(26, 26, 46, 0.6),
            border: Border(bottom: BorderSide(color: Color.fromRGBO(108, 99, 255, 0.35))),
            boxShadow: [
              BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.1), blurRadius: 4, offset: Offset(0, 2)),
            ],
          ),
          child: Row(
            children: [
              avatarSlot,
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('📅 Calendario', style: pageTitle()),
                    Text('Eventos y rodadas programadas', style: pageSubtitle()),
                  ],
                ),
              ),
              Material(
                color: const Color.fromRGBO(108, 99, 255, 0.25),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(22),
                  side: const BorderSide(color: Color(0xFF6C63FF), width: 2),
                ),
                elevation: 6,
                shadowColor: const Color(0xFF6C63FF).withValues(alpha: 0.4),
                child: InkWell(
                  onTap: () async {
                    await context.push('/calendario/crear');
                    ref.invalidate(eventosProvider);
                  },
                  borderRadius: BorderRadius.circular(22),
                  child: const SizedBox(
                    width: 44,
                    height: 44,
                    child: Center(
                      child: Text(
                        '+',
                        style: TextStyle(
                          fontSize: 28,
                          color: Color(0xFFCFCBFF),
                          fontWeight: FontWeight.w300,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
          child: _MiniCalendarRn(
            onPrev: () => setState(() {
              _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1);
            }),
            onNext: () => setState(() {
              _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1);
            }),
            daysInMonth: _daysInMonth(_currentMonth),
            firstWeekday: _firstWeekday(_currentMonth),
            eventsForDay: (d) => _eventsForDay(eventos, d),
            isToday: _isToday,
            isPast: _isPast,
            monthLabel: () {
              final s = DateFormat.yMMMM('es').format(_currentMonth);
              if (s.isEmpty) return s;
              return '${s[0].toUpperCase()}${s.substring(1)}';
            }(),
          ),
        ),
        if (loadError != null && loadError.isNotEmpty)
          Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'No se pudieron cargar los eventos.\nDesliza hacia abajo para reintentar.\n($loadError)',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.red.shade200, height: 1.4),
            ),
          )
        else if (eventos.isEmpty)
          const Padding(
            padding: EdgeInsets.all(40),
            child: Text(
              'No hay eventos programados',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: Color(0xFF8B9DC3)),
            ),
          )
        else
          ...eventos.map((e) => _EventCardRn(
                evento: e,
                formatRango: () => _formatFechaRango(e),
                onDelete: (id, titulo) => setState(() => _eventoEliminar = {'id': id, 'titulo': titulo}),
                onShare: () => setState(() => _eventoCompartir = e),
                onEdit: () {
                  context.push('/calendario/crear', extra: {'evento': e, 'esEdicion': true});
                },
              )),
      ],
    );
  }

  List<Widget> get _calendarioOverlays => [
        if (_eventoEliminar != null)
          _DeleteModalRn(
            titulo: (_eventoEliminar!['titulo'] ?? '').toString(),
            deleting: _deleting,
            onCancel: () => setState(() => _eventoEliminar = null),
            onDelete: () => _confirmDelete(ref, (_eventoEliminar!['id'] ?? '').toString()),
          ),
        if (_eventoCompartir != null)
          _ShareModalRn(
            evento: _eventoCompartir!,
            onClose: () => setState(() => _eventoCompartir = null),
          ),
      ];

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(eventosProvider);

    return RnMirrorCalendarioLayout(
      overlays: _calendarioOverlays,
      onRefresh: () async {
        ref.invalidate(eventosProvider);
        await ref.read(eventosProvider.future);
      },
      scrollChild: async.when(
        data: _calendarioContent,
        loading: () => const Padding(
          padding: EdgeInsets.all(48),
          child: Center(child: CircularProgressIndicator(color: Color(0xFF6C63FF))),
        ),
        error: (err, _) => _calendarioContent(const [], loadError: err.toString()),
      ),
    );
  }
}

class _MiniCalendarRn extends StatelessWidget {
  const _MiniCalendarRn({
    required this.onPrev,
    required this.onNext,
    required this.daysInMonth,
    required this.firstWeekday,
    required this.eventsForDay,
    required this.isToday,
    required this.isPast,
    required this.monthLabel,
  });

  final VoidCallback onPrev;
  final VoidCallback onNext;
  final int daysInMonth;
  final int firstWeekday;
  final List<Map<String, dynamic>> Function(int day) eventsForDay;
  final bool Function(int day) isToday;
  final bool Function(int day) isPast;
  final String monthLabel;

  @override
  Widget build(BuildContext context) {
    const week = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(26, 26, 46, 0.95),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color.fromRGBO(0, 217, 255, 0.4), width: 2),
        boxShadow: const [
          BoxShadow(color: Color(0xFF00D9FF), blurRadius: 12, offset: Offset(0, 4), spreadRadius: -2),
          BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.2), blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Material(
                  color: const Color.fromRGBO(0, 217, 255, 0.15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: Color.fromRGBO(0, 217, 255, 0.5), width: 1.5),
                  ),
                  child: InkWell(
                    onTap: onPrev,
                    borderRadius: BorderRadius.circular(16),
                    child: const SizedBox(
                      width: 32,
                      height: 32,
                      child: Center(
                        child: Text('‹', style: TextStyle(fontSize: 20, color: Color(0xFF00D9FF), fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                ),
                Text(
                  monthLabel,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                Material(
                  color: const Color.fromRGBO(0, 217, 255, 0.15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: Color.fromRGBO(0, 217, 255, 0.5), width: 1.5),
                  ),
                  child: InkWell(
                    onTap: onNext,
                    borderRadius: BorderRadius.circular(16),
                    child: const SizedBox(
                      width: 32,
                      height: 32,
                      child: Center(
                        child: Text('›', style: TextStyle(fontSize: 20, color: Color(0xFF00D9FF), fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Row(
            children: [
              for (final d in week)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Text(
                      d,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF8B9DC3),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          LayoutBuilder(
            builder: (context, c) {
              final cell = c.maxWidth / 7;
              return Wrap(
                children: [
                  for (var i = 0; i < firstWeekday; i++)
                    SizedBox(
                      width: cell,
                      height: cell.clamp(32, 36),
                    ),
                  for (var day = 1; day <= daysInMonth; day++)
                    SizedBox(
                      width: cell,
                      height: cell.clamp(32, 36),
                      child: _CalendarDayCell(
                        day: day,
                        hasEvents: eventsForDay(day).isNotEmpty,
                        today: isToday(day),
                        past: isPast(day),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _CalendarDayCell extends StatelessWidget {
  const _CalendarDayCell({
    required this.day,
    required this.hasEvents,
    required this.today,
    required this.past,
  });

  final int day;
  final bool hasEvents;
  final bool today;
  final bool past;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(2),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: today
              ? const Color.fromRGBO(0, 217, 255, 0.25)
              : hasEvents
                  ? const Color.fromRGBO(76, 175, 80, 0.15)
                  : null,
          borderRadius: BorderRadius.circular(today ? 6 : 4),
          border: today ? Border.all(color: const Color(0xFF00D9FF), width: 2) : null,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Text(
              '$day',
              style: TextStyle(
                fontSize: today ? 13 : 12,
                fontWeight: today ? FontWeight.w800 : FontWeight.w500,
                color: today
                    ? const Color(0xFF00D9FF)
                    : past
                        ? const Color(0xFF666666).withValues(alpha: 0.4)
                        : hasEvents
                            ? const Color(0xFF4CAF50)
                            : Colors.white,
              ),
            ),
            if (hasEvents)
              Positioned(
                bottom: 2,
                child: Container(
                  width: 3,
                  height: 3,
                  decoration: const BoxDecoration(color: Color(0xFF4CAF50), shape: BoxShape.circle),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _EventCardRn extends StatelessWidget {
  const _EventCardRn({
    required this.evento,
    required this.formatRango,
    required this.onDelete,
    required this.onShare,
    required this.onEdit,
  });

  final Map<String, dynamic> evento;
  final String Function() formatRango;
  final void Function(String id, String titulo) onDelete;
  final VoidCallback onShare;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final titulo = (evento['tituloRuta'] ?? evento['titulo'] ?? 'Evento').toString();
    final id = (evento['id'] ?? '').toString();
    final lugarDestino = (evento['lugarDestino'] ?? '').toString();
    final logoGrupo = (evento['logoGrupo'] ?? '').toString();
    final cita = (evento['cita'] ?? '').toString();
    final salida = (evento['salida'] ?? '').toString();
    final hora = (evento['hora'] ?? '').toString();
    final nivel = (evento['nivel'] ?? '').toString();
    final puntoSalida = (evento['puntoSalida'] ?? '').toString();
    final descripcion = (evento['descripcion'] ?? '').toString();

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 18),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color.fromRGBO(0, 217, 255, 0.1)),
        boxShadow: const [
          BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.4), blurRadius: 12, offset: Offset(0, 6)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 240,
            child: Stack(
              children: [
                if (lugarDestino.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: lugarDestino.startsWith('http') ||
                              lugarDestino.startsWith('data:') ||
                              lugarDestino.startsWith('/')
                          ? EventoDraftImage(
                              uri: lugarDestino,
                              fit: BoxFit.contain,
                              placeholder: _placeholderImg(),
                            )
                          : ColoredBox(
                              color: const Color(0xFF2A2A3E),
                              child: Center(child: Text(lugarDestino, style: const TextStyle(color: Colors.white54))),
                            ),
                    ),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: _placeholderImg(),
                  ),
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 36,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [Colors.black.withValues(alpha: 0.7), Colors.transparent],
                      ),
                    ),
                  ),
                ),
                if (logoGrupo.isNotEmpty)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      width: 80,
                      height: 80,
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color.fromRGBO(255, 255, 255, 0.95),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: const [
                          BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.3), blurRadius: 4, offset: Offset(0, 2)),
                        ],
                      ),
                      child: EventoDraftImage(uri: logoGrupo, fit: BoxFit.contain),
                    ),
                  ),
                if (id.isNotEmpty)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Material(
                      color: const Color.fromRGBO(255, 59, 48, 0.95),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: const BorderSide(color: Colors.white, width: 2),
                      ),
                      elevation: 8,
                      shadowColor: const Color(0xFFFF3B30).withValues(alpha: 0.5),
                      child: InkWell(
                        onTap: () => onDelete(id, titulo),
                        borderRadius: BorderRadius.circular(20),
                        child: const SizedBox(
                          width: 40,
                          height: 40,
                          child: Center(
                            child: Text('✕', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Container(
            color: const Color(0xFF1A1A2E),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  titulo,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: 0.5,
                    height: 28 / 22,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.only(bottom: 8),
                  decoration: const BoxDecoration(
                    border: Border(bottom: BorderSide(color: Color.fromRGBO(255, 215, 0, 0.2))),
                  ),
                  child: Text(
                    formatRango(),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFFFFD700)),
                  ),
                ),
                const SizedBox(height: 10),
                if (cita.isNotEmpty) _infoRow('Cita:', cita),
                if (salida.isNotEmpty) _infoRow('Salida:', salida),
                if (cita.isEmpty && salida.isEmpty && hora.isNotEmpty) _infoRow('Hora:', hora),
                if (nivel.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF6B35),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFF8C5A), width: 1.5),
                        boxShadow: const [
                          BoxShadow(color: Color(0xFFFF6B35), blurRadius: 4, offset: Offset(0, 2)),
                        ],
                      ),
                      child: Text(
                        nivel,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
                if (puntoSalida.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color.fromRGBO(255, 255, 255, 0.04),
                      borderRadius: BorderRadius.circular(8),
                      border: const Border(left: BorderSide(color: Color(0xFF00D9FF), width: 2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '📍 PUNTO DE SALIDA:',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF8B9DC3),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(puntoSalida, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                      ],
                    ),
                  ),
                ],
                if (descripcion.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color.fromRGBO(255, 255, 255, 0.03),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      descripcion,
                      style: const TextStyle(fontSize: 13, color: Color(0xFFD4DFF7), height: 18 / 13),
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(child: _actionPill(label: '✏️ Editar', bg: const Color(0xFFFFA500), border: const Color(0xFFFFB84D), onTap: onEdit)),
                    const SizedBox(width: 10),
                    Expanded(child: _actionPill(label: 'Registrarse', bg: const Color(0xFF00D9FF), border: Colors.transparent, onTap: () {})),
                    const SizedBox(width: 10),
                    Expanded(child: _actionPill(label: '📤 Compartir', bg: const Color(0xFF9C27B0), border: Colors.transparent, onTap: onShare)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholderImg() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: const Color(0xFF2A2A3E),
      alignment: Alignment.center,
      child: const Text('📅', style: TextStyle(fontSize: 60)),
    );
  }

  static Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 55,
            child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF8B9DC3))),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white))),
        ],
      ),
    );
  }

  static Widget _actionPill({
    required String label,
    required Color bg,
    required Color border,
    required VoidCallback onTap,
  }) {
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(10),
      elevation: 5,
      shadowColor: bg.withValues(alpha: 0.35),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: border, width: label.contains('Editar') ? 1.5 : 0),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.3),
          ),
        ),
      ),
    );
  }
}

class _DeleteModalRn extends StatelessWidget {
  const _DeleteModalRn({
    required this.titulo,
    required this.deleting,
    required this.onCancel,
    required this.onDelete,
  });

  final String titulo;
  final bool deleting;
  final VoidCallback onCancel;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Material(
        color: const Color.fromRGBO(0, 0, 0, 0.75),
        child: Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            padding: const EdgeInsets.all(24),
            constraints: const BoxConstraints(maxWidth: 400),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A2E),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color.fromRGBO(0, 217, 255, 0.3), width: 2),
              boxShadow: const [
                BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.5), blurRadius: 16, offset: Offset(0, 8)),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('🗑️', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 12),
                const Text(
                  'Eliminar Evento',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFFFF3B30)),
                ),
                const SizedBox(height: 20),
                const Text(
                  '¿Estás seguro de que deseas eliminar el evento',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, color: Colors.white, height: 22 / 16),
                ),
                const SizedBox(height: 8),
                Text(
                  '"$titulo"',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF00D9FF)),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Esta acción no se puede deshacer.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFFFF6B35)),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: deleting ? null : onCancel,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.3), width: 2),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Cancelar', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Material(
                        color: const Color(0xFFFF3B30),
                        borderRadius: BorderRadius.circular(12),
                        elevation: 6,
                        shadowColor: const Color(0xFFFF3B30).withValues(alpha: 0.4),
                        child: InkWell(
                          onTap: deleting ? null : onDelete,
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFFF6B6B), width: 2),
                            ),
                            child: deleting
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Text('Eliminar', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ShareModalRn extends StatelessWidget {
  const _ShareModalRn({required this.evento, required this.onClose});

  final Map<String, dynamic> evento;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Material(
        color: const Color.fromRGBO(0, 0, 0, 0.7),
        child: Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            padding: const EdgeInsets.all(20),
            constraints: const BoxConstraints(maxWidth: 360),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A2E),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Color.fromRGBO(255, 255, 255, 0.15)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Compartir evento',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Elige una opción para compartir',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Color(0xFFC7D0E0)),
                ),
                const SizedBox(height: 16),
                _shareBtn('WhatsApp', const Color(0xFF25D366), () {
                  (() async {
                    final msg = buildCalendarioShareMessage(evento);
                    final uri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(msg)}');
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                    onClose();
                  })();
                }),
                const SizedBox(height: 10),
                _shareBtn('Facebook', const Color(0xFF1877F2), () {
                  (() async {
                    final msg = buildCalendarioShareMessage(evento);
                    final id = (evento['id'] ?? '').toString();
                    final webLink = id.isEmpty ? 'https://app.runskateroller.com' : 'https://app.runskateroller.com/evento/$id';
                    final u = Uri.parse(
                      'https://www.facebook.com/sharer/sharer.php?u=${Uri.encodeComponent(webLink)}&quote=${Uri.encodeComponent(msg)}',
                    );
                    await launchUrl(u, mode: LaunchMode.externalApplication);
                    onClose();
                  })();
                }),
                const SizedBox(height: 10),
                _shareBtn('Instagram', const Color(0xFFC13584), () {
                  onClose();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Se abrió el flujo: pega el texto del evento en Instagram (historia o publicación).'),
                    ),
                  );
                  (() async {
                    await launchUrl(Uri.parse('https://www.instagram.com/'), mode: LaunchMode.externalApplication);
                  })();
                }),
                const SizedBox(height: 12),
                Material(
                  color: const Color(0xFF00D9FF),
                  borderRadius: BorderRadius.circular(12),
                  child: InkWell(
                    onTap: () {
                      (() async {
                        final msg = buildCalendarioShareMessage(evento);
                        final subject = (evento['tituloRuta'] ?? evento['titulo'] ?? 'Evento Roller').toString();
                        await Share.share(msg, subject: subject);
                        onClose();
                      })();
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: const SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: Center(child: Text('Más opciones', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                TextButton(onPressed: onClose, child: const Text('Cancelar', style: TextStyle(color: Color(0xFFC7D0E0), fontWeight: FontWeight.w600))),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static Widget _shareBtn(String label, Color bg, VoidCallback onTap) {
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          width: double.infinity,
          height: 44,
          child: Center(child: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14))),
        ),
      ),
    );
  }
}
