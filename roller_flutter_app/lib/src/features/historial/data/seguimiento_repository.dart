import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class SeguimientoRepository {
  SeguimientoRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> getHistory({String period = 'all'}) async {
    final res = await _dio.get('/seguimiento/history', queryParameters: {'period': period});
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('Respuesta inválida de historial');
    }
    final list = data['data'];
    if (list is! List) {
      return [];
    }
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
}

final seguimientoRepositoryProvider = Provider<SeguimientoRepository>((ref) {
  return SeguimientoRepository(ref.watch(dioProvider));
});

