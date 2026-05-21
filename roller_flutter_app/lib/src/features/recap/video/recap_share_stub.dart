import 'package:share_plus/share_plus.dart';

import '../models/recap_share_outcome.dart';
import '../models/recap_video_result.dart';
import 'recap_video_generator_stub.dart' as gen;

Future<RecapShareOutcome> shareRecapVideo(RecapVideoResult result) async {
  try {
    await Share.shareXFiles(
      [
        XFile.fromData(
          result.bytes,
          name: result.fileName,
          mimeType: result.mimeType,
        ),
      ],
      text: 'Mi recap RunSkateRoller 🛼',
    );
    return RecapShareOutcome(shared: true);
  } catch (e) {
    return RecapShareOutcome(
      shared: false,
      message: 'No se pudo compartir: $e',
    );
  }
}

Future<void> downloadRecapVideo(RecapVideoResult result) => gen.downloadRecapVideo(result);

void revokeRecapPreviewUrl(String? url) {}
