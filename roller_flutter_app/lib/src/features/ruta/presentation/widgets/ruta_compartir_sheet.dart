import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../chat/data/chat_repository.dart';
import '../../../chat/presentation/chat_thread_screen.dart';

/// Opciones al pulsar «Compartir Ruta»: enlace del sistema o publicar en Comunidad.
Future<void> showRutaCompartirSheet({
  required BuildContext context,
  required WidgetRef ref,
  required String shareText,
  required bool canStaffChat,
}) async {
  final choice = await showModalBottomSheet<String>(
    context: context,
    backgroundColor: const Color(0xFF1A1A2E),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Compartir recorrido',
                style: Theme.of(ctx).textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                'Envía el enlace «Sígueme» o publícalo en la Comunidad.',
                style: Theme.of(ctx).textTheme.bodySmall?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.share_outlined, color: Color(0xFF38BDF8)),
                title: const Text('Compartir enlace', style: TextStyle(color: Colors.white)),
                subtitle: const Text('WhatsApp, copiar, etc.', style: TextStyle(color: Colors.white54)),
                onTap: () => Navigator.pop(ctx, 'share'),
              ),
              ListTile(
                leading: const Icon(Icons.forum_outlined, color: Color(0xFF38BDF8)),
                title: const Text('Chat General', style: TextStyle(color: Colors.white)),
                subtitle: const Text('Publicar en Comunidad · General', style: TextStyle(color: Colors.white54)),
                onTap: () => Navigator.pop(ctx, 'general'),
              ),
              if (canStaffChat)
                ListTile(
                  leading: const Icon(Icons.groups_outlined, color: Color(0xFF38BDF8)),
                  title: const Text('Chat Staff', style: TextStyle(color: Colors.white)),
                  subtitle: const Text(
                    'Miembros del grupo, líderes y administradores',
                    style: TextStyle(color: Colors.white54),
                  ),
                  onTap: () => Navigator.pop(ctx, 'staff'),
                ),
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
            ],
          ),
        ),
      );
    },
  );

  if (!context.mounted || choice == null) return;

  switch (choice) {
    case 'share':
      try {
        await Share.share(shareText);
      } catch (_) {
        /**/
      }
      return;
    case 'general':
    case 'staff':
      try {
        await ref.read(chatRepositoryProvider).sendMessage(
              chatType: choice,
              text: shareText,
            );
        ref.invalidate(chatThreadMessagesProvider(choice));
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                choice == 'staff'
                    ? 'Publicado en Chat Staff'
                    : 'Publicado en Chat General',
              ),
            ),
          );
          context.go('/chat');
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('No se pudo publicar en el chat: $e')),
          );
        }
      }
      return;
    default:
      return;
  }
}
