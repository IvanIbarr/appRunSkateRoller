import 'recap_share_stub.dart' if (dart.library.html) 'recap_share_web.dart' as impl;

import '../models/recap_share_outcome.dart';
import '../models/recap_video_result.dart';

export '../models/recap_share_outcome.dart';

Future<RecapShareOutcome> shareRecapVideo(RecapVideoResult result) =>
    impl.shareRecapVideo(result);

Future<void> downloadRecapVideo(RecapVideoResult result) => impl.downloadRecapVideo(result);

void revokeRecapPreviewUrl(String? url) => impl.revokeRecapPreviewUrl(url);
