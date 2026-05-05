import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class PerfilRepository {
  PerfilRepository(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> me() async {
    final res = await _dio.get('/auth/me');
    final data = res.data;
    if (data is! Map || data['success'] != true || data['usuario'] is! Map) {
      throw Exception('Respuesta inválida de perfil');
    }
    return Map<String, dynamic>.from(data['usuario'] as Map);
  }
}

final perfilRepositoryProvider = Provider<PerfilRepository>((ref) {
  return PerfilRepository(ref.watch(dioProvider));
});

