import 'dart:convert';
import 'dart:io' show File;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/network/api_config.dart';

/// Espejo de `ImageUploader.tsx` (RN): selección + preview + data URL.
abstract final class EventoImagePicker {
  static const maxBytes = 5 * 1024 * 1024;
  static const marketingMaxBytes = 10 * 1024 * 1024;

  static Future<String?> pickDataUrl({int maxFileBytes = maxBytes}) async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
    );
    final file = res?.files.firstOrNull;
    if (file == null) return null;

    List<int> bytes;
    if (file.bytes != null) {
      bytes = file.bytes!;
    } else if (file.path != null && !kIsWeb) {
      bytes = await File(file.path!).readAsBytes();
    } else {
      throw Exception('No se pudo leer la imagen');
    }

    if (bytes.length > maxFileBytes) {
      final mb = (maxFileBytes / (1024 * 1024)).round();
      throw Exception('La imagen no puede exceder $mb MB');
    }

    final ext = (file.extension ?? 'jpg').toLowerCase();
    final mime = ext == 'png'
        ? 'image/png'
        : ext == 'webp'
            ? 'image/webp'
            : 'image/jpeg';
    return 'data:$mime;base64,${base64Encode(bytes)}';
  }

  static String? resolveDisplayUrl(String raw, {bool isWeb = kIsWeb}) {
    final s = raw.trim();
    if (s.isEmpty) return null;
    if (s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/')) {
      final api = ApiConfig.baseUrl(isWeb: isWeb);
      final origin = api.replaceFirst(RegExp(r'/api/?$'), '');
      return '$origin$s';
    }
    return s;
  }

  static bool looksLikeImageUri(String? raw) {
    final s = (raw ?? '').trim();
    if (s.isEmpty) return false;
    return s.startsWith('data:image/') ||
        s.startsWith('http://') ||
        s.startsWith('https://') ||
        s.startsWith('/uploads/');
  }

  static Uint8List? decodeDataUrl(String raw) {
    final s = raw.trim();
    if (!s.startsWith('data:image/')) return null;
    final idx = s.indexOf('base64,');
    if (idx < 0) return null;
    try {
      return base64Decode(s.substring(idx + 'base64,'.length));
    } catch (_) {
      return null;
    }
  }
}

class EventoDraftImage extends StatelessWidget {
  const EventoDraftImage({
    super.key,
    required this.uri,
    this.fit = BoxFit.cover,
    this.placeholder,
  });

  final String? uri;
  final BoxFit fit;
  final Widget? placeholder;

  @override
  Widget build(BuildContext context) {
    final u = (uri ?? '').trim();
    if (u.isEmpty) {
      return placeholder ??
          const Center(
            child: Text('No hay imagen', style: TextStyle(color: Colors.white54, fontSize: 14)),
          );
    }

    final bytes = EventoImagePicker.decodeDataUrl(u);
    if (bytes != null) {
      return Image.memory(bytes, fit: fit, width: double.infinity, height: double.infinity);
    }
    final networkUrl = EventoImagePicker.resolveDisplayUrl(u);
    if (networkUrl != null &&
        (networkUrl.startsWith('http://') || networkUrl.startsWith('https://'))) {
      return Image.network(
        networkUrl,
        fit: fit,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (_, _, _) =>
            placeholder ??
            const Center(child: Text('No hay imagen', style: TextStyle(color: Colors.white54, fontSize: 14))),
      );
    }
    return placeholder ??
        const Center(child: Text('No hay imagen', style: TextStyle(color: Colors.white54, fontSize: 14)));
  }
}

class EventoImageUploader extends StatelessWidget {
  const EventoImageUploader({
    super.key,
    required this.label,
    required this.imageUri,
    required this.onImageSelected,
    this.accentColor = const Color(0xFF00D9FF),
  });

  final String label;
  final String? imageUri;
  final ValueChanged<String?> onImageSelected;
  final Color accentColor;

  Future<void> _pick(BuildContext context) async {
    try {
      final dataUrl = await EventoImagePicker.pickDataUrl();
      if (dataUrl != null) onImageSelected(dataUrl);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasImage = (imageUri ?? '').trim().isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 8),
        AspectRatio(
          aspectRatio: 1,
          child: Material(
            color: const Color.fromRGBO(255, 255, 255, 0.08),
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: () => _pick(context),
              borderRadius: BorderRadius.circular(16),
              child: Ink(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: accentColor.withValues(alpha: 0.55),
                    width: 2,
                  ),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (hasImage)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: EventoDraftImage(uri: imageUri),
                      )
                    else
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('📷', style: TextStyle(fontSize: 36)),
                          const SizedBox(height: 6),
                          Text(
                            'Subir imagen',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withValues(alpha: 0.75),
                            ),
                          ),
                        ],
                      ),
                    if (hasImage)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Material(
                          color: const Color.fromRGBO(239, 68, 68, 0.92),
                          shape: const CircleBorder(),
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: () => onImageSelected(null),
                            child: const SizedBox(
                              width: 32,
                              height: 32,
                              child: Center(
                                child: Text('✕', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
