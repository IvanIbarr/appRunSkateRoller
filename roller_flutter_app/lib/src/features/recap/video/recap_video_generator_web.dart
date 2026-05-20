// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:math' as math;

import 'package:latlong2/latlong.dart';

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
  const pad = 0.12; // 12% padding
  final nx = (p.longitude - b.minLng) / (b.maxLng - b.minLng);
  final ny = 1.0 - (p.latitude - b.minLat) / (b.maxLat - b.minLat);
  final x = (pad + nx * (1 - 2 * pad)) * w;
  final y = (pad + ny * (1 - 2 * pad)) * h;
  return math.Point(x, y);
}

void _drawGlowPath(
  html.CanvasRenderingContext2D ctx,
  List<math.Point<double>> pts,
  int count,
) {
  if (pts.length < 2 || count < 2) return;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Glow underlay
  ctx.beginPath();
  ctx.moveTo(pts.first.x, pts.first.y);
  for (var i = 1; i < count; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.80)';
  ctx.lineWidth = 14;
  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(255, 62, 165, 0.85)';
  ctx.stroke();

  // Core line
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(pts.first.x, pts.first.y);
  for (var i = 1; i < count; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = 'rgba(255, 62, 165, 0.95)';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.restore();
}

void _drawHud(html.CanvasRenderingContext2D ctx, int w, int h, String title, RecapVideoStats stats, double tSec) {
  ctx.save();

  // top title
  ctx.fillStyle = 'rgba(248, 250, 252, 0.96)';
  ctx.font = '800 44px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText(title, 54, 78);

  // timer
  final mm = (tSec ~/ 60).toString().padLeft(2, '0');
  final ss = ((tSec % 60).floor()).toString().padLeft(2, '0');
  ctx.fillStyle = 'rgba(226, 232, 240, 0.92)';
  ctx.font = '700 30px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('$mm:$ss', w - 140, 78);

  // stats card
  final cardW = w - 108;
  const cardH = 220;
  final cardX = 54;
  final cardY = h - cardH - 70;

  ctx.fillStyle = 'rgba(2, 6, 23, 0.62)';
  _roundRect(ctx, cardX.toDouble(), cardY.toDouble(), cardW.toDouble(), cardH.toDouble(), 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(56,189,248,0.95)';
  ctx.font = '800 24px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('Métricas', cardX + 26, cardY + 46);

  ctx.fillStyle = 'rgba(248,250,252,0.96)';
  ctx.font = '900 44px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('${stats.km.toStringAsFixed(2)} km', cardX + 26, cardY + 102);

  ctx.fillStyle = 'rgba(226,232,240,0.90)';
  ctx.font = '800 28px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('Prom: ${stats.avgKmh.toStringAsFixed(1)} km/h', cardX + 26, cardY + 148);
  ctx.fillText('Tiempo: ${_fmtDuration(stats.durationSec)}', cardX + 26, cardY + 186);

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

Future<void> generateAndDownloadRecapWebm({
  required List<LatLng> route,
  required RecapVideoStats stats,
  String title = 'RunSkateRoller',
}) async {
  if (route.length < 2) throw Exception('Ruta insuficiente para generar recap');

  // Canvas vertical (reel)
  const w = 720;
  const h = 1280;
  final canvas = html.CanvasElement(width: w, height: h);
  final ctx = canvas.context2D;

  final b = _bounds(route);
  final projected = route.map((p) => _project(p, w, h, b)).toList(growable: false);

  // Capture stream + recorder (API tipada: no usar window.MediaRecorder vía dynamic).
  final stream = canvas.captureStream(30);
  final mime = _pickMimeType();
  final html.MediaRecorder recorder =
      mime != null ? html.MediaRecorder(stream, {'mimeType': mime}) : html.MediaRecorder(stream);
  final chunks = <html.Blob>[];

  final done = Completer<void>();
  recorder.addEventListener('dataavailable', (html.Event e) {
    if (e is! html.BlobEvent) return;
    final data = e.data;
    if (data != null && data.size > 0) {
      chunks.add(data);
    }
  });
  recorder.addEventListener('stop', (html.Event _) {
    if (!done.isCompleted) done.complete();
  });

  recorder.start(250);

  // Render loop: 15s, line draws progressively.
  const totalSec = 15.0;
  const fps = 30;
  final totalFrames = (totalSec * fps).round();

  for (var f = 0; f < totalFrames; f++) {
    final t = f / (totalFrames - 1);
    final tSec = t * totalSec;
    final count = math.max(2, (projected.length * t).round());

    _drawBackground(ctx, w, h);
    _drawGlowPath(ctx, projected, count);
    _drawHud(ctx, w, h, title, stats, tSec);

    // give the browser a breath (also ensures frames are flushed)
    await Future<void>.delayed(const Duration(milliseconds: 8));
  }

  recorder.stop();
  await done.future;

  final outMime = mime ?? 'video/webm';
  final blob = html.Blob(chunks, outMime);
  final url = html.Url.createObjectUrlFromBlob(blob);
  try {
    final a = html.AnchorElement(href: url)
      ..download = 'roller-recap.webm'
      ..style.display = 'none';
    html.document.body?.append(a);
    a.click();
    a.remove();
  } finally {
    html.Url.revokeObjectUrl(url);
  }
}

void _drawBackground(html.CanvasRenderingContext2D ctx, int w, int h) {
  ctx.save();
  // Base dark gradient
  final g = ctx.createLinearGradient(0, 0, 0, h.toDouble());
  g.addColorStop(0, '#020617');
  g.addColorStop(0.55, '#0b1022');
  g.addColorStop(1, '#020617');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid dots
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

String? _pickMimeType() {
  final candidates = <String>[
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (final c in candidates) {
    try {
      if (html.MediaRecorder.isTypeSupported(c)) return c;
    } catch (_) {
      // Navegador sin MediaRecorder / API incompleta.
    }
  }
  return null;
}

