import 'package:latlong2/latlong.dart';

import 'recap_video_generator.dart';

Future<void> generateAndDownloadRecapWebm({
  required List<LatLng> route,
  required RecapVideoStats stats,
  String title = 'RunSkateRoller',
}) async {
  throw Exception('Generación de video solo disponible en Web por ahora.');
}

