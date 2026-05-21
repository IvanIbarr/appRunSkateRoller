import 'package:latlong2/latlong.dart';

import '../models/recap_video_result.dart';
import 'recap_video_generator.dart';

Future<RecapVideoResult> generateRecapVideo({
  required List<LatLng> route,
  required RecapVideoStats stats,
  List<RecapPhotoBytes> photos = const [],
  String title = 'RunSkateRoller',
}) async {
  throw UnsupportedError(
    'La generación de recap en video solo está disponible en la app web por ahora. '
    'Abre RunSkateRoller en el navegador (Chrome/Safari) desde tu móvil.',
  );
}

Future<void> downloadRecapVideo(RecapVideoResult result) async {
  throw UnsupportedError('Descarga de recap solo disponible en web.');
}
