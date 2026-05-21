import 'dart:typed_data';

import 'recap_video_generator_stub.dart'
    if (dart.library.html) 'recap_video_generator_web.dart' as impl;

import 'package:latlong2/latlong.dart';

import '../models/recap_video_result.dart';
import 'recap_share.dart' show downloadRecapVideo;

class RecapVideoStats {
  RecapVideoStats({required this.km, required this.durationSec, required this.avgKmh});

  final double km;
  final double durationSec;
  final double avgKmh;
}

/// Bytes de una foto para incrustar en el video.
class RecapPhotoBytes {
  RecapPhotoBytes({required this.bytes, this.label = ''});

  final Uint8List bytes;
  final String label;
}

Future<RecapVideoResult> generateRecapVideo({
  required List<LatLng> route,
  required RecapVideoStats stats,
  List<RecapPhotoBytes> photos = const [],
  String title = 'RunSkateRoller',
}) {
  return impl.generateRecapVideo(route: route, stats: stats, photos: photos, title: title);
}

@Deprecated('Usa generateRecapVideo + downloadRecapVideo')
Future<void> generateAndDownloadRecapWebm({
  required List<LatLng> route,
  required RecapVideoStats stats,
  String title = 'RunSkateRoller',
}) async {
  final result = await generateRecapVideo(route: route, stats: stats, title: title);
  await downloadRecapVideo(result);
}
