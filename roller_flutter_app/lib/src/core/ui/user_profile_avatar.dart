import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../network/api_config.dart';

/// Tamaños estándar de avatar (homologados entre pantallas).
abstract final class AppAvatarSizes {
  /// Cabecera de pestañas: Chat, Calendario, Ruta, Marketing, RollerTips, Historial.
  static const double header = 48;

  /// Pantalla Menú — edición de perfil (más grande a propósito).
  static const double menuProfile = 96;
}

/// Avatar de perfil: `fotoPerfil` (data URL, http o ruta) o emoji `avatar`.
/// Espejo de `AvatarCircle.tsx` en RN.
class UserProfileAvatar extends StatelessWidget {
  const UserProfileAvatar({
    super.key,
    this.user,
    this.fotoPerfil,
    this.avatar,
    this.size = AppAvatarSizes.header,
    this.borderColor,
    this.borderWidth = 2,
    this.backgroundColor = const Color(0xFF0F172A),
    this.placeholderIcon = Icons.person,
    this.placeholderIconColor = const Color(0xFF94A3B8),
  });

  factory UserProfileAvatar.fromUser(
    Map<String, dynamic>? user, {
    double size = AppAvatarSizes.header,
    Color? borderColor,
    double borderWidth = 2,
    Color backgroundColor = const Color(0xFF0F172A),
  }) {
    final foto = (user?['fotoPerfil'] ?? user?['foto_perfil'] ?? '').toString().trim();
    final av = (user?['avatar'] ?? '').toString().trim();
    return UserProfileAvatar(
      fotoPerfil: foto,
      avatar: av,
      size: size,
      borderColor: borderColor,
      borderWidth: borderWidth,
      backgroundColor: backgroundColor,
    );
  }

  /// Avatar de cabecera unificado (mismo tamaño y borde en todas las pestañas).
  factory UserProfileAvatar.header(
    Map<String, dynamic>? user, {
    Color? borderColor,
    Color? backgroundColor,
  }) {
    return UserProfileAvatar.fromUser(
      user,
      size: AppAvatarSizes.header,
      borderColor: borderColor ?? const Color(0xFF38BDF8).withValues(alpha: 0.5),
      borderWidth: 2,
      backgroundColor: backgroundColor ?? const Color.fromRGBO(12, 16, 28, 0.85),
    );
  }

  final Map<String, dynamic>? user;
  final String? fotoPerfil;
  final String? avatar;
  final double size;
  final Color? borderColor;
  final double borderWidth;
  final Color backgroundColor;
  final IconData placeholderIcon;
  final Color placeholderIconColor;

  String get _foto {
    if (fotoPerfil != null && fotoPerfil!.trim().isNotEmpty) return fotoPerfil!.trim();
    if (user != null) {
      return (user!['fotoPerfil'] ?? user!['foto_perfil'] ?? '').toString().trim();
    }
    return '';
  }

  String get _avatar {
    if (avatar != null && avatar!.trim().isNotEmpty) return avatar!.trim();
    if (user != null) return (user!['avatar'] ?? '').toString().trim();
    return '';
  }

  /// URL de red o `null` si es data URL / vacío.
  static String? resolveNetworkUrl(String raw, {bool isWeb = kIsWeb}) {
    final s = raw.trim();
    if (s.isEmpty || s.startsWith('data:')) return null;
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/')) {
      final api = ApiConfig.baseUrl(isWeb: isWeb);
      final origin = api.replaceFirst(RegExp(r'/api/?$'), '');
      return '$origin$s';
    }
    return null;
  }

  static Uint8List? decodeDataUrlBytes(String raw) {
    final s = raw.trim();
    if (!s.startsWith('data:image/')) return null;
    final idx = s.indexOf('base64,');
    if (idx < 0) return null;
    try {
      return base64Decode(s.substring(idx + 'base64,'.length));
    } catch (_) {
      return null;
    }
  }

  double get _innerSize =>
      borderWidth > 0 ? (size - 2 * borderWidth).clamp(0.0, size) : size;

  @override
  Widget build(BuildContext context) {
    final foto = _foto;
    final av = _avatar;
    final bytes = decodeDataUrlBytes(foto);
    final networkUrl = bytes == null ? resolveNetworkUrl(foto) : null;
    final inner = _innerSize;

    Widget content;
    if (bytes != null) {
      content = Image.memory(bytes, width: inner, height: inner, fit: BoxFit.cover);
    } else if (networkUrl != null) {
      content = Image.network(
        networkUrl,
        width: inner,
        height: inner,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => _emojiOrIcon(av, inner),
      );
    } else {
      content = _emojiOrIcon(av, inner);
    }

    final border = borderColor ?? const Color.fromRGBO(226, 232, 240, 0.14);

    return SizedBox(
      width: size,
      height: size,
      child: DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: borderWidth > 0 ? Border.all(color: border, width: borderWidth) : null,
        ),
        child: ClipOval(child: content),
      ),
    );
  }

  Widget _emojiOrIcon(String av, double inner) {
    return Container(
      width: inner,
      height: inner,
      decoration: BoxDecoration(shape: BoxShape.circle, color: backgroundColor),
      alignment: Alignment.center,
      child: av.isEmpty
          ? Icon(placeholderIcon, size: inner * 0.45, color: placeholderIconColor)
          : Text(av, style: TextStyle(fontSize: inner * 0.42)),
    );
  }
}
