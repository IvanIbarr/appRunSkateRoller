import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/data/auth_repository.dart';
import '../../../core/ui/page_scaffold.dart';

final aliasInfoProvider = FutureProvider.autoDispose<({String? alias, int? cambiosRestantes})>((ref) async {
  return ref.watch(authRepositoryProvider).getAliasInfo();
});

class CambiarAliasScreen extends ConsumerStatefulWidget {
  const CambiarAliasScreen({super.key});

  @override
  ConsumerState<CambiarAliasScreen> createState() => _CambiarAliasScreenState();
}

class _CambiarAliasScreenState extends ConsumerState<CambiarAliasScreen> {
  final _alias = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _alias.dispose();
    super.dispose();
  }

  Future<void> _save({required String? aliasActual, required int? cambiosRestantes}) async {
    final a = _alias.text.trim();
    if (a.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El alias es requerido')));
      return;
    }
    if (aliasActual != null && a == aliasActual) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El nuevo alias debe ser diferente al actual')));
      return;
    }
    final ok = RegExp(r"^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]+$").hasMatch(a);
    if (!ok || a.length > 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Alias inválido (máx 100; letras/números/espacios/_/-)')),
      );
      return;
    }
    if (cambiosRestantes != null && cambiosRestantes <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Límite de cambios alcanzado (3 máximo).')));
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(authRepositoryProvider).cambiarAlias(a);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ Alias cambiado exitosamente')));
      ref.invalidate(aliasInfoProvider);
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('No se pudo cambiar alias: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final info = ref.watch(aliasInfoProvider);
    return PageScaffold(
      title: 'Cambiar Alias',
      maxWidth: 720,
      child: info.when(
        data: (it) {
          final aliasActual = it.alias;
          final cambios = it.cambiosRestantes;
          if (_alias.text.isEmpty && aliasActual != null) {
            // prefill inicial (solo 1 vez)
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && _alias.text.isEmpty) _alias.text = aliasActual;
            });
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                cambios == null
                    ? 'Modifica tu alias personal.'
                    : cambios > 0
                        ? 'Te quedan $cambios cambio${cambios == 1 ? '' : 's'} disponible${cambios == 1 ? '' : 's'}.'
                        : 'Has alcanzado el límite de cambios (3 máximo).',
              ),
              if (aliasActual != null) ...[
                const SizedBox(height: 10),
                Card(
                  child: ListTile(
                    title: const Text('Alias actual'),
                    subtitle: Text(aliasActual),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              TextField(
                controller: _alias,
                enabled: cambios == null || cambios > 0,
                decoration: const InputDecoration(labelText: 'Nuevo alias', hintText: 'Ej: RollerPro2024'),
                maxLength: 100,
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _busy ? null : () => _save(aliasActual: aliasActual, cambiosRestantes: cambios),
                  child: Text(_busy ? 'Guardando...' : 'Guardar cambios'),
                ),
              ),
              TextButton(
                onPressed: _busy ? null : () => context.pop(),
                child: const Text('Volver'),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Text('Error cargando alias: $e'),
      ),
    );
  }
}

