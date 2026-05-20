import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_token_storage_native.dart'
    if (dart.library.html) 'app_secure_storage_web.dart' as platform;

/// Datos sensibles distintos del JWT (p. ej. tickets de soporte).
final appSecureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return platform.appSecureStorage;
});
