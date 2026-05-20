import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/ui/page_scaffold.dart';
import '../data/grupo_repository.dart';

final nombreGrupoProvider = FutureProvider.autoDispose<String>((ref) async {
  return ref.watch(grupoRepositoryProvider).getNombre();
});

class NombreGrupoScreen extends ConsumerStatefulWidget {
  const NombreGrupoScreen({super.key});

  @override
  ConsumerState<NombreGrupoScreen> createState() => _NombreGrupoScreenState();
}

class _NombreGrupoScreenState extends ConsumerState<NombreGrupoScreen> {
  final _ctrl = TextEditingController();
  String _original = '';
  bool _busy = false;
  bool _hydrated = false;
  String? _feedback;
  bool _feedbackIsError = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _showFeedback(String message, {required bool isError}) {
    setState(() {
      _feedback = message;
      _feedbackIsError = isError;
    });
    final messenger = ScaffoldMessenger.maybeOf(context);
    messenger?.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? const Color(0xFFFF3B30) : const Color(0xFF34C759),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _save() async {
    final v = _ctrl.text.trim();
    if (v.isEmpty) {
      _showFeedback('El nombre del grupo es requerido', isError: true);
      return;
    }
    if (v.length > 255) {
      _showFeedback('Maximo 255 caracteres', isError: true);
      return;
    }
    if (v == _original) {
      _showFeedback(
        _original.isEmpty
            ? 'Escribe un nombre para crear tu grupo'
            : 'Este nombre ya es el de tu grupo',
        isError: true,
      );
      return;
    }

    setState(() {
      _busy = true;
      _feedback = null;
    });

    try {
      final wasCreate = _original.isEmpty;
      final result = await ref.read(grupoRepositoryProvider).updateNombre(v);
      ref.invalidate(nombreGrupoProvider);
      _original = result.nombreGrupo;
      if (!mounted) return;

      final msg = result.created || wasCreate
          ? 'Grupo creado con exito'
          : 'Nombre del grupo actualizado';
      _showFeedback(msg, isError: false);

      await Future<void>.delayed(const Duration(milliseconds: 900));
      if (mounted) context.go('/menu');
    } catch (e) {
      if (!mounted) return;
      final msg = GrupoRepository.readApiError(e);
      _showFeedback(msg, isError: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget? _feedbackBanner() {
    final text = _feedback;
    if (text == null || text.isEmpty) return null;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: (_feedbackIsError ? const Color(0xFFFF3B30) : const Color(0xFF34C759))
            .withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: _feedbackIsError ? const Color(0xFFFF3B30) : const Color(0xFF34C759),
        ),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: _feedbackIsError ? const Color(0xFFFFCDD2) : const Color(0xFFC8E6C9),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(nombreGrupoProvider);
    return PageScaffold(
      title: 'Nombre del Grupo',
      maxWidth: 820,
      child: async.when(
        data: (name) {
          if (!_hydrated) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted || _hydrated) return;
              setState(() {
                _hydrated = true;
                _original = name;
                _ctrl.text = name;
              });
            });
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Establece el nombre de tu grupo.'),
              const SizedBox(height: 12),
              if (_feedbackBanner() != null) _feedbackBanner()!,
              TextField(
                controller: _ctrl,
                maxLength: 255,
                textInputAction: TextInputAction.done,
                onSubmitted: _busy ? null : (_) => _save(),
                decoration: const InputDecoration(
                  labelText: 'Nombre del grupo',
                  hintText: 'Ej: Grupo de Rollers CDMX',
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _busy ? null : _save,
                  child: Text(_busy ? 'Guardando...' : 'Guardar'),
                ),
              ),
              TextButton(
                onPressed: _busy ? null : () => context.go('/menu'),
                child: const Text('Regresar al Menú'),
              ),
            ],
          );
        },
        loading: () => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Center(child: CircularProgressIndicator()),
            TextButton(
              onPressed: () => context.go('/menu'),
              child: const Text('Regresar al Menú'),
            ),
          ],
        ),
        error: (e, _) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Error cargando nombre del grupo: $e'),
            TextButton(
              onPressed: () => context.go('/menu'),
              child: const Text('Regresar al Menú'),
            ),
          ],
        ),
      ),
    );
  }
}
