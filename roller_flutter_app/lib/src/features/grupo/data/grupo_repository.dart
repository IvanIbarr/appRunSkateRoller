import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class GrupoRepository {
  GrupoRepository(this._dio);
  final Dio _dio;

  Future<String> getNombre() async {
    final res = await _dio.get('/grupo/nombre');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudo cargar nombre del grupo');
    }
    return (data['nombreGrupo'] ?? '').toString();
  }

  Future<void> updateNombre(String nombre) async {
    final res = await _dio.put('/grupo/nombre', data: {'nombreGrupo': nombre.trim()});
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudo guardar nombre del grupo');
    }
  }

  Future<({List<Map<String, dynamic>> integrantes, String? liderId})> getIntegrantes() async {
    final res = await _dio.get('/grupo/integrantes');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudieron cargar integrantes');
    }
    final list = data['integrantes'];
    final integrantes = list is List
        ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];
    final liderId = data['liderId']?.toString();
    return (integrantes: integrantes, liderId: liderId);
  }

  Future<void> updateNombramiento({required String userId, String? nombramiento}) async {
    final res = await _dio.put('/grupo/nombramiento', data: {'userId': userId, 'nombramiento': nombramiento});
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudo actualizar nombramiento');
    }
  }
}

final grupoRepositoryProvider = Provider<GrupoRepository>((ref) {
  return GrupoRepository(ref.watch(dioProvider));
});

