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
        'titulo': tituloRuta.trim(),
        'tituloRuta': tituloRuta.trim(),
        'puntoSalida': puntoSalida.trim(),
        'fechaInicio': fechaInicio.trim(),
        'fecha': fechaInicio.trim(),
        'hora': cita.trim(),
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

  Future<Map<String, dynamic>> update({
    required String id,
    required String tituloRuta,
    required String puntoSalida,
    required String fechaInicio,
    required String cita,
    required String salida,
    required String nivel,
    String? logoGrupo,
    String? lugarDestino,
  }) async {
    final ymd = _ddmmyyyyToYmd(fechaInicio);
    final res = await _dio.put(
      '/evento/$id',
      data: {
        'titulo': tituloRuta.trim(),
        'tituloRuta': tituloRuta.trim(),
        'fecha': ymd ?? fechaInicio.trim(),
        'hora': cita.trim(),
        'puntoEncuentroDireccion': puntoSalida.trim(),
        'puntoSalida': puntoSalida.trim(),
        'fechaInicio': fechaInicio.trim(),
        'cita': cita.trim(),
        'salida': salida.trim(),
        'nivel': nivel.trim(),
        'logoGrupo': (logoGrupo ?? '').trim().isEmpty ? null : (logoGrupo ?? '').trim(),
        'lugarDestino': (lugarDestino ?? '').trim().isEmpty ? null : (lugarDestino ?? '').trim(),
      },
    );
    final data = res.data;
    if (data is! Map || data['success'] != true || data['evento'] is! Map) {
      throw Exception(
        data is Map && data['error'] != null ? data['error'].toString() : 'No se pudo actualizar el evento',
      );
    }
    return Map<String, dynamic>.from(data['evento'] as Map);
  }

  static String? _ddmmyyyyToYmd(String raw) {
    final m = RegExp(r'^(\d{1,2})/(\d{1,2})/(\d{4})$').firstMatch(raw.trim());
    if (m == null) return null;
    final dd = m.group(1)!.padLeft(2, '0');
    final mm = m.group(2)!.padLeft(2, '0');
    final yyyy = m.group(3)!;
    return '$yyyy-$mm-$dd';
  }

  Future<void> delete(String id) async {
    final res = await _dio.delete('/evento/$id');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('No se pudo eliminar el evento');
    }
  }

  Future<({int participantCount, bool isRegistered})> register(String eventoId) async {
    final res = await _dio.post('/evento/$eventoId/register');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception((data is Map ? data['error'] : null) ?? 'No se pudo registrar');
    }
    return (
      participantCount: (data['participantCount'] as num?)?.toInt() ?? 0,
      isRegistered: data['isRegistered'] == true,
    );
  }

  Future<({int participantCount, bool isRegistered})> unregister(String eventoId) async {
    final res = await _dio.delete('/evento/$eventoId/register');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception((data is Map ? data['error'] : null) ?? 'No se pudo cancelar');
    }
    return (
      participantCount: (data['participantCount'] as num?)?.toInt() ?? 0,
      isRegistered: data['isRegistered'] == true,
    );
  }
}

final eventoRepositoryProvider = Provider<EventoRepository>((ref) {
  return EventoRepository(ref.watch(dioProvider));
});

final eventosProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(eventoRepositoryProvider).list();
});

