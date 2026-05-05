import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final v = _ctrl.text.trim();
    if (v.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El nombre del grupo es requerido')));
      return;
    }
    if (v.length > 255) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Máximo 255 caracteres')));
      return;
    }
    if (v == _original) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No hay cambios para guardar')));
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(grupoRepositoryProvider).updateNombre(v);
      ref.invalidate(nombreGrupoProvider);
      _original = v;
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ Nombre guardado')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('No se pudo guardar: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(nombreGrupoProvider);
    return PageScaffold(
      title: 'Nombre del Grupo',
      maxWidth: 820,
      child: async.when(
        data: (name) {
          if (_ctrl.text.isEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              _original = name;
              _ctrl.text = name;
            });
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Establece el nombre de tu grupo.'),
              const SizedBox(height: 12),
              TextField(
                controller: _ctrl,
                maxLength: 255,
                decoration: const InputDecoration(labelText: 'Nombre del grupo', hintText: 'Ej: Grupo de Rollers CDMX'),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _busy ? null : _save,
                  child: Text(_busy ? 'Guardando...' : 'Guardar'),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Text('Error cargando nombre del grupo: $e'),
      ),
    );
  }
}

