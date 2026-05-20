import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Aviso local inmediato (Android/iOS) cuando el backend emite `event_reminder`.
/// Para alertas con la app totalmente cerrada hará falta Firebase Cloud Messaging (FCM).
class EventoReminderService {
  EventoReminderService._();

  static final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  static bool _ready = false;

  static Future<void> init() async {
    if (kIsWeb || _ready) return;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );
    _ready = true;
  }

  static Future<void> showFromPayload(Map<String, dynamic> data) async {
    final body = (data['message'] ?? '').toString().trim();
    final titulo = (data['tituloRuta'] ?? data['titulo'] ?? '🛼 Rodada').toString();
    if (kIsWeb) return;
    if (!_ready) await init();
    if (!_ready) return;

    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'evento_salida',
        'Recordatorios de rodadas',
        channelDescription: 'Avisos antes de salir a patinar',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );
    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      '🛼 ¡Prepárate!',
      body.isNotEmpty ? body : 'Alístate: «$titulo» sale en 10 minutos. ¡Nos vemos en la rodada! 🔥',
      details,
    );
  }
}
