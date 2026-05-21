// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:latlong2/latlong.dart';

import '../models/recap_video_result.dart';
import 'recap_video_generator.dart';

({double minLat, double maxLat, double minLng, double maxLng}) _bounds(List<LatLng> pts) {
  var minLat = pts.first.latitude;
  var maxLat = pts.first.latitude;
  var minLng = pts.first.longitude;
  var maxLng = pts.first.longitude;
  for (final p in pts) {
    minLat = math.min(minLat, p.latitude);
    maxLat = math.max(maxLat, p.latitude);
    minLng = math.min(minLng, p.longitude);
    maxLng = math.max(maxLng, p.longitude);
  }
  if ((maxLat - minLat).abs() < 1e-6) {
    maxLat += 0.0005;
    minLat -= 0.0005;
  }
  if ((maxLng - minLng).abs() < 1e-6) {
    maxLng += 0.0005;
    minLng -= 0.0005;
  }
  return (minLat: minLat, maxLat: maxLat, minLng: minLng, maxLng: maxLng);
}

math.Point<double> _project(LatLng p, int w, int h, ({double minLat, double maxLat, double minLng, double maxLng}) b) {
  const pad = 0.12;
  final nx = (p.longitude - b.minLng) / (b.maxLng - b.minLng);
  final ny = 1.0 - (p.latitude - b.minLat) / (b.maxLat - b.minLat);
  final x = (pad + nx * (1 - 2 * pad)) * w;
  final y = (pad + ny * (1 - 2 * pad)) * h;
  return math.Point(x, y);
}

bool _isMobileWeb() {
  final ua = html.window.navigator.userAgent.toLowerCase();
  return ua.contains('iphone') ||
      ua.contains('ipad') ||
      ua.contains('ipod') ||
      ua.contains('android') ||
      ua.contains('mobile');
}

bool _isSafari() {
  final ua = html.window.navigator.userAgent.toLowerCase();
  return ua.contains('safari') && !ua.contains('chrome') && !ua.contains('crios');
}

String? _pickMimeType({required bool preferMp4}) {
  final candidates = <String>[];
  if (preferMp4) {
    candidates.addAll([
      'video/mp4;codecs=avc1',
      'video/mp4;codecs="avc1.42E01E, mp4a.40.2"',
      'video/mp4',
    ]);
  }
  candidates.addAll([
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]);
  if (!preferMp4) {
    // Desktop: priorizar WebM si está soportado (mejor calidad en Chrome).
    final webmFirst = <String>[
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      ...candidates.where((c) => c.contains('mp4')),
    ];
    for (final c in webmFirst) {
      try {
        if (html.MediaRecorder.isTypeSupported(c)) return c;
      } catch (_) {}
    }
    return null;
  }
  for (final c in candidates) {
    try {
      if (html.MediaRecorder.isTypeSupported(c)) return c;
    } catch (_) {}
  }
  return null;
}

String _extensionForMime(String mime) => mime.contains('mp4') ? 'mp4' : 'webm';

bool _playableInBrowser(String mime) {
  if (mime.contains('mp4')) return true;
  if (_isSafari() && mime.contains('webm')) return false;
  return true;
}

String _formatLabel(String mime) {
  if (mime.contains('mp4')) return 'MP4 (H.264)';
  return 'WebM';
}

