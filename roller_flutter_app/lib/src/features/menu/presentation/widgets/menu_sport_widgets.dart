import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/ui/rn_layered_styles.dart';
import '../../../../core/ui/rn_mirror_layouts.dart';
import '../../../../core/ui/user_profile_avatar.dart';

/// Tokens alineados con [/ruta] (glass oscuro + acentos).
abstract final class MenuSportTheme {
  static const cyan = Color(0xFF38BDF8);
  static const teal = Color(0xFF0891B2);
  static const green = Color(0xFF34C759);
  static const orange = Color(0xFFFF9500);
  static const violet = Color(0xFF9B59B6);
  static const red = Color(0xFFEF4444);
  static const textPrimary = Color(0xFFF8FAFC);
  static const textMuted = Color(0xFF94A3B8);
}

class MenuSportGlassCard extends StatelessWidget {
  const MenuSportGlassCard({
    super.key,
    required this.child,
    this.accent = MenuSportTheme.cyan,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final Color accent;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: RnLayeredStyles.glassFill,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withValues(alpha: 0.45), width: 1.2),
        boxShadow: [
          BoxShadow(color: accent.withValues(alpha: 0.12), blurRadius: 14, offset: const Offset(0, 4)),
          const BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.32), blurRadius: 12, offset: Offset(0, 6)),
        ],
      ),
      child: child,
    );
  }
}

class MenuSportHeader extends StatelessWidget {
  const MenuSportHeader({required this.email});

  final String email;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Menú', style: RnMirrorTypography.heroTitle()),
        const SizedBox(height: 4),
        Text(
          'Configuración y opciones',
          style: RnMirrorTypography.heroSubtitle(size: 18),
        ),
        if (email.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            email,
            style: GoogleFonts.permanentMarker(
              fontSize: 13,
              fontStyle: FontStyle.italic,
              color: MenuSportTheme.textMuted,
            ),
          ),
        ],
      ],
    );
  }
}

class MenuSportProfileChip extends StatelessWidget {
  const MenuSportProfileChip({
    super.key,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? MenuSportTheme.cyan.withValues(alpha: 0.18) : const Color.fromRGBO(15, 23, 42, 0.45),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: active ? MenuSportTheme.cyan : MenuSportTheme.textMuted.withValues(alpha: 0.35),
              width: active ? 1.5 : 1,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: active ? MenuSportTheme.cyan : MenuSportTheme.textMuted,
            ),
          ),
        ),
      ),
    );
  }
}

class MenuSportActionButton extends StatelessWidget {
  const MenuSportActionButton({
    super.key,
    required this.label,
    required this.onTap,
    this.accent = MenuSportTheme.cyan,
    this.filled = false,
    this.enabled = true,
  });

  final String label;
  final VoidCallback onTap;
  final Color accent;
  final bool filled;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Opacity(
        opacity: enabled ? 1 : 0.55,
        child: filled
            ? ElevatedButton(
                onPressed: enabled ? onTap : null,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  backgroundColor: accent,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color.fromRGBO(71, 85, 105, 0.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 4,
                  shadowColor: accent.withValues(alpha: 0.35),
                  textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                ),
                child: Text(label),
              )
            : OutlinedButton(
                onPressed: enabled ? onTap : null,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  side: BorderSide(color: accent.withValues(alpha: 0.7), width: 1.5),
                  foregroundColor: MenuSportTheme.textPrimary,
                  backgroundColor: const Color.fromRGBO(15, 23, 42, 0.38),
                  disabledForegroundColor: MenuSportTheme.textMuted,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                ),
                child: Text(label),
              ),
      ),
    );
  }
}

class MenuSportAvatar extends StatelessWidget {
  const MenuSportAvatar({
    super.key,
    required this.me,
    required this.fotoMode,
    this.size = 96,
  });

  final Map<String, dynamic> me;
  final bool fotoMode;
  final double size;

  @override
  Widget build(BuildContext context) {
    final foto = (me['fotoPerfil'] ?? '').toString();
    final av = (me['avatar'] ?? '').toString();
    final showPhoto = fotoMode && foto.isNotEmpty;

    return UserProfileAvatar(
      fotoPerfil: showPhoto ? foto : null,
      avatar: av,
      size: size,
      borderColor: MenuSportTheme.cyan.withValues(alpha: 0.75),
      borderWidth: 2.5,
      backgroundColor: const Color.fromRGBO(2, 6, 23, 0.72),
    );
  }
}
