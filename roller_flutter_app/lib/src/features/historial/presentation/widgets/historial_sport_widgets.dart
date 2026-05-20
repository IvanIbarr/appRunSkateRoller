import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/ui/rn_layered_styles.dart';
import '../../../../core/ui/rn_mirror_layouts.dart';

/// Tokens visuales alineados con [/ruta] (glass + acentos neon).
abstract final class HistorialSportTheme {
  static const cyan = Color(0xFF38BDF8);
  static const green = Color(0xFF34C759);
  static const orange = Color(0xFFFF9500);
  static const violet = Color(0xFF5856D6);
  static const textPrimary = Color(0xFFF8FAFC);
  static const textMuted = Color(0xFF94A3B8);
}

class HistorialSportGlassPanel extends StatelessWidget {
  const HistorialSportGlassPanel({
    super.key,
    required this.child,
    this.accent = HistorialSportTheme.cyan,
    this.padding = const EdgeInsets.all(16),
    this.margin,
  });

  final Widget child;
  final Color accent;
  final EdgeInsets padding;
  final EdgeInsets? margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: RnLayeredStyles.glassFill,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withValues(alpha: 0.55), width: 1.5),
        boxShadow: [
          BoxShadow(color: accent.withValues(alpha: 0.18), blurRadius: 14, offset: const Offset(0, 4)),
          const BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.35), blurRadius: 12, offset: Offset(0, 6)),
        ],
      ),
      child: child,
    );
  }
}

class HistorialSportSectionTitle extends StatelessWidget {
  const HistorialSportSectionTitle({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.accent = HistorialSportTheme.cyan,
  });

  final String icon;
  final String title;
  final String? subtitle;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(icon, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.permanentMarker(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: HistorialSportTheme.textPrimary,
                  shadows: const [
                    Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
                  ],
                ),
              ),
            ),
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: GoogleFonts.permanentMarker(fontSize: 13, color: HistorialSportTheme.textMuted),
          ),
        ],
      ],
    );
  }
}

class HistorialStatCard extends StatelessWidget {
  const HistorialStatCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    required this.unit,
    required this.accent,
  });

  final String icon;
  final String label;
  final String value;
  final String unit;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return HistorialSportGlassPanel(
      accent: accent,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(icon, style: const TextStyle(fontSize: 18)),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  label.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.permanentMarker(
                    fontSize: 10,
                    letterSpacing: 0.6,
                    color: HistorialSportTheme.textMuted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.permanentMarker(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: HistorialSportTheme.textPrimary,
            ),
          ),
          Text(
            unit,
            style: GoogleFonts.permanentMarker(fontSize: 11, color: accent, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class HistorialFilterChips extends StatelessWidget {
  const HistorialFilterChips({
    super.key,
    required this.labels,
    required this.selected,
    required this.onSelected,
    this.accent = HistorialSportTheme.cyan,
  });

  final Map<String, String> labels;
  final String selected;
  final ValueChanged<String> onSelected;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final e in labels.entries)
          InkWell(
            onTap: () => onSelected(e.key),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: selected == e.key ? accent.withValues(alpha: 0.25) : RnLayeredStyles.glassFill,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: selected == e.key ? accent : accent.withValues(alpha: 0.35),
                  width: selected == e.key ? 2 : 1,
                ),
                boxShadow: selected == e.key
                    ? [BoxShadow(color: accent.withValues(alpha: 0.25), blurRadius: 8)]
                    : null,
              ),
              child: Text(
                e.value,
                style: GoogleFonts.permanentMarker(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: selected == e.key ? accent : HistorialSportTheme.textMuted,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class HistorialSportPodium extends StatelessWidget {
  const HistorialSportPodium({super.key, required this.entries});

  final List<Map<String, dynamic>> entries;

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) return const SizedBox.shrink();
    final p1 = entries[0];
    final p2 = entries.length > 1 ? entries[1] : null;
    final p3 = entries.length > 2 ? entries[2] : null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(child: p2 != null ? _Stand(rank: 2, user: p2, height: 108) : const SizedBox()),
          Expanded(child: _Stand(rank: 1, user: p1, height: 136)),
          Expanded(child: p3 != null ? _Stand(rank: 3, user: p3, height: 92) : const SizedBox()),
        ],
      ),
    );
  }
}

class _Stand extends StatelessWidget {
  const _Stand({required this.rank, required this.user, required this.height});

  final int rank;
  final Map<String, dynamic> user;
  final double height;

