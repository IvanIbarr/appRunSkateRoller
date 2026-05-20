import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_token_storage_native.dart'
    if (dart.library.html) 'auth_token_storage_web.dart' as platform;

/// JWT: web → `localStorage` (funciona en `http://192.168.x.x`); móvil → secure storage.
class AuthTokenStorage {
  Future<String?> read() => platform.readToken();

  Future<void> write(String token) => platform.writeToken(token);

  Future<void> delete() => platform.deleteToken();
}

final authTokenStorageProvider = Provider<AuthTokenStorage>((ref) {
  return AuthTokenStorage();
});
