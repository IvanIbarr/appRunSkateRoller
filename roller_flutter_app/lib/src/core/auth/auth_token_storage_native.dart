import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _tokenKey = 'auth_token';

const _secure = FlutterSecureStorage(
  webOptions: WebOptions(
    dbName: 'RunSkateRollerSecure',
    publicKey: 'RunSkateRoller',
  ),
);

Future<String?> readToken() async {
  return _secure.read(key: _tokenKey);
}

Future<void> writeToken(String token) async {
  await _secure.write(key: _tokenKey, value: token);
}

Future<void> deleteToken() async {
  await _secure.delete(key: _tokenKey);
}

/// Almacén seguro para otros datos (soporte, etc.) en nativo.
const FlutterSecureStorage appSecureStorage = _secure;
