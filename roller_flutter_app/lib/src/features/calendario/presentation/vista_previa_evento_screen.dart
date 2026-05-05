import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ui/page_scaffold.dart';
import '../../perfil/data/perfil_repository.dart';
import '../data/evento_repository.dart';
import '../models/evento_draft.dart';

final _meProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  try {
    return await ref.watch(perfilRepositoryProvider).me();
  } catch (_) {
    return null;
  }
});

class VistaPreviaEventoScreen extends ConsumerStatefulWidget {
  const VistaPreviaEventoScreen({super.key, required this.draft});
  final EventoDraft draft;

  @override
  ConsumerState<VistaPreviaEventoScreen> createState() => _VistaPreviaEventoScreenState();
}

class _VistaPreviaEventoScreenState extends ConsumerState<VistaPreviaEventoScreen> {
  bool _publishing = false;

  Future<void> _publicar({required String organizadorEmail}) async {
    setState(() => _publishing = true);
    try {
      await ref.read(eventoRepositoryProvider).create(
            organizadorEmail: organizadorEmail,
            tituloRuta: widget.draft.tituloRuta,
            puntoSalida: widget.draft.puntoSalida,
            fechaInicio: widget.draft.fechaInicio,
            cita: widget.draft.cita,
            salida: widget.draft.salida,
            nivel: widget.draft.nivel,
            logoGrupo: widget.draft.logoGrupo,
            lugarDestino: widget.draft.lugarDestino,
          );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('✅ Publicado con éxito'),
          content: Text('El evento "${widget.draft.tituloRuta}" se publicó correctamente.'),
          actions: [
            ElevatedButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK')),
          ],
        ),
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('No se pudo publicar: $e')));
    } finally {
      if (mounted) setState(() => _publishing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(_meProvider).valueOrNull;
    final meEmail = (me?['email'] ?? '').toString();
    final organizadorEmail = widget.draft.organizadorEmail?.trim().isNotEmpty == true
        ? widget.draft.organizadorEmail!.trim()
        : meEmail;

    return PageScaffold(
      title: 'Vista previa del evento',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _kv('Título de la Ruta', widget.draft.tituloRuta),
                  _kv('Punto de Salida', widget.draft.puntoSalida),
                  Row(
                    children: [
                      Expanded(child: _kv('Fecha inicio', widget.draft.fechaInicio)),
                      const SizedBox(width: 10),
                      Expanded(child: _kv('Nivel', widget.draft.nivel)),
                    ],
                  ),
                  Row(
                    children: [
                      Expanded(child: _kv('Cita', widget.draft.cita)),
                      const SizedBox(width: 10),
                      Expanded(child: _kv('Salida', widget.draft.salida)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _imageCard(
                  label: 'Logo del Grupo',
                  url: (widget.draft.logoGrupo ?? '').trim(),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _imageCard(
                  label: 'Lugar del Destino',
                  url: (widget.draft.lugarDestino ?? '').trim(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            'Organizador: ${organizadorEmail.isEmpty ? '—' : organizadorEmail}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _publishing ? null : () => Navigator.of(context).pop(false),
                  child: const Text('Editar'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: _publishing || organizadorEmail.isEmpty
                      ? null
                      : () => _publicar(organizadorEmail: organizadorEmail),
                  child: Text(_publishing ? 'Publicando…' : 'Publicar'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

Widget _kv(String k, String v) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(k, style: const TextStyle(fontWeight: FontWeight.w900)),
        const SizedBox(height: 2),
        Text(v.isEmpty ? '—' : v),
      ],
    ),
  );
}

Widget _imageCard({required String label, required String url}) {
  return Card(
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w900)),
          const SizedBox(height: 10),
          AspectRatio(
            aspectRatio: 1.4,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: url.isEmpty
                  ? Container(
                      color: const Color.fromRGBO(2, 6, 23, 0.62),
                      child: const Center(child: Text('No hay imagen')),
                    )
                  : Image.network(
                      url,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: const Color.fromRGBO(2, 6, 23, 0.62),
                        child: const Center(child: Text('URL inválida')),
                      ),
                    ),
            ),
          ),
        ],
      ),
    ),
  );
}

