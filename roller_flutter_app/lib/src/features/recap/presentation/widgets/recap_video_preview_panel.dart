import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:video_player/video_player.dart';

import '../../models/recap_video_result.dart';

class RecapVideoPreviewPanel extends StatefulWidget {
  const RecapVideoPreviewPanel({
    super.key,
    required this.result,
    required this.onDownload,
    required this.onShare,
    required this.onRegenerate,
    this.shareMessage,
  });

  final RecapVideoResult result;
  final VoidCallback onDownload;
  final Future<void> Function() onShare;
  final VoidCallback onRegenerate;
  final String? shareMessage;

  @override
  State<RecapVideoPreviewPanel> createState() => _RecapVideoPreviewPanelState();
}

class _RecapVideoPreviewPanelState extends State<RecapVideoPreviewPanel> {
  VideoPlayerController? _controller;
  var _initialized = false;
  var _playError = false;

  @override
  void initState() {
    super.initState();
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    final url = widget.result.previewUrl;
    if (url == null || url.isEmpty) {
      setState(() => _playError = true);
      return;
    }
    final c = VideoPlayerController.networkUrl(Uri.parse(url));
    _controller = c;
    try {
      await c.initialize();
      if (!mounted) return;
      setState(() {
        _initialized = true;
        _playError = false;
      });
    } catch (_) {
      if (mounted) setState(() => _playError = true);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.result;
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: const Color(0xE60D1117),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.35)),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.playCircle, color: Color(0xFF38BDF8), size: 20),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Vista previa',
                        style: TextStyle(
                          color: Color(0xFFF8FAFC),
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    Text(
                      r.formatLabel,
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${r.fileName} · ${r.sizeLabel}',
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                ),
                const SizedBox(height: 10),
                AspectRatio(
                  aspectRatio: 9 / 16,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: ColoredBox(
                      color: const Color(0xFF020617),
                      child: _buildPlayer(),
                    ),
                  ),
                ),
                if (!r.playableInBrowser || _playError) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0x33F59E0B),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0x66F59E0B)),
                    ),
                    child: const Text(
                      'Tu navegador podría no reproducir este formato en el reproductor. '
                      'Descarga el archivo o genera versión MP4 (recomendado en iPhone).',
                      style: TextStyle(color: Color(0xFFFDE68A), fontSize: 12, height: 1.35),
                    ),
                  ),
                ],
                if (widget.shareMessage != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    widget.shareMessage!,
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, height: 1.3),
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _initialized && _controller != null
                            ? () {
                                setState(() {
                                  if (_controller!.value.isPlaying) {
                                    _controller!.pause();
                                  } else {
                                    _controller!.play();
                                  }
                                });
                              }
                            : null,
                        icon: Icon(
                          _controller?.value.isPlaying == true ? LucideIcons.pause : LucideIcons.play,
                          size: 18,
                        ),
                        label: const Text('Reproducir'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(42),
                          foregroundColor: const Color(0xFFE2E8F0),
                          side: const BorderSide(color: Color.fromRGBO(148, 163, 184, 0.4)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: widget.onDownload,
                        icon: const Icon(LucideIcons.download, size: 18),
                        label: const Text('Descargar'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(42),
                          foregroundColor: const Color(0xFF38BDF8),
                          side: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.45)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () async => widget.onShare(),
                        icon: const Icon(LucideIcons.share2, size: 18),
                        label: const Text('Compartir'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(44),
                          backgroundColor: const Color(0xFF0891B2),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: widget.onRegenerate,
                        icon: const Icon(LucideIcons.refreshCw, size: 18),
                        label: const Text('Regenerar'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(44),
                          foregroundColor: const Color(0xFF00FF7F),
                          side: const BorderSide(color: Color.fromRGBO(0, 255, 127, 0.45)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlayer() {
    if (_playError || widget.result.previewUrl == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'No se pudo cargar la vista previa.\nUsa Descargar para ver el video en tu galería.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, height: 1.4),
          ),
        ),
      );
    }
    if (!_initialized || _controller == null) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)));
    }
    return Stack(
      alignment: Alignment.center,
      fit: StackFit.expand,
      children: [
        FittedBox(
          fit: BoxFit.cover,
          child: SizedBox(
            width: _controller!.value.size.width,
            height: _controller!.value.size.height,
            child: VideoPlayer(_controller!),
          ),
        ),
        if (!_controller!.value.isPlaying)
          IconButton(
            iconSize: 56,
            color: Colors.white70,
            onPressed: () => setState(() => _controller!.play()),
            icon: const Icon(Icons.play_circle_fill),
          ),
      ],
    );
  }
}
