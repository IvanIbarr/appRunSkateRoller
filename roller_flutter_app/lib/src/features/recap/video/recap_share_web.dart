// ignore_for_file: avoid_web_libraries_in_flutter

import 'dart:html' as html;

import '../models/recap_share_outcome.dart';
import '../models/recap_video_result.dart';
import 'recap_video_generator_web.dart' as gen;

Future<RecapShareOutcome> shareRecapVideo(RecapVideoResult result) async {
  final blob = html.Blob([result.bytes], result.mimeType);
  final file = html.File([blob], result.fileName, {'type': result.mimeType});

  try {
    // Web Share API (Safari iOS 15+, Chrome Android).
    final nav = html.window.navigator;
    // ignore: avoid_dynamic_calls
    final dynamic dynNav = nav;
    final shareFn = dynNav.share;
    if (shareFn != null) {
      final payload = <String, Object>{
        'title': 'RunSkateRoller Recap',
        'text': 'Mi recap RunSkateRoller 🛼',
        'files': [file],
      };
      final canShare = dynNav.canShare;
      if (canShare != null) {
        final ok = canShare(payload) as bool? ?? false;
        if (!ok) {
          return RecapShareOutcome(
            shared: false,
            message: 'Tu navegador no permite compartir este video. Descárgalo y súbelo manualmente.',
          );
        }
      }
      await shareFn(payload);
      return RecapShareOutcome(shared: true);
    }
  } catch (e) {
    return RecapShareOutcome(
      shared: false,
      message: 'Compartir no disponible: $e. Descarga el video y súbelo manualmente.',
    );
  }

  return RecapShareOutcome(
    shared: false,
    message: 'Tu navegador no permite compartir archivos. Descarga el video y súbelo manualmente a tus redes.',
  );
}

Future<void> downloadRecapVideo(RecapVideoResult result) => gen.downloadRecapVideo(result);

void revokeRecapPreviewUrl(String? url) => gen.revokeRecapPreviewUrl(url);
