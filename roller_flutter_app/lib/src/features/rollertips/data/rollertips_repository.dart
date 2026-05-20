import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';

import '../../../core/network/api_client.dart';

class RollerTipsRepository {
  RollerTipsRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> list({String scope = 'active'}) async {
    final res = await _dio.get('/rollertips', queryParameters: {'scope': scope});
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('Respuesta inválida de tips');
    }
    final list = data['data'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> create({
    required PlatformFile video,
    String description = '',
    String? uploaderName,
    String? uploaderEmail,
    String? uploaderAlias,
  }) async {
    MultipartFile mf;
    final filename = video.name.isEmpty ? 'video.mp4' : video.name;
    if (video.bytes != null) {
      mf = MultipartFile.fromBytes(video.bytes!, filename: filename);
    } else if (video.path != null) {
      mf = await MultipartFile.fromFile(video.path!, filename: filename);
    } else {
      throw Exception('No se pudo leer el archivo seleccionado');
    }

    final form = FormData.fromMap({
      'video': mf,
      'description': description,
      ...?((uploaderName == null) ? null : {'uploaderName': uploaderName}),
      ...?((uploaderEmail == null) ? null : {'uploaderEmail': uploaderEmail}),
      ...?((uploaderAlias == null) ? null : {'uploaderAlias': uploaderAlias}),
    });

    final res = await _dio.post('/rollertips', data: form);
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception((data is Map ? data['error'] : null) ?? 'Error subiendo tip');
    }
    final tip = data['data'];
    if (tip is! Map) {
      throw Exception('Respuesta inválida (tip)');
    }
    return Map<String, dynamic>.from(tip);
  }

  Future<void> deleteTip(String id) async {
    final res = await _dio.delete('/rollertips/$id');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception((data is Map ? data['error'] : null) ?? 'No se pudo eliminar');
    }
  }

  Future<Map<String, dynamic>> addReaction({
    required String tipId,
    required String reaction,
  }) async {
    final res = await _dio.post('/rollertips/$tipId/reactions', data: {'reaction': reaction});
    final data = res.data;
    if (data is! Map || data['success'] != true || data['data'] is! Map) {
      throw Exception((data is Map ? data['error'] : null) ?? 'No se pudo registrar la reacción');
    }
    return Map<String, dynamic>.from(data['data'] as Map);
  }

  Future<Map<String, dynamic>> addComment({
    required String tipId,
    required String text,
    String? authorId,
    String? authorName,
  }) async {
    final res = await _dio.post(
      '/rollertips/$tipId/comments',
      data: {
        'text': text,
        if (authorId != null) 'authorId': authorId,
        if (authorName != null) 'authorName': authorName,
      },
    );
    final data = res.data;
    if (data is! Map || data['success'] != true || data['data'] is! Map) {
      throw Exception((data is Map ? data['error'] : null) ?? 'No se pudo comentar');
    }
    return Map<String, dynamic>.from(data['data'] as Map);
  }
}

final rollertipsRepositoryProvider = Provider<RollerTipsRepository>((ref) {
  return RollerTipsRepository(ref.watch(dioProvider));
});

