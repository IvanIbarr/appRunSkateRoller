import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../network/api_config.dart';

/// Avatar de perfil: `fotoPerfil` (data URL, http o ruta) o emoji `avatar`.
/// Espejo de `AvatarCircle.tsx` en RN.
class UserProfileAvatar extends StatelessWidget {
  const UserProfileAvatar({
    super.key,
    this.user,
    this.fotoPerfil,
    this.avatar,
    this.size = 50,
    this.borderColor,
    this.borderWidth = 2,
    this.backgroundColor = const Color(0xFF0F172A),
    this.placeholderIcon = Icons.person,
    this.placeholderIconColor = const Color(0xFF94A3B8),
  });

  factory UserProfileAvatar.fromUser(
    Map<String, dynamic>? user, {
    double size = 50,
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

  @override
  Widget build(BuildContext context) {
    final foto = _foto;
    final av = _avatar;
    final bytes = decodeDataUrlBytes(foto);
    final networkUrl = bytes == null ? resolveNetworkUrl(foto) : null;

    Widget inner;
    if (bytes != null) {
      inner = ClipOval(
        child: Image.memory(bytes, width: size, height: size, fit: BoxFit.cover),
      );
    } else if (networkUrl != null) {
      inner = ClipOval(
        child: Image.network(
          networkUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => _emojiOrIcon(av),
        ),
      );
    } else {
      inner = _emojiOrIcon(av);
    }

    final border = borderColor ?? const Color.fromRGBO(226, 232, 240, 0.14);
    return Container(
      width: size,
      height: size,
      padding: borderWidth > 0 ? EdgeInsets.all(borderWidth) : null,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: borderWidth > 0 ? Border.all(color: border, width: borderWidth) : null,
      ),
      child: inner,
    );
  }

  Widget _emojiOrIcon(String av) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: backgroundColor),
      alignment: Alignment.center,
      child: av.isEmpty
          ? Icon(placeholderIcon, size: size * 0.45, color: placeholderIconColor)
          : Text(av, style: TextStyle(fontSize: size * 0.42)),
    );
  }
}
