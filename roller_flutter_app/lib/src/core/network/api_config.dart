import 'package:flutter/foundation.dart';

class ApiConfig {
  static const int _devPort = 3001;

  /// Para móvil físico (Android/iOS) en la misma WiFi:
  /// - Ejecuta con: `--dart-define=API_HOST=192.168.X.Y`
  /// Para emulador Android:
  /// - default host = 10.0.2.2
  static const String _defaultMobileHost =
      String.fromEnvironment('API_HOST', defaultValue: '10.0.2.2');

  static String baseUrl({bool isWeb = false}) {
    if (isWeb || kIsWeb) {
      // En web, apunta al mismo host donde estás abriendo la app pero con puerto del backend.
      final u = Uri.base;
      final scheme = u.scheme.isEmpty ? 'http' : u.scheme;
      final host = u.host.isEmpty ? 'localhost' : u.host;
      return '$scheme://$host:$_devPort/api';
    }
    return 'http://$_defaultMobileHost:$_devPort/api';
  }
}
