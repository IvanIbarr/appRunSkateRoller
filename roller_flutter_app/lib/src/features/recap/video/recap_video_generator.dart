import 'recap_video_generator_stub.dart'
    if (dart.library.html) 'recap_video_generator_web.dart' as impl;

import 'package:latlong2/latlong.dart';

class RecapVideoStats {
  RecapVideoStats({required this.km, required this.durationSec, required this.avgKmh});

  final double km;
  final double durationSec;
  final double avgKmh;
}

Future<void> generateAndDownloadRecapWebm({
  required List<LatLng> route,
  required RecapVideoStats stats,
  String title = 'RunSkateRoller',
}) {
  return impl.generateAndDownloadRecapWebm(route: route, stats: stats, title: title);
}

