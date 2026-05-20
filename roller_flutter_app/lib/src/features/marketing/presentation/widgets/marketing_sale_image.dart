import 'package:flutter/material.dart';

import '../../../calendario/presentation/widgets/evento_image_uploader.dart';
import '../../../../core/network/api_config.dart';

/// Muestra foto de publicación: data URL, /uploads o http.
class MarketingSaleImage extends StatelessWidget {
  const MarketingSaleImage({
    super.key,
    required this.uri,
    this.fit = BoxFit.cover,
  });

  final String uri;
  final BoxFit fit;

  static String resolveUrl(String raw) {
    final t = raw.trim();
    if (t.isEmpty) return t;
    if (t.startsWith('data:') || t.startsWith('http://') || t.startsWith('https://')) {
      return t;
    }
    return EventoImagePicker.resolveDisplayUrl(t) ?? t;
  }

  @override
  Widget build(BuildContext context) {
    final u = uri.trim();
    if (u.isEmpty) {
      return const ColoredBox(
        color: Color.fromRGBO(15, 23, 42, 0.92),
        child: Center(
          child: Text('Sin foto', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
        ),
      );
    }

    if (u.startsWith('data:image/')) {
      return EventoDraftImage(uri: u, fit: fit);
    }

    final url = resolveUrl(u);
    if (url.startsWith('http')) {
      return Image.network(
        url,
        fit: fit,
        errorBuilder: (_, _, _) => const ColoredBox(
          color: Color.fromRGBO(15, 23, 42, 0.92),
          child: Center(child: Text('Sin foto', style: TextStyle(fontSize: 10, color: Color(0xFF64748B)))),
        ),
      );
    }

    final origin = ApiConfig.uploadsOrigin();
    final path = url.startsWith('/') ? url : '/$url';
    return Image.network(
      '$origin$path',
      fit: fit,
      errorBuilder: (_, _, _) => const ColoredBox(
        color: Color.fromRGBO(15, 23, 42, 0.92),
        child: Center(child: Text('Sin foto', style: TextStyle(fontSize: 10, color: Color(0xFF64748B)))),
      ),
    );
  }
}
