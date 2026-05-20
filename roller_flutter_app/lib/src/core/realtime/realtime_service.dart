import 'package:socket_io_client/socket_io_client.dart' as io;

import '../network/api_config.dart';

/// Cliente Socket.IO (mismo canal `events` que React Native).
class RealtimeService {
  RealtimeService._();

  static final RealtimeService instance = RealtimeService._();

  io.Socket? _socket;

  io.Socket connect() {
    if (_socket != null) return _socket!;
    final origin = ApiConfig.uploadsOrigin();
    _socket = io.io(
      origin,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .build(),
    );
    return _socket!;
  }

  io.Socket? get socket => _socket;
}
