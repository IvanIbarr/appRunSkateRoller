import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/ui/rn_shell_bottom_tab_bar.dart';
import '../../perfil/data/perfil_repository.dart';
import '../data/evento_repository.dart';
import '../models/evento_draft.dart';
import 'calendario_navigation.dart';
import 'widgets/evento_image_uploader.dart';

final _meProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  try {
    return await ref.watch(perfilRepositoryProvider).me();
  } catch (_) {
    return null;
  }
});

/// Espejo de `VistaPreviaEventoScreen.tsx` (fondo, overlay, secciones cyan, imágenes, acciones, modal éxito).
class VistaPreviaEventoScreen extends ConsumerStatefulWidget {
  const VistaPreviaEventoScreen({super.key, required this.draft});
  final EventoDraft draft;

  static const Color _cyan = Color(0xFF00D9FF);
  static const Color _overlay = Color.fromRGBO(10, 17, 40, 217);

  @override
  ConsumerState<VistaPreviaEventoScreen> createState() => _VistaPreviaEventoScreenState();
}

class _VistaPreviaEventoScreenState extends ConsumerState<VistaPreviaEventoScreen> {
  bool _publishing = false;
  bool _showSuccess = false;

  Future<void> _publicar({required String organizadorEmail}) async {
    final d = widget.draft;
    if (d.tituloRuta.trim().isEmpty ||
        d.puntoSalida.trim().isEmpty ||
        d.fechaInicio.trim().isEmpty ||
        d.cita.trim().isEmpty ||
        d.salida.trim().isEmpty ||
        d.nivel.trim().isEmpty) {
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('❌ Error de Validación'),
          content: const Text('Por favor, completa todos los campos requeridos antes de publicar.'),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Entendido'))],
        ),
      );
      return;
    }

    setState(() => _publishing = true);
    try {
      await ref.read(eventoRepositoryProvider).create(
            organizadorEmail: organizadorEmail,
            tituloRuta: d.tituloRuta,
            puntoSalida: d.puntoSalida,
            fechaInicio: d.fechaInicio,
            cita: d.cita,
            salida: d.salida,
            nivel: d.nivel,
            logoGrupo: d.logoGrupo,
            lugarDestino: d.lugarDestino,
          );
      if (!mounted) return;
      setState(() {
        _publishing = false;
        _showSuccess = true;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      final data = e.response?.data;
      String msg = 'No se pudo publicar el evento';
      if (data is Map && data['error'] != null) {
        msg = data['error'].toString();
      } else if (e.message != null && e.message!.isNotEmpty) {
        msg = e.message!;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('No se pudo publicar: $e')));
    } finally {
      if (mounted && !_showSuccess) setState(() => _publishing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(_meProvider).valueOrNull;
    final meEmail = (me?['email'] ?? '').toString();
    final organizadorEmail = widget.draft.organizadorEmail?.trim().isNotEmpty == true
        ? widget.draft.organizadorEmail!.trim()
        : meEmail;

    final topPad = MediaQuery.paddingOf(context).top;
    final headerTop = topPad > 0 ? 20.0 : 60.0;
    final d = widget.draft;
    final desc = (d.descripcion ?? '').trim();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/IMG_2675.jpeg',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Image.asset(
                'assets/patines-fondo-nuevo.jpeg',
                fit: BoxFit.cover,
              ),
            ),
          ),
          const Positioned.fill(child: ColoredBox(color: VistaPreviaEventoScreen._overlay)),
          Positioned.fill(
            child: SingleChildScrollView(
              padding: EdgeInsets.only(bottom: RnBottomNavigationSlot.totalHeight + 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(20, headerTop, 20, 0),
                    child: Row(
                      children: [
                        Material(
                          color: const Color.fromRGBO(0, 217, 255, 0.2),
                          shape: const CircleBorder(
                            side: BorderSide(color: Color.fromRGBO(0, 217, 255, 0.3)),
                          ),
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: () => popBackFromVistaPrevia(context),
                            child: const SizedBox(
                              width: 40,
                              height: 40,
                              child: Center(
                                child: Text(
                                  '←',
                                  style: TextStyle(
                                    fontSize: 24,
                                    color: VistaPreviaEventoScreen._cyan,
                                    fontWeight: FontWeight.w300,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Vista Previa del Evento',
                            style: GoogleFonts.permanentMarker(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              shadows: const [
                                Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(1, 1)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _section(label: 'Título de la Ruta', value: d.tituloRuta),
                        _section(label: 'Punto de Salida', value: d.puntoSalida),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: _section(label: 'Fecha Inicio', value: d.fechaInicio, marginBottom: 16)),
                            const SizedBox(width: 16),
                            Expanded(child: _section(label: 'Nivel', value: d.nivel, marginBottom: 16)),
                          ],
                        ),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: _section(label: 'Cita', value: d.cita, marginBottom: 16)),
                            const SizedBox(width: 16),
                            Expanded(child: _section(label: 'Salida', value: d.salida, marginBottom: 16)),
                          ],
                        ),
                        if (desc.isNotEmpty) _section(label: 'Descripción', value: desc),
                        const SizedBox(height: 8),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: _imageBlock(label: 'Logo del Grupo', uri: d.logoGrupo)),
                            const SizedBox(width: 16),
                            Expanded(child: _imageBlock(label: 'Lugar del Destino', uri: d.lugarDestino)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Organizador: ${organizadorEmail.isEmpty ? '—' : organizadorEmail}',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 13),
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: VistaPreviaEventoScreen._cyan,
                                  side: const BorderSide(color: VistaPreviaEventoScreen._cyan, width: 2),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                onPressed: _publishing ? null : () => popBackFromVistaPrevia(context),
                                child: const Text('Editar Evento', style: TextStyle(fontWeight: FontWeight.w600)),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: FilledButton(
                                style: FilledButton.styleFrom(
                                  backgroundColor: VistaPreviaEventoScreen._cyan,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  disabledBackgroundColor: VistaPreviaEventoScreen._cyan.withValues(alpha: 0.5),
                                ),
                                onPressed: _publishing || organizadorEmail.isEmpty
                                    ? null
                                    : () => _publicar(organizadorEmail: organizadorEmail),
                                child: _publishing
                                    ? const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                          ),
                                          SizedBox(width: 8),
                                          Text('Publicando...', style: TextStyle(fontWeight: FontWeight.w700)),
                                        ],
                                      )
                                    : const Text('📢 Publicar Evento', style: TextStyle(fontWeight: FontWeight.w700)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_showSuccess) _SuccessOverlay(
            titulo: d.tituloRuta,
            onVerCalendario: () {
              setState(() => _showSuccess = false);
              popWithOptionalResult(context, true);
            },
          ),
        ],
      ),
    );
  }
}

