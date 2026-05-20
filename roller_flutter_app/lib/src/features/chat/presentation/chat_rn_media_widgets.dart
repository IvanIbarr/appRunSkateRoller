import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';

/// Imagen de adjunto en burbuja de chat (URL remota, no File local en web).
class ChatRnMessageNetworkImage extends StatelessWidget {
  const ChatRnMessageNetworkImage({
    super.key,
    required this.messageId,
    required this.url,
    required this.width,
    required this.height,
    this.mimeType,
  });

  final String messageId;
  final String url;
  final double width;
  final double height;
  final String? mimeType;

  @override
  Widget build(BuildContext context) {
    debugPrint(
      'MEDIA messageId=$messageId type=image url=$url mime=${mimeType ?? 'image'}',
    );
    return Image.network(
      url,
      width: width,
      height: height,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return SizedBox(
          width: width,
          height: height,
          child: Center(
            child: CircularProgressIndicator(
              value: progress.expectedTotalBytes != null
                  ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                  : null,
              strokeWidth: 2,
              color: const Color(0xFF38BDF8),
            ),
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) {
        debugPrint('MEDIA IMAGE ERROR messageId=$messageId url=$url error=$error');
        return SizedBox(
          width: width,
          height: height,
          child: ColoredBox(
            color: const Color(0xFF1E293B),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.broken_image_outlined, color: Color(0xFF94A3B8), size: 32),
                const SizedBox(height: 6),
                Text(
                  'No se pudo cargar la imagen',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Video inline con play/pause (mp4/h264 vía red).
class ChatRnMessageNetworkVideo extends StatefulWidget {
  const ChatRnMessageNetworkVideo({
    super.key,
    required this.messageId,
    required this.url,
    required this.width,
    required this.height,
    this.mimeType,
  });

  final String messageId;
  final String url;
  final double width;
  final double height;
  final String? mimeType;

  @override
  State<ChatRnMessageNetworkVideo> createState() => _ChatRnMessageNetworkVideoState();
}

class _ChatRnMessageNetworkVideoState extends State<ChatRnMessageNetworkVideo> {
  VideoPlayerController? _controller;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    debugPrint(
      'MEDIA messageId=${widget.messageId} type=video url=${widget.url} mime=${widget.mimeType ?? 'video'}',
    );
    _init();
  }

  @override
  void didUpdateWidget(covariant ChatRnMessageNetworkVideo oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) _init();
  }

  Future<void> _init() async {
    setState(() => _failed = false);
    await _controller?.dispose();
    _controller = null;
    try {
      final uri = Uri.parse(widget.url);
      final c = VideoPlayerController.networkUrl(uri);
      await c.initialize();
      if (!mounted) {
        await c.dispose();
        return;
      }
      c.setLooping(false);
      setState(() => _controller = c);
    } catch (e, st) {
      debugPrint('MEDIA VIDEO ERROR messageId=${widget.messageId} url=${widget.url} error=$e');
      debugPrint('$st');
      if (mounted) setState(() => _failed = true);
    }
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
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_failed) {
      return SizedBox(
        width: widget.width,
        height: widget.height,
        child: ColoredBox(
          color: const Color(0xFF0F172A),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.videocam_off_outlined, color: Color(0xFF94A3B8), size: 36),
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  'Video no disponible',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final c = _controller;
    if (c == null || !c.value.isInitialized) {
      return SizedBox(
        width: widget.width,
        height: widget.height,
        child: const ColoredBox(
          color: Color(0xFF0F172A),
          child: Center(
            child: CircularProgressIndicator(color: Color(0xFF38BDF8), strokeWidth: 2),
          ),
        ),
      );
    }

    final err = c.value.errorDescription;
    if (err != null && err.isNotEmpty) {
      debugPrint('MEDIA VIDEO ERROR: $err');
    }

    return SizedBox(
      width: widget.width,
      height: widget.height,
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
            color: Colors.black26,
            child: InkWell(
              onTap: _togglePlay,
              child: Center(
                child: Icon(
                  c.value.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
                  size: 52,
                  color: Colors.white.withValues(alpha: 0.92),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
