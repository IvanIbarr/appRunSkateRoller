import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class GrupoNombreSaveResult {
  const GrupoNombreSaveResult({
    required this.nombreGrupo,
    required this.created,
    required this.message,
  });

  final String nombreGrupo;
  final bool created;
  final String message;
}

class GrupoRepository {
  GrupoRepository(this._dio);
  final Dio _dio;

  static String readApiError(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['error'] != null) {
        return data['error'].toString();
      }
      final code = error.response?.statusCode;
      if (code == 409) {
        return 'Ya existe un grupo con ese nombre. Elige otro.';
      }
      if (code == 403) {
        return 'No tienes permiso para crear o editar el grupo.';
      }
      return error.message ?? 'Error de conexion con el servidor';
    }
    return error.toString();
  }

  Future<String> getNombre() async {
    final res = await _dio.get('/grupo/nombre');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudo cargar nombre del grupo');
    }
    return (data['nombreGrupo'] ?? '').toString();
  }

  Future<GrupoNombreSaveResult> updateNombre(String nombre) async {
    try {
      final res = await _dio.put(
        '/grupo/nombre',
        data: {'nombreGrupo': nombre.trim()},
      );
      final data = res.data;
      if (data is! Map || data['success'] != true) {
        final err = data is Map ? (data['error'] ?? 'No se pudo guardar') : 'No se pudo guardar';
        throw Exception(err.toString());
      }
      return GrupoNombreSaveResult(
        nombreGrupo: (data['nombreGrupo'] ?? nombre.trim()).toString(),
        created: data['created'] == true,
        message: (data['message'] ?? 'Nombre guardado').toString(),
      );
    } on DioException catch (e) {
      throw Exception(readApiError(e));
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

  Future<void> salirGrupo() async {
    try {
      final res = await _dio.post('/grupo/salir');
      final data = res.data;
      if (data is! Map || data['success'] != true) {
        final err = data is Map ? (data['error'] ?? 'No se pudo salir del grupo') : 'No se pudo salir del grupo';
        throw Exception(err.toString());
      }
    } on DioException catch (e) {
      throw Exception(readApiError(e));
    }
  }
}

final grupoRepositoryProvider = Provider<GrupoRepository>((ref) {
  return GrupoRepository(ref.watch(dioProvider));
});
