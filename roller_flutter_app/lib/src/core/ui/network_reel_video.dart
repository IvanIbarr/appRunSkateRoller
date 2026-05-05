import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

/// Reproductor tipo “reel” (altura fija, cover) para URLs de video accesibles por red.
class NetworkReelVideo extends StatefulWidget {
  const NetworkReelVideo({
    super.key,
    required this.url,
    this.height = 240,
  });

  final String url;
  final double height;

  @override
  State<NetworkReelVideo> createState() => _NetworkReelVideoState();
}

class _NetworkReelVideoState extends State<NetworkReelVideo> {
  VideoPlayerController? _controller;
  bool _failed = false;

  void _onVideoTick() {
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    setState(() {
      _failed = false;
      _controller?.removeListener(_onVideoTick);
      _controller?.dispose();
      _controller = null;
    });
    try {
      final uri = Uri.parse(widget.url);
      final c = VideoPlayerController.networkUrl(uri);
      await c.initialize();
      if (!mounted) {
        await c.dispose();
        return;
      }
      await c.setLooping(true);
      c.addListener(_onVideoTick);
      setState(() => _controller = c);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  void didUpdateWidget(covariant NetworkReelVideo oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) {
      _init();
    }
  }

  @override
  void dispose() {
    _controller?.removeListener(_onVideoTick);
    _controller?.dispose();
    super.dispose();
  }

  void _togglePlay() {
    final c = _controller;
    if (c == null || !c.value.isInitialized) return;
    if (c.value.isPlaying) {
      c.pause();
    } else {
      c.play();
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    if (_failed) {
      return SizedBox(
        height: widget.height,
        child: const Center(child: Icon(Icons.videocam_off, color: Colors.white54, size: 48)),
      );
    }
    final c = _controller;
    if (c == null || !c.value.isInitialized) {
      return SizedBox(
        height: widget.height,
        child: const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8), strokeWidth: 2)),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        height: widget.height,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: [
            FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: c.value.size.width,
                height: c.value.size.height,
                child: VideoPlayer(c),
              ),
            ),
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: _togglePlay,
                child: Center(
                  child: AnimatedOpacity(
                    opacity: c.value.isPlaying ? 0.0 : 1.0,
                    duration: const Duration(milliseconds: 200),
                    child: const Icon(Icons.play_circle_fill, color: Color(0xFF38BDF8), size: 64),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Vista previa local (móvil/desktop nativo) tras elegir archivo; en web no hay path fiable.
class LocalFileReelVideo extends StatefulWidget {
  const LocalFileReelVideo({super.key, required this.path, this.height = 220});

  final String path;
  final double height;

  @override
  State<LocalFileReelVideo> createState() => _LocalFileReelVideoState();
}

class _LocalFileReelVideoState extends State<LocalFileReelVideo> {
  VideoPlayerController? _controller;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      _init();
    }
  }

  Future<void> _init() async {
    try {
      final c = VideoPlayerController.file(File(widget.path));
      await c.initialize();
      if (!mounted) {
        await c.dispose();
        return;
      }
      await c.setLooping(true);
      setState(() => _controller = c);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return SizedBox(height: widget.height, child: const Center(child: Text('Vista previa: usa publicar o prueba en móvil', style: TextStyle(color: Colors.white54, fontSize: 12))));
    }
    if (_failed || _controller == null || !_controller!.value.isInitialized) {
      return SizedBox(
        height: widget.height,
        child: Center(child: _failed ? const Icon(Icons.error_outline, color: Colors.white54) : const CircularProgressIndicator(strokeWidth: 2)),
      );
    }
    final c = _controller!;
    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: FittedBox(
        fit: BoxFit.cover,
        child: SizedBox(
          width: c.value.size.width,
          height: c.value.size.height,
          child: VideoPlayer(c),
        ),
      ),
    );
  }
}
