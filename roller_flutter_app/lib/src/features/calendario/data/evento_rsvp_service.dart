import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

/// Recordatorio local 15 min antes de la cita (paridad RN `eventoRemindersService`).
class EventoRsvpService {
  EventoRsvpService._();

  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  static bool _ready = false;

  static Future<void> init() async {
    if (kIsWeb || _ready) return;
    tz_data.initializeTimeZones();
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );
    _ready = true;
  }

  static int _notifId(String eventoId) => eventoId.hashCode & 0x7fffffff;

  static DateTime? _citaDate(Map<String, dynamic> evento) {
    final fechaRaw = (evento['fechaInicio'] ?? evento['fecha'] ?? '').toString();
    final timeRaw = (evento['cita'] ?? evento['hora'] ?? evento['salida'] ?? '').toString();
    if (fechaRaw.isEmpty) return null;
    final datePart = fechaRaw.contains('T') ? fechaRaw.split('T').first : fechaRaw;
    final m = RegExp(r'^(\d{1,2})[:\.](\d{2})').firstMatch(timeRaw.trim());
    if (m == null) return null;
    final h = int.tryParse(m.group(1) ?? '');
    final min = int.tryParse(m.group(2) ?? '');
    if (h == null || min == null) return null;
    final parts = datePart.split('-');
    if (parts.length < 3) return null;
    final y = int.tryParse(parts[0]);
    final mo = int.tryParse(parts[1]);
    final d = int.tryParse(parts[2]);
    if (y == null || mo == null || d == null) return null;
    return DateTime(y, mo, d, h, min);
  }

  static Future<({bool ok, String? error})> schedule15MinBefore(
    Map<String, dynamic> evento,
  ) async {
    if (kIsWeb) {
      return (
        ok: false,
        error: 'En el navegador el aviso local solo funciona en la app Android/iOS.',
      );
    }
    final id = (evento['id'] ?? '').toString();
    if (id.isEmpty) return (ok: false, error: 'Evento sin id');
    final start = _citaDate(evento);
    if (start == null) {
      return (ok: false, error: 'No se pudo leer fecha u hora del evento.');
    }
    final fireAt = start.subtract(const Duration(minutes: 15));
    if (!fireAt.isAfter(DateTime.now())) {
      return (
        ok: false,
        error: 'Falta poco o el evento ya pasó. Regístrate con más antelación.',
      );
    }
    if (!_ready) await init();
    if (!_ready) return (ok: false, error: 'Notificaciones no disponibles');

    final titulo = (evento['tituloRuta'] ?? evento['titulo'] ?? 'Rodada').toString();
    final tzFire = tz.TZDateTime.from(fireAt, tz.local);
    await _plugin.zonedSchedule(
      _notifId(id),
      '🛼 Rodada en 15 min',
      '«$titulo» — alístate, nos vemos pronto.',
      tzFire,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'evento_rsvp',
          'Recordatorios de eventos',
          channelDescription: 'Aviso 15 min antes de la cita',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
    );
    return (ok: true, error: null);
  }

  static Future<void> cancel15Min(String eventoId) async {
    if (kIsWeb || eventoId.isEmpty) return;
    if (!_ready) await init();
    await _plugin.cancel(_notifId(eventoId));
  }
}
