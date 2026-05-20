import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_session.dart';
import '../../../core/realtime/realtime_service.dart';
import 'evento_reminder_service.dart';
import 'evento_repository.dart';

final _reminderMessengerKey = GlobalKey<ScaffoldMessengerState>();

GlobalKey<ScaffoldMessengerState> get eventoReminderMessengerKey => _reminderMessengerKey;

/// Socket.IO: refresco del calendario y avisos 10 min antes (todos los usuarios conectados).
final eventoRealtimeBootstrapProvider = Provider<void>((ref) {
  final session = ref.watch(authSessionProvider);
  if (session.valueOrNull == null) return;

  final socket = RealtimeService.instance.connect();

  void refreshEvents(_) => ref.invalidate(eventosProvider);

  void onReminder(dynamic data) {
    final map = data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
    final msg = (map['message'] ?? '').toString();
    EventoReminderService.showFromPayload(map);
    _reminderMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Text(msg.isNotEmpty ? msg : '¡Tu rodada sale en 10 minutos! 🛼'),
        duration: const Duration(seconds: 8),
        backgroundColor: const Color(0xFF1A1A2E),
      ),
    );
  }

  socket.on('event_created', refreshEvents);
  socket.on('event_updated', refreshEvents);
  socket.on('event_deleted', refreshEvents);
  socket.on('event_reminder', onReminder);

  ref.onDispose(() {
    socket.off('event_created', refreshEvents);
    socket.off('event_updated', refreshEvents);
    socket.off('event_deleted', refreshEvents);
    socket.off('event_reminder', onReminder);
  });
});
