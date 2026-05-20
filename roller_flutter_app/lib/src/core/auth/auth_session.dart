import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_token_storage.dart';

class AuthSession {
  AuthSession({required this.token});

  final String token;
}

class AuthSessionController extends AsyncNotifier<AuthSession?> {
  @override
  Future<AuthSession?> build() async {
    try {
      final storage = ref.watch(authTokenStorageProvider);
      final token = await storage.read();
      if (token == null || token.trim().isEmpty) {
        return null;
      }
      return AuthSession(token: token);
    } catch (e, st) {
      debugPrint('AuthSession: no se pudo leer token ($e)\n$st');
      return null;
    }
  }

  Future<void> setToken(String token) async {
    final storage = ref.read(authTokenStorageProvider);
    await storage.write(token);
    state = AsyncData(AuthSession(token: token));
  }

  Future<void> clear() async {
    final storage = ref.read(authTokenStorageProvider);
    await storage.delete();
    state = const AsyncData(null);
  }
}

final authSessionProvider =
    AsyncNotifierProvider<AuthSessionController, AuthSession?>(() {
  return AuthSessionController();
});