  @override
  Widget build(BuildContext context) {
    final name = (user['alias'] ?? user['email'] ?? 'Roller').toString();
    final km = double.tryParse((user['totalKilometros'] ?? 0).toString()) ?? 0;
    final medal = rank == 1 ? '🥇' : (rank == 2 ? '🥈' : '🥉');
    final accent = rank == 1
        ? const Color(0xFFFFD700)
        : rank == 2
            ? const Color(0xFFC0C0C0)
            : const Color(0xFFCD7F32);
    final r = rank == 1 ? 32.0 : 26.0;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(medal, style: const TextStyle(fontSize: 28)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: accent, width: 2.5),
            boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.45), blurRadius: 10)],
          ),
          child: RnMirrorLeaderboardAvatar(user: user, radius: r),
        ),
        const SizedBox(height: 8),
        Text(
          name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: GoogleFonts.permanentMarker(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: HistorialSportTheme.textPrimary,
          ),
        ),
        Text(
          '${km.toStringAsFixed(1)} km',
          style: GoogleFonts.permanentMarker(
            fontSize: 11,
            color: HistorialSportTheme.orange,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: height,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                accent.withValues(alpha: 0.85),
                RnLayeredStyles.glassFill,
              ],
            ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: accent.withValues(alpha: 0.7)),
          ),
          alignment: Alignment.topCenter,
          padding: const EdgeInsets.only(top: 10),
          child: Text(
            '$rank°',
            style: GoogleFonts.permanentMarker(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white),
          ),
        ),
      ],
    );
  }
}

class HistorialRankingRow extends StatelessWidget {
  const HistorialRankingRow({
    super.key,
    required this.user,
    required this.rank,
    required this.maxKm,
    this.isCurrentUser = false,
  });

  final Map<String, dynamic> user;
  final int rank;
  final double maxKm;
  final bool isCurrentUser;

  @override
  Widget build(BuildContext context) {
    final name = (user['alias'] ?? user['email'] ?? 'Roller').toString();
    final rec = int.tryParse((user['totalRecorridos'] ?? 0).toString()) ?? 0;
    final km = double.tryParse((user['totalKilometros'] ?? 0).toString()) ?? 0;
    final progress = maxKm > 0 ? (km / maxKm).clamp(0.0, 1.0) : 0.0;
    final accent = isCurrentUser ? HistorialSportTheme.cyan : HistorialSportTheme.orange;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCurrentUser ? HistorialSportTheme.cyan.withValues(alpha: 0.12) : RnLayeredStyles.glassFill,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isCurrentUser ? HistorialSportTheme.cyan : RnLayeredStyles.glassBorder,
          width: isCurrentUser ? 2 : 1,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.25),
                  shape: BoxShape.circle,
                  border: Border.all(color: accent),
                ),
                child: Text(
                  '$rank',
                  style: GoogleFonts.permanentMarker(fontSize: 12, fontWeight: FontWeight.w800, color: accent),
                ),
              ),
              const SizedBox(width: 10),
              RnMirrorLeaderboardAvatar(user: user, radius: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.permanentMarker(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: HistorialSportTheme.textPrimary,
                      ),
                    ),
                    Text(
                      '$rec recorridos',
                      style: GoogleFonts.permanentMarker(fontSize: 11, color: HistorialSportTheme.textMuted),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    km.toStringAsFixed(1),
                    style: GoogleFonts.permanentMarker(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: accent,
                    ),
                  ),
                  Text('km', style: GoogleFonts.permanentMarker(fontSize: 10, color: HistorialSportTheme.textMuted)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 5,
              backgroundColor: const Color.fromRGBO(255, 255, 255, 0.08),
              color: accent,
            ),
          ),
        ],
      ),
    );
  }
}

class HistorialRideCard extends StatelessWidget {
  const HistorialRideCard({
    super.key,
    required this.origen,
    required this.destino,
    required this.fechaLabel,
    required this.kmLabel,
    required this.duracionLabel,
    required this.velocidadLabel,
    this.highlight = false,
  });

  final String origen;
  final String destino;
  final String fechaLabel;
  final String kmLabel;
  final String duracionLabel;
  final String velocidadLabel;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return HistorialSportGlassPanel(
      accent: highlight ? HistorialSportTheme.cyan : HistorialSportTheme.green,
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: HistorialSportTheme.cyan.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: HistorialSportTheme.cyan.withValues(alpha: 0.5)),
            ),
            child: const Text('🛼', style: TextStyle(fontSize: 22)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fechaLabel,
                  style: GoogleFonts.permanentMarker(fontSize: 11, color: HistorialSportTheme.textMuted),
                ),
                const SizedBox(height: 4),
                Text(
                  origen.isEmpty ? 'Recorrido' : origen,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.permanentMarker(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: HistorialSportTheme.textPrimary,
                  ),
                ),
                Text(
                  '→ $destino',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.permanentMarker(fontSize: 12, color: HistorialSportTheme.textMuted),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    _chip(kmLabel, HistorialSportTheme.cyan),
                    _chip(duracionLabel, HistorialSportTheme.green),
                    _chip(velocidadLabel, HistorialSportTheme.orange),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String text, Color c) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: c.withValues(alpha: 0.45)),
      ),
      child: Text(
        text,
        style: GoogleFonts.permanentMarker(fontSize: 11, fontWeight: FontWeight.w600, color: c),
      ),
    );
  }
}
