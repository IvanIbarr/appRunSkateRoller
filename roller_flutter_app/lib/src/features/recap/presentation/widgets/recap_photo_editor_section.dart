import 'dart:ui' show ImageFilter;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../models/recap_photo.dart';
import '../../models/recap_plan_limits.dart';

class RecapPhotoEditorSection extends StatelessWidget {
  const RecapPhotoEditorSection({
    super.key,
    required this.planId,
    required this.photos,
    required this.onPhotosChanged,
  });

  final String planId;
  final List<RecapPhoto> photos;
  final void Function(List<RecapPhoto> next) onPhotosChanged;

  int get _max => RecapPlanLimits.maxPhotos(planId);

  Future<void> _pickPhotos(BuildContext context) async {
    final remaining = _max - photos.length;
    if (remaining <= 0) {
      _showLimitDialog(context);
      return;
    }
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: true,
      withData: true,
    );
    if (picked == null || picked.files.isEmpty) return;

    final all = picked.files.where((f) => f.bytes != null).toList();
    if (all.length > remaining) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Solo puedes añadir $remaining foto(s) más (máx $_max).'),
            duration: const Duration(seconds: 4),
          ),
        );
      }
      if (planId == RecapPlanLimits.defaultPlanId && context.mounted) {
        final goPlans = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Límite del plan gratis'),
            content: Text(
              'El plan ${RecapPlanLimits.planLabel(planId)} permite hasta $_max fotos.\n\n'
              '¿Quieres ver planes con más fotos?',
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
              FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ver planes')),
            ],
          ),
        );
        if (goPlans == true && context.mounted) context.push('/recap/plan');
      }
    }

    final slice = all.take(remaining).toList();
    final next = [...photos];
    for (var i = 0; i < slice.length; i++) {
      final f = slice[i];
      next.add(
        RecapPhoto(
          id: '${DateTime.now().millisecondsSinceEpoch}-$i',
          bytes: f.bytes!,
          fileName: f.name,
        ),
      );
    }
    onPhotosChanged(next);
  }

  void _showLimitDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Límite alcanzado'),
        content: Text('Ya tienes $_max fotos (plan ${RecapPlanLimits.planLabel(planId)}).'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
          if (planId == RecapPlanLimits.defaultPlanId)
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.push('/recap/plan');
              },
              child: const Text('Ver planes'),
            ),
        ],
      ),
    );
  }

  void _remove(int index) {
    final next = [...photos];
    final removed = next.removeAt(index);
    removed.dispose();
    onPhotosChanged(next);
  }

  void _move(int from, int to) {
    if (to < 0 || to >= photos.length) return;
    final next = [...photos];
    final item = next.removeAt(from);
    next.insert(to, item);
    onPhotosChanged(next);
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: const Color(0xCC0D1117),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color.fromRGBO(0, 255, 127, 0.28)),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.image, size: 18, color: const Color(0xFF38BDF8)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Fotos para tu recap',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: const Color(0xFFF8FAFC),
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00FF7F).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color.fromRGBO(0, 255, 127, 0.35)),
                      ),
                      child: Text(
                        '${photos.length}/$_max',
                        style: const TextStyle(
                          color: Color(0xFF34D399),
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Selecciona hasta $_max imágenes. Aparecerán en el video del recap.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF94A3B8),
                        height: 1.35,
                      ),
                ),
                const SizedBox(height: 10),
                if (photos.isEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white12),
                      color: const Color.fromRGBO(15, 23, 42, 0.45),
                    ),
                    child: const Text(
                      'Sin fotos aún',
                      style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                    ),
                  )
                else
                  SizedBox(
                    height: 108,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: photos.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, i) {
                        final p = photos[i];
                        return _ThumbTile(
                          photo: p,
                          index: i,
                          total: photos.length,
                          onRemove: () => _remove(i),
                          onMoveLeft: i > 0 ? () => _move(i, i - 1) : null,
                          onMoveRight: i < photos.length - 1 ? () => _move(i, i + 1) : null,
                        );
                      },
                    ),
                  ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: photos.length >= _max ? () => _showLimitDialog(context) : () => _pickPhotos(context),
                  icon: Icon(photos.length >= _max ? LucideIcons.lock : LucideIcons.imagePlus, size: 18),
                  label: Text(photos.length >= _max ? 'Límite alcanzado' : 'Añadir fotos'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                    foregroundColor: const Color(0xFFE2E8F0),
                    side: BorderSide(
                      color: photos.length >= _max
                          ? const Color(0xFF64748B)
                          : const Color.fromRGBO(56, 189, 248, 0.45),
                    ),
                    backgroundColor: const Color.fromRGBO(15, 23, 42, 0.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ThumbTile extends StatelessWidget {
  const _ThumbTile({
    required this.photo,
    required this.index,
    required this.total,
    required this.onRemove,
    this.onMoveLeft,
    this.onMoveRight,
  });

  final RecapPhoto photo;
  final int index;
  final int total;
  final VoidCallback onRemove;
  final VoidCallback? onMoveLeft;
  final VoidCallback? onMoveRight;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 88,
      child: Column(
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: RecapPhotoThumbnail(photo: photo),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: GestureDetector(
                    onTap: onRemove,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Color(0xCC0F172A),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, size: 14, color: Color(0xFFF8FAFC)),
                    ),
                  ),
                ),
                Positioned(
                  left: 4,
                  bottom: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xCC020617),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${index + 1}/$total',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                onPressed: onMoveLeft,
                icon: Icon(Icons.chevron_left, size: 18, color: onMoveLeft != null ? Colors.white70 : Colors.white24),
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                onPressed: onMoveRight,
                icon: Icon(Icons.chevron_right, size: 18, color: onMoveRight != null ? Colors.white70 : Colors.white24),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class RecapPhotoThumbnail extends StatelessWidget {
  const RecapPhotoThumbnail({super.key, required this.photo});

  final RecapPhoto photo;

  @override
  Widget build(BuildContext context) {
    return Image.memory(
      photo.bytes,
      fit: BoxFit.cover,
      gaplessPlayback: true,
      errorBuilder: (_, _, _) => const ColoredBox(
        color: Color(0xFF1E293B),
        child: Center(child: Icon(Icons.broken_image_outlined, color: Colors.white54)),
      ),
    );
  }
}
