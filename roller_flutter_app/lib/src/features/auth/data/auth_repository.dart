import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';

class AuthRepository {
  AuthRepository(this._dio);

  final Dio _dio;

  Future<String> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {
          'email': email.trim(),
          'password': password,
        },
      );

      final data = response.data;
      if (data is! Map || data['success'] != true || data['token'] == null) {
        final err = data is Map ? data['error']?.toString() : null;
        throw Exception(err ?? 'No se pudo iniciar sesión');
      }

      return data['token'] as String;
    } on DioException catch (e) {
      final body = e.response?.data;
      if (body is Map && body['error'] != null) {
        throw Exception(body['error'].toString());
      }
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw Exception(
          'No hay conexión con el servidor. Comprueba WiFi y que el backend esté en el puerto 3001.',
        );
      }
      rethrow;
    }
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

    return data['token'] as String;
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

  /// Espejo de `authService.updatePersonalInfo` (PUT `/auth/personal-info`).
  Future<({bool success, Map<String, dynamic>? usuario, String? error})> updatePersonalInfo({
    required int edad,
    required String cumpleanosIsoDateOnly,
    required String sexo,
    required String nacionalidad,
    String? telefono,
  }) async {
    try {
      final res = await _dio.put(
        '/auth/personal-info',
        data: {
          'edad': edad,
          'cumpleaños': cumpleanosIsoDateOnly,
          'sexo': sexo,
          'nacionalidad': nacionalidad,
          'telefono': telefono,
        },
      );
      final data = res.data;
      if (data is! Map) {
        return (success: false, usuario: null, error: 'Respuesta inválida');
      }
      if (data['success'] == true && data['usuario'] is Map) {
        return (
          success: true,
          usuario: Map<String, dynamic>.from(data['usuario'] as Map),
          error: null,
        );
      }
      return (
        success: false,
        usuario: null,
        error: data['error']?.toString() ?? 'No se pudo guardar',
      );
    } on DioException catch (e) {
      final msg = e.response?.data is Map ? (e.response!.data as Map)['error']?.toString() : null;
      return (success: false, usuario: null, error: msg ?? e.message ?? 'Error de red');
    } catch (e) {
      return (success: false, usuario: null, error: e.toString());
    }
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider));
});
