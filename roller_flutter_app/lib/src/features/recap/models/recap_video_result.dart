import 'dart:typed_data';

/// Resultado de generar el recap (preview, descarga y share).
class RecapVideoResult {
  RecapVideoResult({
    required this.bytes,
    required this.mimeType,
    required this.extension,
    required this.fileName,
    this.previewUrl,
    required this.playableInBrowser,
    this.formatLabel = '',
  });

  final Uint8List bytes;
  final String mimeType;
  final String extension;
  final String fileName;

  /// URL `blob:` para reproductor HTML / video_player en web.
  final String? previewUrl;

  /// Si el MIME elegido suele reproducirse en este navegador (p. ej. MP4 en Safari).
  final bool playableInBrowser;

  final String formatLabel;

  int get sizeBytes => bytes.length;

  String get sizeLabel {
    final kb = sizeBytes / 1024;
    if (kb < 1024) return '${kb.toStringAsFixed(0)} KB';
    return '${(kb / 1024).toStringAsFixed(1)} MB';
  }
}
