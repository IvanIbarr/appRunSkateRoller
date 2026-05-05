import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/data/auth_repository.dart';
import '../../../core/ui/page_scaffold.dart';

class AgregarAliasScreen extends ConsumerStatefulWidget {
  const AgregarAliasScreen({super.key});

  @override
  ConsumerState<AgregarAliasScreen> createState() => _AgregarAliasScreenState();
}

class _AgregarAliasScreenState extends ConsumerState<AgregarAliasScreen> {
  final _alias = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _alias.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final a = _alias.text.trim();
    if (a.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El alias es requerido')));
      return;
    }
    final ok = RegExp(r"^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]+$").hasMatch(a);
    if (!ok || a.length > 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Alias inválido (máx 100; letras/números/espacios/_/-)')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(authRepositoryProvider).agregarAlias(a);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ Alias guardado exitosamente')));
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('No se pudo guardar alias: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Agregar Alias',
      maxWidth: 720,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Establece tu alias personal (1 vez).'),
          const SizedBox(height: 12),
          TextField(
            controller: _alias,
            decoration: const InputDecoration(labelText: 'Alias', hintText: 'Ej: RollerPro2024'),
            maxLength: 100,
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
            onPressed: _busy ? null : () => context.pop(),
            child: const Text('Volver'),
          ),
        ],
      ),
    );
  }
}

