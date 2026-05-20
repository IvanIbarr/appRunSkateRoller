import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';

import '../../../core/network/api_client.dart';

class ChatRepository {
  ChatRepository(this._dio);

  final Dio _dio;

  String _normType(String chatType) {
    final t = chatType.trim().toLowerCase();
    return t == 'staff' ? 'staff' : 'general';
  }

  Future<List<Map<String, dynamic>>> getMessages({String chatType = 'general'}) async {
    final ct = _normType(chatType);
    final res = await _dio.get<Map<String, dynamic>>('/chat/$ct');
    final data = res.data;
    if (data == null) return [];
    if (data['success'] != true) {
      final err = (data['error'] ?? 'Respuesta inválida').toString();
      throw Exception(err);
    }
    final list = data['messages'];
    if (list is! List) return [];
    final out = <Map<String, dynamic>>[];
    for (final e in list) {
      if (e is Map) {
        out.add(Map<String, dynamic>.from(e));
      }
    }
    return out;
  }

  Future<Map<String, dynamic>> sendMessage({
    required String chatType,
    required String text,
    String? mediaUrl,
    String? mediaType,
  }) async {
    final ct = _normType(chatType);
    final res = await _dio.post<Map<String, dynamic>>(
      '/chat',
      data: {
        'chatType': ct,
        'text': text.trim(),
        'mediaUrl': mediaUrl?.trim().isEmpty == true ? null : mediaUrl,
        'mediaType': mediaType?.trim().isEmpty == true ? null : mediaType,
      },
    );
    final data = res.data;
    if (data == null || data['success'] != true || data['message'] is! Map) {
      throw Exception('No se pudo enviar mensaje');
    }
    return Map<String, dynamic>.from(data['message'] as Map);
  }

  Future<({String url, String mediaType})> uploadMedia(PlatformFile file) async {
    final bytes = file.bytes;
    final name = file.name;
    final form = FormData.fromMap({
      'file': bytes != null
          ? MultipartFile.fromBytes(bytes, filename: name)
          : MultipartFile.fromFileSync(file.path!, filename: name),
    });
    final res = await _dio.post<Map<String, dynamic>>('/chat/upload', data: form);
    final data = res.data;
    if (data == null || data['success'] != true || data['url'] == null || data['mediaType'] == null) {
      throw Exception('No se pudo subir archivo');
    }
    final url = data['url'].toString();
    final mediaType = data['mediaType'].toString();
    debugPrint('CHAT UPLOAD API response url=$url mediaType=$mediaType');
    return (url: url, mediaType: mediaType);
  }
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(ref.watch(dioProvider));
});