void _roundRect(html.CanvasRenderingContext2D ctx, double x, double y, double w, double h, double r) {
  final rr = math.min(r, math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

void _drawBackground(html.CanvasRenderingContext2D ctx, int w, int h) {
  ctx.save();
  final g = ctx.createLinearGradient(0, 0, 0, h.toDouble());
  g.addColorStop(0, '#020617');
  g.addColorStop(0.55, '#0b1022');
  g.addColorStop(1, '#020617');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
  for (var y = 120; y < h; y += 56) {
    for (var x = 40; x < w; x += 56) {
      ctx.beginPath();
      ctx.arc(x.toDouble(), y.toDouble(), 1.2, 0, math.pi * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

void _drawGlowPath(html.CanvasRenderingContext2D ctx, List<math.Point<double>> pts, int count) {
  if (pts.length < 2 || count < 2) return;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts.first.x, pts.first.y);
  for (var i = 1; i < count; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.80)';
  ctx.lineWidth = 14;
  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(0, 255, 127, 0.75)';
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(pts.first.x, pts.first.y);
  for (var i = 1; i < count; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = 'rgba(0, 255, 127, 0.95)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();
}

String _fmtDuration(double sec) {
  final s = sec.round();
  final m = (s / 60).round();
  if (m < 60) return '$m min';
  final h = m ~/ 60;
  final r = m % 60;
  return '${h}h ${r}m';
}

void _drawHud(html.CanvasRenderingContext2D ctx, int w, int h, String title, RecapVideoStats stats, double tSec) {
  ctx.save();
  ctx.fillStyle = 'rgba(248, 250, 252, 0.96)';
  ctx.font = '800 40px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText(title, 48, 72);
  final mm = (tSec ~/ 60).toString().padLeft(2, '0');
  final ss = ((tSec % 60).floor()).toString().padLeft(2, '0');
  ctx.fillStyle = 'rgba(226, 232, 240, 0.92)';
  ctx.font = '700 28px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('$mm:$ss', w - 130, 72);

  const cardH = 200.0;
  final cardW = w - 96.0;
  const cardX = 48.0;
  final cardY = h - cardH - 58;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  _roundRect(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 255, 127, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(56,189,248,0.95)';
  ctx.font = '800 22px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('ROLLER RECAP', cardX + 22, cardY + 38);

  ctx.fillStyle = 'rgba(248,250,252,0.96)';
  ctx.font = '900 40px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('${stats.km.toStringAsFixed(2)} km', cardX + 22, cardY + 88);
  ctx.fillStyle = 'rgba(226,232,240,0.90)';
  ctx.font = '800 26px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('Prom: ${stats.avgKmh.toStringAsFixed(1)} km/h', cardX + 22, cardY + 132);
  ctx.fillText('Tiempo: ${_fmtDuration(stats.durationSec)}', cardX + 22, cardY + 168);
  ctx.restore();
}

double _clamp(double v, double a, double b) => math.max(a, math.min(b, v));

void _drawPhotoCards(
  html.CanvasRenderingContext2D ctx,
  int w,
  int h,
  List<html.ImageElement> imgs,
  double prog,
) {
  if (imgs.isEmpty) return;
  final slots = <({double x, double y})>[
    (x: w * 0.03, y: h * 0.18),
    (x: w * 0.72, y: h * 0.18),
    (x: w * 0.03, y: h * 0.70),
    (x: w * 0.72, y: h * 0.70),
    (x: w * 0.375, y: h * 0.44),
  ];
  final cardW = w * 0.24;
  final cardH = h * 0.16;
  final count = math.min(imgs.length, slots.length);

  for (var i = 0; i < count; i++) {
    final img = imgs[i];
    final slot = slots[i];
    final appearStart = 0.06 + i * 0.11;
    final appearEnd = appearStart + 0.2;
    final t = _clamp((prog - appearStart) / (appearEnd - appearStart), 0, 1);
    final eased = t * t * (3 - 2 * t);
    final alpha = 0.2 + 0.8 * eased;
    final slideY = (1 - eased) * 14;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, slideY);
    ctx.fillStyle = 'rgba(15,23,42,0.78)';
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    _roundRect(ctx, slot.x, slot.y, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    const pad = 7.0;
    final iw = cardW - pad * 2;
    final ih = cardH - pad * 2 - 18;
    ctx.save();
    _roundRect(ctx, slot.x + pad, slot.y + pad, iw, ih, 8);
    ctx.clip();
    if (img.complete == true && img.naturalWidth > 0) {
      try {
        ctx.save();
        ctx.translate(slot.x + pad, slot.y + pad);
        final scaleX = iw / img.naturalWidth;
        final scaleY = ih / img.naturalHeight;
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      } catch (_) {
        ctx.fillStyle = 'rgba(30,41,59,0.92)';
        ctx.fillRect(slot.x + pad, slot.y + pad, iw, ih);
      }
    } else {
      ctx.fillStyle = 'rgba(30,41,59,0.92)';
      ctx.fillRect(slot.x + pad, slot.y + pad, iw, ih);
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(226,232,240,0.92)';
    ctx.font = '800 13px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText('📸 ${(2 + i * 3).toString().padLeft(2, '0')}:00', slot.x + pad, slot.y + cardH - 8);
    ctx.restore();
  }
}

Future<List<html.ImageElement>> _loadImages(List<RecapPhotoBytes> photos) async {
  final out = <html.ImageElement>[];
  for (final p in photos.take(5)) {
    final blob = html.Blob([p.bytes]);
    final url = html.Url.createObjectUrlFromBlob(blob);
    final img = html.ImageElement();
    final done = Completer<void>();
    img.onLoad.listen((_) {
      if (!done.isCompleted) done.complete();
    });
    img.onError.listen((_) {
      if (!done.isCompleted) done.complete();
    });
    img.src = url;
    await done.future.timeout(const Duration(seconds: 8), onTimeout: () {});
    out.add(img);
    html.Url.revokeObjectUrl(url);
  }
  return out;
}

Future<Uint8List> _blobToBytes(html.Blob blob) async {
  if (blob.size <= 0) {
    throw Exception('El video quedó vacío (0 bytes). Prueba con menos fotos o recarga la página.');
  }

  // Safari/iOS: fetch(blobUrl) suele ser más fiable que FileReader.
  final objectUrl = html.Url.createObjectUrlFromBlob(blob);
  try {
    final response = await html.window.fetch(objectUrl).timeout(const Duration(seconds: 30));
    if (!response.ok) {
      throw Exception('No se pudo leer el video generado (HTTP ${response.status}).');
    }
    final buffer = await response.arrayBuffer().timeout(const Duration(seconds: 30));
    if (buffer is ByteBuffer && buffer.lengthInBytes > 0) {
      return Uint8List.view(buffer);
    }
  } catch (_) {
    // Fallback FileReader (Chrome/desktop).
  } finally {
    html.Url.revokeObjectUrl(objectUrl);
  }

  final reader = html.FileReader();
  final done = Completer<Uint8List>();
  reader.onLoadEnd.listen((_) {
    if (done.isCompleted) return;
    final result = reader.result;
    if (result is ByteBuffer && result.lengthInBytes > 0) {
      done.complete(Uint8List.view(result));
      return;
    }
    if (result is Uint8List && result.isNotEmpty) {
      done.complete(result);
      return;
    }
    done.completeError('No se pudieron leer los bytes del video en este navegador.');
  });
  reader.onError.listen((_) {
    if (!done.isCompleted) {
      done.completeError('Error leyendo el archivo de video.');
    }
  });
  reader.readAsArrayBuffer(blob);
  return done.future.timeout(const Duration(seconds: 30));
}

Future<void> _finalizeRecorder(html.MediaRecorder recorder) async {
  final done = Completer<void>();
  void onStop(html.Event _) {
    if (!done.isCompleted) done.complete();
  }

  recorder.addEventListener('stop', onStop);
  try {
    // Safari: forzar último chunk antes de stop.
    // ignore: avoid_dynamic_calls
    final dyn = recorder as dynamic;
    if (dyn.requestData != null) dyn.requestData();
  } catch (_) {}

  await Future<void>.delayed(const Duration(milliseconds: 120));
  if (recorder.state == 'recording') {
    recorder.stop();
  }
  await done.future.timeout(
    const Duration(seconds: 8),
    onTimeout: () {
      if (!done.isCompleted) done.complete();
    },
  );
  recorder.removeEventListener('stop', onStop);
}

Future<RecapVideoResult> generateRecapVideo({
  required List<LatLng> route,
  required RecapVideoStats stats,
  List<RecapPhotoBytes> photos = const [],
  String title = 'RunSkateRoller',
}) async {
  if (route.length < 2) throw Exception('Ruta insuficiente para generar recap');

  const w = 720;
  const h = 1280;
  final canvas = html.CanvasElement(width: w, height: h);
  final ctx = canvas.context2D;
  final b = _bounds(route);
  final projected = route.map((p) => _project(p, w, h, b)).toList(growable: false);
  final photoImgs = await _loadImages(photos);

  final preferMp4 = _isMobileWeb() || _isSafari();
  final mime = _pickMimeType(preferMp4: preferMp4);
  if (mime == null) {
    throw Exception('Este navegador no soporta grabación de video (MediaRecorder). Prueba Chrome o Safari actualizado.');
  }

  final stream = _isMobileWeb() ? canvas.captureStream() : canvas.captureStream(30);
  final recorder = html.MediaRecorder(stream, {'mimeType': mime});
  final chunks = <html.Blob>[];
  recorder.addEventListener('dataavailable', (html.Event e) {
    if (e is html.BlobEvent && e.data != null && e.data!.size > 0) {
      chunks.add(e.data!);
    }
  });

  // Timeslice ayuda a Safari a emitir chunks; en desktop también es estable.
  recorder.start(500);

  const totalSec = 15.0;
  const fps = 30;
  final totalFrames = (totalSec * fps).round();
  final frameDelay = Duration(milliseconds: (1000 / fps).round());

  for (var f = 0; f < totalFrames; f++) {
    final t = f / math.max(1, totalFrames - 1);
    final tSec = t * totalSec;
    final count = math.max(2, (projected.length * t).round());
    _drawBackground(ctx, w, h);
    _drawGlowPath(ctx, projected, count);
    _drawPhotoCards(ctx, w, h, photoImgs, t);
    _drawHud(ctx, w, h, title, stats, tSec);
    await Future<void>.delayed(frameDelay);
  }

  await _finalizeRecorder(recorder);

  if (chunks.isEmpty) {
    throw Exception(
      'La grabación no generó datos en este navegador. Prueba Safari actualizado o Chrome en el móvil.',
    );
  }

  final recordedMime = recorder.mimeType;
  final outMime = (recordedMime != null && recordedMime.isNotEmpty) ? recordedMime : mime;
  final blob = html.Blob(chunks, outMime);
  if (blob.size <= 0) {
    throw Exception('El archivo de video quedó vacío. Reduce fotos o vuelve a intentar.');
  }

  // Preview primero con blob URL (Safari reproduce sin leer bytes).
  final previewUrl = html.Url.createObjectUrlFromBlob(blob);
  Uint8List bytes;
  try {
    bytes = await _blobToBytes(blob);
  } catch (e) {
    html.Url.revokeObjectUrl(previewUrl);
    rethrow;
  }
  final ext = _extensionForMime(outMime);
  final fileName = 'roller-recap-15s.$ext';

  return RecapVideoResult(
    bytes: bytes,
    mimeType: outMime,
    extension: ext,
    fileName: fileName,
    previewUrl: previewUrl,
    playableInBrowser: _playableInBrowser(outMime),
    formatLabel: _formatLabel(outMime),
  );
}

Future<void> downloadRecapVideo(RecapVideoResult result) async {
  final blob = html.Blob([result.bytes], result.mimeType);
  final url = html.Url.createObjectUrlFromBlob(blob);
  try {
    final a = html.AnchorElement(href: url)
      ..download = result.fileName
      ..style.display = 'none';
    html.document.body?.append(a);
    a.click();
    a.remove();
  } finally {
    html.Url.revokeObjectUrl(url);
  }
}

void revokeRecapPreviewUrl(String? url) {
  if (url == null || !url.startsWith('blob:')) return;
  try {
    html.Url.revokeObjectUrl(url);
  } catch (_) {}
}
