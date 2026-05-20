import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Espejo de `AvatarSelector.tsx` (categorías + emojis).
class AvatarSelectorSheet extends StatefulWidget {
  const AvatarSelectorSheet({
    super.key,
    required this.selectedAvatar,
    required this.onSelect,
  });

  final String? selectedAvatar;
  final ValueChanged<String> onSelect;

  static const Map<String, List<String>> avatarsByCategory = {
    'Hombres': ['👨', '👨‍💼', '👨‍🔬', '👨‍🎓', '👨‍🚀'],
    'Mujeres': ['👩', '👩‍💼', '👩‍🔬', '👩‍🎓', '👩‍🚀'],
    'Niños': ['👶', '🧒', '👦', '🧑', '👨‍🦱'],
    'Diversos': ['🧑‍🦰', '🧑‍🦱', '🧑‍🦳', '🧑‍🦲', '🧑‍⚕️'],
  };

  static Future<void> show(
    BuildContext context, {
    required String? selectedAvatar,
    required ValueChanged<String> onSelect,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: AvatarSelectorSheet(selectedAvatar: selectedAvatar, onSelect: onSelect),
      ),
    );
  }

  @override
  State<AvatarSelectorSheet> createState() => _AvatarSelectorSheetState();
}

class _AvatarSelectorSheetState extends State<AvatarSelectorSheet> {
  late String _category;

  @override
  void initState() {
    super.initState();
    _category = AvatarSelectorSheet.avatarsByCategory.keys.first;
  }

  @override
  Widget build(BuildContext context) {
    final list = AvatarSelectorSheet.avatarsByCategory[_category] ?? [];

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Seleccionar Avatar',
                    style: GoogleFonts.permanentMarker(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: Colors.white70),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final cat in AvatarSelectorSheet.avatarsByCategory.keys)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(cat),
                        selected: _category == cat,
                        onSelected: (_) => setState(() => _category = cat),
                        selectedColor: const Color(0xFF007AFF),
                        labelStyle: TextStyle(
                          color: _category == cat ? Colors.white : const Color(0xFF94A3B8),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: [
                for (final av in list)
                  InkWell(
                    onTap: () {
                      widget.onSelect(av);
                      Navigator.pop(context);
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: const Color.fromRGBO(30, 41, 59, 0.9),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: widget.selectedAvatar == av
                              ? const Color(0xFF007AFF)
                              : const Color.fromRGBO(148, 163, 184, 0.35),
                          width: widget.selectedAvatar == av ? 3 : 1,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Stack(
                        children: [
                          Text(av, style: const TextStyle(fontSize: 36)),
                          if (widget.selectedAvatar == av)
                            const Positioned(
                              right: 4,
                              top: 4,
                              child: Icon(Icons.check_circle, color: Color(0xFF34C759), size: 18),
                            ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
