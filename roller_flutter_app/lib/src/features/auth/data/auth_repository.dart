import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/network/api_client.dart';

class AuthRepository {
  AuthRepository(this._dio, this._storage);

  final Dio _dio;
  final FlutterSecureStorage _storage;

  Future<String> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/login',
      data: {
        'email': email.trim(),
        'password': password,
      },
    );

    final data = response.data;
    if (data is! Map || data['success'] != true || data['token'] == null) {
      throw Exception('No se pudo iniciar sesion');
    }

    final token = data['token'] as String;
    await _storage.write(key: 'auth_token', value: token);
    return token;
  }

  Future<String> registro({
    required String email,
    required String password,
    required String confirmPassword,
    required int edad,
    required String cumpleanosIso,
    required String sexo,
    required String nacionalidad,
    required String tipoPerfil,
    String? avatar,
  }) async {
    final response = await _dio.post(
      '/auth/registro',
      data: {
        'email': email.trim(),
        'password': password,
        'confirmPassword': confirmPassword,
        'edad': edad,
        'cumpleaños': cumpleanosIso,
        'sexo': sexo,
        'nacionalidad': nacionalidad,
        'tipoPerfil': tipoPerfil,
        if (avatar != null && avatar.trim().isNotEmpty) 'avatar': avatar.trim(),
      },
    );

    final data = response.data;
    if (data is! Map || data['success'] != true || data['token'] == null) {
      throw Exception('No se pudo registrar');
    }

    final token = data['token'] as String;
    await _storage.write(key: 'auth_token', value: token);
    return token;
  }

  Future<void> agregarAlias(String alias) async {
    await _dio.post(
      '/alias/agregar',
      data: {'alias': alias.trim()},
    );
  }

  Future<void> cambiarAlias(String alias) async {
    await _dio.put(
      '/alias/cambiar',
      data: {'alias': alias.trim()},
    );
  }

  Future<({String? alias, int? cambiosRestantes})> getAliasInfo() async {
    final res = await _dio.get('/alias');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudo cargar alias');
    }
    final alias = data['alias']?.toString();
    final cambios = data['cambiosRestantes'];
    return (
      alias: alias,
      cambiosRestantes: cambios is int ? cambios : int.tryParse('${cambios ?? ''}'),
    );
  }

  Future<void> forgotPassword(String email) async {
    await _dio.post(
      '/auth/forgot-password',
      data: {'email': email.trim()},
    );
  }

  Future<String> verifyResetCode({
    required String email,
    required String code,
  }) async {
    final res = await _dio.post(
      '/auth/verify-reset-code',
      data: {'email': email.trim(), 'code': code.trim()},
    );
    final data = res.data;
    if (data is! Map || data['success'] != true || data['resetToken'] == null) {
      throw Exception('Código inválido');
    }
    return data['resetToken'] as String;
  }

  Future<void> resetPassword({
    required String email,
    required String resetToken,
    required String password,
  }) async {
    await _dio.post(
      '/auth/reset-password',
      data: {
        'email': email.trim(),
        'resetToken': resetToken,
        'newPassword': password,
      },
    );
  }

  Future<Map<String, dynamic>> updateAvatar(String? avatar) async {
    final res = await _dio.put(
      '/auth/avatar',
      data: {'avatar': avatar},
    );
    final data = res.data;
    if (data is! Map || data['success'] != true || data['usuario'] is! Map) {
      throw Exception('No se pudo actualizar avatar');
    }
    return Map<String, dynamic>.from(data['usuario'] as Map);
  }

  Future<Map<String, dynamic>> updateFotoPerfil(String? fotoPerfil) async {
    final res = await _dio.put(
      '/auth/foto-perfil',
      data: {'fotoPerfil': fotoPerfil},
    );
    final data = res.data;
    if (data is! Map || data['success'] != true || data['usuario'] is! Map) {
      throw Exception('No se pudo actualizar foto de perfil');
    }
    return Map<String, dynamic>.from(data['usuario'] as Map);
  }
}

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(dioProvider),
    ref.watch(secureStorageProvider),
  );
});
