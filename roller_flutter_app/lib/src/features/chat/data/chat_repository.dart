import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';

import '../../../core/network/api_client.dart';

class ChatRepository {
  ChatRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> getMessages({String chatType = 'general'}) async {
    final res = await _dio.get('/chat/$chatType');
    final data = res.data;
    if (data is! Map || data['success'] != true) {
      throw Exception('Respuesta inválida de chat');
    }
    final list = data['messages'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> sendMessage({
    required String chatType,
    required String text,
    String? mediaUrl,
    String? mediaType, // image | video
  }) async {
    final res = await _dio.post(
      '/chat',
      data: {
        'chatType': chatType,
        'text': text.trim(),
        'mediaUrl': mediaUrl?.trim().isEmpty == true ? null : mediaUrl,
        'mediaType': mediaType?.trim().isEmpty == true ? null : mediaType,
      },
    );
    final data = res.data;
    if (data is! Map || data['success'] != true || data['message'] is! Map) {
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
    final res = await _dio.post('/chat/upload', data: form);
    final data = res.data;
    if (data is! Map || data['success'] != true || data['url'] == null || data['mediaType'] == null) {
      throw Exception('No se pudo subir archivo');
    }
    return (url: data['url'].toString(), mediaType: data['mediaType'].toString());
  }
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(ref.watch(dioProvider));
});

