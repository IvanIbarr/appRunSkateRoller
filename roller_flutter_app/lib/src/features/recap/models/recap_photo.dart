import 'package:flutter/foundation.dart';

/// Foto seleccionada para el recap (bytes en memoria + URL de preview en web).
class RecapPhoto {
  RecapPhoto({
    required this.id,
    required this.bytes,
    required this.fileName,
    this.previewUrl,
  });

  final String id;
  final Uint8List bytes;
  final String fileName;

  /// `blob:` URL en web; revocar en [dispose].
  final String? previewUrl;

  String get timestampLabel {
    final idx = id.hashCode.abs() % 12;
    final sec = 2 + idx * 3;
    final m = sec ~/ 60;
    final s = sec % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  void dispose() {
    if (kIsWeb && previewUrl != null && previewUrl!.startsWith('blob:')) {
      // Revocado desde recap_share / generator al reemplazar video.
    }
  }
}
