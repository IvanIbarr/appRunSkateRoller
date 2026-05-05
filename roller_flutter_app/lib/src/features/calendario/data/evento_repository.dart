import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class EventoRepository {
  EventoRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> list() async {
    final res = await _dio.get('/evento');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('Respuesta inválida de eventos');
    }
    final list = data['eventos'];
    if (list is! List) {
      return [];
    }
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> create({
    required String organizadorEmail,
    required String tituloRuta,
    required String puntoSalida,
    required String fechaInicio,
    required String cita,
    required String salida,
    required String nivel,
    String? logoGrupo,
    String? lugarDestino,
  }) async {
    final res = await _dio.post(
      '/evento',
      data: {
        'tituloRuta': tituloRuta.trim(),
        'puntoSalida': puntoSalida.trim(),
        'fechaInicio': fechaInicio.trim(),
        'cita': cita.trim(),
        'salida': salida.trim(),
        'nivel': nivel.trim(),
        'logoGrupo': (logoGrupo ?? '').trim().isEmpty ? null : (logoGrupo ?? '').trim(),
        'lugarDestino': (lugarDestino ?? '').trim().isEmpty ? null : (lugarDestino ?? '').trim(),
        // el backend resuelve organizadorId desde email si contiene '@'
        'organizadorId': organizadorEmail.trim(),
      },
    );
    final data = res.data;
    if (data is! Map || data['success'] != true || data['evento'] is! Map) {
      throw Exception('No se pudo crear el evento');
    }
    return Map<String, dynamic>.from(data['evento'] as Map);
  }

  Future<void> delete(String id) async {
    final res = await _dio.delete('/evento/$id');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudo eliminar el evento');
    }
  }
}

final eventoRepositoryProvider = Provider<EventoRepository>((ref) {
  return EventoRepository(ref.watch(dioProvider));
});

