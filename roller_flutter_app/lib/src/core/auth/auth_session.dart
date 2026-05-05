import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthSession {
  AuthSession({required this.token});

  final String token;
}

class AuthSessionController extends AsyncNotifier<AuthSession?> {
  static const _tokenKey = 'auth_token';

  @override
  Future<AuthSession?> build() async {
    final storage = ref.watch(_secureStorageProvider);
    final token = await storage.read(key: _tokenKey);
    if (token == null || token.trim().isEmpty) {
      return null;
    }
    return AuthSession(token: token);
  }

  Future<void> setToken(String token) async {
    final storage = ref.read(_secureStorageProvider);
    await storage.write(key: _tokenKey, value: token);
    state = AsyncData(AuthSession(token: token));
  }

  Future<void> clear() async {
    final storage = ref.read(_secureStorageProvider);
    await storage.delete(key: _tokenKey);
    state = const AsyncData(null);
  }
}

final _secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final authSessionProvider =
    AsyncNotifierProvider<AuthSessionController, AuthSession?>(() {
  return AuthSessionController();
});

