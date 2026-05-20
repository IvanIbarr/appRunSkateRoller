import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class SeguimientoRepository {
  SeguimientoRepository(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> create({required String origen, required String destino}) async {
    final res = await _dio.post('/seguimiento/create', data: {'origen': origen, 'destino': destino});
    final data = res.data;
    if (data is! Map || data['success'] != true || data['data'] is! Map) {
      throw Exception('No se pudo iniciar seguimiento');
    }
    return Map<String, dynamic>.from(data['data'] as Map);
  }

  Future<void> finish(String id) async {
    final res = await _dio.post('/seguimiento/$id/finish');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudo terminar seguimiento');
    }
  }

  /// GET público (sin credenciales requeridas) — mismo contrato que RN `SEGUIMIENTO.PUBLIC`.
  Future<Map<String, dynamic>> fetchPublic(String id) async {
    final res = await _dio.get('/seguimiento/${Uri.encodeComponent(id)}');
    final root = res.data;
    if (root is! Map || root['success'] != true || root['data'] is! Map) {
      throw Exception('Respuesta de seguimiento inválida');
    }
    return Map<String, dynamic>.from(root['data'] as Map);
  }

  /// Punto GPS durante recorrido (misma ruta que RN `SEGUIMIENTO.LOCATION_POINT`).
  Future<void> addLocationPoint({
    required String seguimientoId,
    required double latitude,
    required double longitude,
    int? timestampMs,
  }) async {
    await _dio.post(
      '/seguimiento/location-point',
      data: {
        'seguimientoId': seguimientoId,
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': null,
        'speed': null,
        'timestamp': timestampMs ?? DateTime.now().millisecondsSinceEpoch,
      },
    );
  }

  Future<Map<String, dynamic>> userStats({String period = 'all'}) async {
    final res = await _dio.get('/seguimiento/user-stats', queryParameters: {'period': period});
    final data = res.data;
    if (data is! Map || data['success'] != true || data['data'] is! Map) {
      throw Exception('No se pudo cargar stats');
    }
    return Map<String, dynamic>.from(data['data'] as Map);
  }

  Future<List<Map<String, dynamic>>> leaderboard({String period = 'year', int limit = 10}) async {
    final res = await _dio.get('/seguimiento/leaderboard', queryParameters: {'period': period, 'limit': limit});
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudo cargar leaderboard');
    }
    final list = data['data'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
}

final seguimientoRepositoryProvider = Provider<SeguimientoRepository>((ref) {
  return SeguimientoRepository(ref.watch(dioProvider));
});