Widget _section({required String label, required String value, double marginBottom = 20}) {
  final v = value.trim().isEmpty ? 'No especificado' : value.trim();
  return Padding(
    padding: EdgeInsets.only(bottom: marginBottom),
    child: DecoratedBox(
      decoration: BoxDecoration(
        color: const Color.fromRGBO(255, 255, 255, 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color.fromRGBO(0, 217, 255, 0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              label.toUpperCase(),
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: VistaPreviaEventoScreen._cyan,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            Text(v, style: const TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.w400)),
          ],
        ),
      ),
    ),
  );
}

Widget _imageBlock({required String label, required String? uri}) {
  final u = (uri ?? '').trim();
  return Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        label.toUpperCase(),
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: VistaPreviaEventoScreen._cyan,
          letterSpacing: 1,
        ),
      ),
      const SizedBox(height: 8),
      AspectRatio(
        aspectRatio: 1,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: const Color.fromRGBO(255, 255, 255, 0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: u.isNotEmpty
                  ? const Color.fromRGBO(0, 217, 255, 0.5)
                  : const Color.fromRGBO(0, 217, 255, 0.3),
              width: 2,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: u.isEmpty
                ? const Center(
                    child: Text(
                      'No hay imagen',
                      style: TextStyle(color: Colors.white54, fontSize: 14),
                    ),
                  )
                : EventoDraftImage(uri: u, fit: BoxFit.cover),
          ),
        ),
      ),
    ],
  );
}

class _SuccessOverlay extends StatelessWidget {
  const _SuccessOverlay({required this.titulo, required this.onVerCalendario});

  final String titulo;
  final VoidCallback onVerCalendario;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color.fromRGBO(0, 0, 0, 0.7),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color.fromRGBO(76, 175, 80, 0.5), width: 2),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF4CAF50).withValues(alpha: 0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('✅', style: TextStyle(fontSize: 56)),
                    const SizedBox(height: 8),
                    Text(
                      '¡Evento Publicado!',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF4CAF50),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'El evento',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.95), fontSize: 16, height: 1.4),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '"$titulo"',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF4CAF50),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'ha sido publicado exitosamente y ya está visible en el calendario.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.95), fontSize: 16, height: 1.4),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF4CAF50),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: Color(0xFF66BB6A), width: 2),
                          ),
                        ),
                        onPressed: onVerCalendario,
                        child: const Text('Ver Calendario', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
