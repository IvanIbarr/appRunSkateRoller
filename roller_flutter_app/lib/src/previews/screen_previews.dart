import 'package:flutter/material.dart';

import '../core/ui/preview.dart';
import '../core/ui/background_scaffold.dart';
import '../core/ui/glass_card.dart';
import '../core/ui/page_scaffold.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/chat/presentation/chat_screen.dart';
import '../features/historial/presentation/historial_screen.dart';
import '../features/calendario/presentation/calendario_screen.dart';
import '../features/rollertips/presentation/rollertips_screen.dart';
import '../features/marketing/presentation/marketing_screen.dart';
import '../features/menu/presentation/menu_screen.dart';
import '../features/inicio/presentation/inicio_screen.dart';

/// Previews aislados por pantalla (busca "@Preview(" en este archivo).
/// Nota: algunas pantallas dependen de providers/red; estos previews son para inspección visual del layout/estilo.

@Preview('Login')
Widget previewLogin() => previewApp(const LoginScreen(), title: 'Login');

@Preview('Ruta')
Widget previewRuta() => previewApp(const InicioScreen(), title: 'Ruta');

@Preview('Chat')
Widget previewChat() => previewApp(const ChatScreen(), title: 'Chat');

@Preview('Historial')
Widget previewHistorial() => previewApp(const HistorialScreen(), title: 'Historial');

@Preview('Calendario')
Widget previewCalendario() => previewApp(const CalendarioScreen(), title: 'Calendario');

@Preview('RollerTips')
Widget previewRollerTips() => previewApp(const RollerTipsScreen(), title: 'RollerTips');

@Preview('Marketing')
Widget previewMarketing() => previewApp(const MarketingScreen(), title: 'Marketing');

@Preview('Menú')
Widget previewMenu() => previewApp(const MenuScreen(), title: 'Menú');

// -----------------------------
// Mock previews (sin providers)
// -----------------------------

@Preview('Mock · Login (extremos)')
Widget previewMockLogin() => previewApp(const _MockLogin(), title: 'Mock Login');

@Preview('Mock · Ruta (extremos)')
Widget previewMockRuta() => previewApp(const _MockRuta(), title: 'Mock Ruta');

@Preview('Mock · Chat (extremos)')
Widget previewMockChat() => previewApp(const _MockChat(), title: 'Mock Chat');

@Preview('Mock · Historial (extremos)')
Widget previewMockHistorial() => previewApp(const _MockHistorial(), title: 'Mock Historial');

@Preview('Mock · Calendario (extremos)')
Widget previewMockCalendario() => previewApp(const _MockCalendario(), title: 'Mock Calendario');

@Preview('Mock · RollerTips (extremos)')
Widget previewMockRollerTips() => previewApp(const _MockRollerTips(), title: 'Mock RollerTips');

@Preview('Mock · Marketing (extremos)')
Widget previewMockMarketing() => previewApp(const _MockMarketing(), title: 'Mock Marketing');

@Preview('Mock · Menú (extremos)')
Widget previewMockMenu() => previewApp(const _MockMenu(), title: 'Mock Menú');

class _MockLogin extends StatelessWidget {
  const _MockLogin();

  @override
  Widget build(BuildContext context) {
    return BackgroundScaffold(
      showLogo: true,
      child: GlassCard(
        maxWidth: 520,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('RunSkateRoller', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 6),
            Text(
              'Bienvenido. Prueba textos largos y multilínea para verificar que no se rompa el layout en Web/Móvil.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 14),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Correo',
                hintText: 'nombre.apellido.super.largo+alias.demo@dominio-extremadamente-largo-ejemplo.com',
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(labelText: 'Contraseña', hintText: '••••••••••••••••'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {},
                    child: const Text('Iniciar sesión'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    child: const Text('Crear cuenta'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () {},
              child: const Text('¿Olvidaste tu contraseña? (texto muy largo de prueba)'),
            ),
          ],
        ),
      ),
    );
  }
}

class _MockRuta extends StatelessWidget {
  const _MockRuta();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Ruta',
      maxWidth: 1100,
      child: LayoutBuilder(
        builder: (context, c) {
          final isNarrow = c.maxWidth < 760;
          final map = ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: isNarrow ? 360 : 520,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFF020617), Color(0xFF0B1224)],
                ),
              ),
              child: const Center(
                child: Text('MAPA (mock)\n— prueba de layout —', textAlign: TextAlign.center),
              ),
            ),
          );

          final form = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Escribe o ten a la mano la calle y codigo postal para ubicar mejor origen y destino en el mapa.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: const [
                  _MiniStat(label: 'Distancia', value: '12.34 km'),
                  _MiniStat(label: 'Tiempo', value: '1h 05m'),
                  _MiniStat(label: 'Calorías', value: '617'),
                ],
              ),
              const SizedBox(height: 12),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Origen',
                  hintText: 'Av. Insurgentes Sur 1234, Colonia Nombre Muy Muy Largo, 01234, CDMX',
                ),
              ),
              const SizedBox(height: 12),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Destino',
                  hintText:
                      'Calle con nombre extremadamente largo para probar overflow y multiline en móvil 999, 09876',
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () {}, child: const Text('Trazar ruta'))),
              const SizedBox(height: 10),
              SizedBox(width: double.infinity, child: OutlinedButton(onPressed: () {}, child: const Text('Crear Recap'))),
              const SizedBox(height: 10),
              SizedBox(width: double.infinity, child: OutlinedButton(onPressed: () {}, child: const Text('¡VAMOS! · Iniciar'))),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: OutlinedButton(onPressed: () {}, child: const Text('Compartir Ruta'))),
                  const SizedBox(width: 10),
                  Expanded(child: ElevatedButton(onPressed: () {}, child: const Text('Terminar Ruta'))),
                ],
              ),
            ],
          );

          if (isNarrow) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                map,
                const SizedBox(height: 14),
                form,
              ],
            );
          }
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: map),
              const SizedBox(width: 14),
              SizedBox(width: 360, child: form),
            ],
          );
        },
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(2, 6, 23, 0.62),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}

class _MockChat extends StatelessWidget {
  const _MockChat();

  @override
  Widget build(BuildContext context) {
    const messages = [
      (
        isMe: false,
        user: 'Usuario Con Nombre Extremadamente Largo Para Probar Overflows',
        text: 'Hola, este es un mensaje cortito.',
      ),
      (
        isMe: true,
        user: 'sacx2003@gmail.com',
        text:
            'Mensaje MUY largo en varias líneas para probar el comportamiento del bubble en móvil. '
            'Incluye más texto, más texto, más texto, y caracteres especiales: # % & ( ) /.',
      ),
      (
        isMe: false,
        user: 'roller@roller.com',
        text:
            'Otro mensaje largo.\nCon salto de línea.\nY otro salto.\n'
            'Esto debe mantener padding y radios sin romper.',
      ),
    ];

    return PageScaffold(
      title: 'Chat',
      maxWidth: 980,
      child: SizedBox(
        height: 620,
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: messages.length,
                itemBuilder: (context, i) {
                  final m = messages[i];
                  final bubbleColor = m.isMe
                      ? const Color.fromRGBO(255, 62, 165, 0.22)
                      : const Color.fromRGBO(15, 23, 42, 0.35);
                  final align = m.isMe ? Alignment.centerRight : Alignment.centerLeft;
                  return Align(
                    alignment: align,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      constraints: const BoxConstraints(maxWidth: 520),
                      decoration: BoxDecoration(
                        color: bubbleColor,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.12)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            m.user,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 6),
                          Text(m.text),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Expanded(child: TextField(decoration: InputDecoration(hintText: 'Escribe un mensaje...'))),
                const SizedBox(width: 8),
                IconButton(onPressed: () {}, icon: const Icon(Icons.send)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MockHistorial extends StatelessWidget {
  const _MockHistorial();

  @override
  Widget build(BuildContext context) {
    final items = List.generate(12, (i) {
      return {
        'origen': i.isEven ? 'Origen con nombre muy largo número $i — Avenida Insurgentes Sur 1234, CDMX' : 'Origen $i',
        'destino': 'Destino con texto largo para probar truncado y multilínea $i — Calle X, Colonia Y, 01234',
        'stats': {
          'distanciaTotal': 1200 + (i * 137),
          'duracion': 600 + (i * 53),
        }
      };
    });
    final top = [
      {'alias': 'LíderDeGrupoConAliasMuyLargoQueNoDebeRomperLaVista', 'totalKilometros': 123.45},
      {'alias': 'roller@roller.com', 'totalKilometros': 98.7},
      {'alias': 'sacx2003@gmail.com', 'totalKilometros': 77.77},
    ];

    return BackgroundScaffold(
      showLogo: false,
      child: GlassCard(
        child: SizedBox(
          height: 560,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text('Historial', style: Theme.of(context).textTheme.headlineSmall)),
                  SizedBox(
                    height: 40,
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: const [
                          _Chip('All'),
                          SizedBox(width: 6),
                          _Chip('Week'),
                          SizedBox(width: 6),
                          _Chip('Month'),
                          SizedBox(width: 6),
                          _Chip('Year'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: const [
                  Expanded(child: _MiniStat(label: 'KM', value: '256.7')),
                  SizedBox(width: 10),
                  Expanded(child: _MiniStat(label: 'Recorridos', value: '42')),
                  SizedBox(width: 10),
                  Expanded(child: _MiniStat(label: 'Tiempo', value: '12h 05m')),
                ],
              ),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final it = items[i];
                    final stats = it['stats'] as Map<String, dynamic>;
                    return Card(
                      child: ListTile(
                        title: Text((it['origen'] ?? 'Recorrido').toString(), maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text('Destino: ${(it['destino'] ?? '-').toString()}',
                            maxLines: 2, overflow: TextOverflow.ellipsis),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('${stats['distanciaTotal']} m'),
                            Text('${stats['duracion']} s', style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              Text('Top', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 6),
              for (final u in top)
                Text('- ${(u['alias'] ?? 'user').toString()} · ${(u['totalKilometros'] ?? 0).toString()} km',
                    overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.label);
  final String label;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(15, 23, 42, 0.22),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.12)),
      ),
      child: Text(label, style: Theme.of(context).textTheme.labelSmall),
    );
  }
}

class _MockCalendario extends StatelessWidget {
  const _MockCalendario();

  @override
  Widget build(BuildContext context) {
    final items = List.generate(10, (i) {
      return {
        'titulo': i == 0
            ? 'Evento con título extremadamente largo para probar el truncado y no romper el ListTile en móvil'
            : 'Evento $i',
        'fecha': '2026-05-${(i + 1).toString().padLeft(2, '0')}T20:00:00.000Z',
        'lugar': 'Parque con nombre largo, Colonia Larguísima, Alcaldía X, Ciudad de México',
      };
    });

    return BackgroundScaffold(
      showLogo: false,
      child: GlassCard(
        child: SizedBox(
          height: 560,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Calendario', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final it = items[i];
                    return Card(
                      child: ListTile(
                        title: Text(it['titulo']!.toString(), maxLines: 2, overflow: TextOverflow.ellipsis),
                        subtitle: Text('${it['fecha']} • ${it['lugar']}', maxLines: 2, overflow: TextOverflow.ellipsis),
                        trailing: IconButton(onPressed: () {}, icon: const Icon(Icons.delete_outline)),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () {}, child: const Text('Crear evento (mock)'))),
            ],
          ),
        ),
      ),
    );
  }
}

class _MockRollerTips extends StatelessWidget {
  const _MockRollerTips();

  @override
  Widget build(BuildContext context) {
    final items = List.generate(10, (i) {
      return {
        'uploader': i == 0 ? 'Creador Con Alias Súper Largo Que Debería Cortarse En Una Línea' : 'uploader $i',
        'desc': i.isEven
            ? 'Descripción muy larga para probar multiline. '
                'Incluye varios renglones y texto extra para forzar elipsis o wrap dependiendo del ancho.'
            : 'Tip corto.',
        'url': 'https://ejemplo.com/video-$i.webm',
      };
    });

    return BackgroundScaffold(
      showLogo: false,
      child: GlassCard(
        child: SizedBox(
          height: 560,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('RollerTips', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final it = items[i];
                    return Card(
                      child: ListTile(
                        title: Text(it['uploader']!, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(it['desc']!, maxLines: 3, overflow: TextOverflow.ellipsis),
                        trailing: const Icon(Icons.play_circle_outline),
                        onTap: () {},
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(width: double.infinity, child: OutlinedButton(onPressed: () {}, child: const Text('Subir tip (mock)'))),
            ],
          ),
        ),
      ),
    );
  }
}

class _MockMarketing extends StatelessWidget {
  const _MockMarketing();

  @override
  Widget build(BuildContext context) {
    final items = List.generate(12, (i) {
      return {
        'brandModel': i == 0 ? 'Patines FR1 80 Deluxe Ultra Mega Edition — descripción larga' : 'Producto $i',
        'priceMx': (i * 111).toString(),
        'category': i.isEven ? 'Slalom / Freestyle' : 'Fitness',
      };
    });

    return PageScaffold(
      title: 'Marketing',
      maxWidth: 1100,
      actions: [
        TextButton.icon(onPressed: () {}, icon: const Icon(Icons.add), label: const Text('Vender')),
      ],
      child: SizedBox(
        height: 560,
        child: ListView.separated(
          itemCount: items.length,
          separatorBuilder: (context, index) => const SizedBox(height: 10),
          itemBuilder: (context, i) {
            final it = items[i];
            final title = it['brandModel']!;
            final price = it['priceMx']!;
            final category = it['category']!;
            return Card(
              child: ListTile(
                leading: const Icon(Icons.local_offer_rounded),
                title: Text(title, maxLines: 2, overflow: TextOverflow.ellipsis),
                subtitle: Text('\$$price MXN • $category', maxLines: 2, overflow: TextOverflow.ellipsis),
                trailing: ElevatedButton(onPressed: () {}, child: const Text('Comprar')),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _MockMenu extends StatelessWidget {
  const _MockMenu();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Menú',
      maxWidth: 900,
      child: Column(
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.person_rounded),
              title: const Text('Perfil'),
              subtitle: const Text('Nombre muy largo de prueba: Sacx 2003 Apellido Apellido Apellido'),
              onTap: () {},
            ),
          ),
          const SizedBox(height: 10),
          const Card(
            child: ListTile(
              leading: Icon(Icons.groups_rounded),
              title: Text('Mi grupo'),
              subtitle: Text('Grupo con nombre extremadamente largo para probar overflow en 2 líneas máximo'),
            ),
          ),
          const SizedBox(height: 10),
          const Card(
            child: ListTile(
              leading: Icon(Icons.workspace_premium_rounded),
              title: Text('Mis suscripciones'),
              subtitle: Text('Plan: Plus Anual \$479 MXN (texto largo) · Estado: Activo'),
            ),
          ),
          const SizedBox(height: 10),
          const Card(
            child: ListTile(
              leading: Icon(Icons.admin_panel_settings_rounded),
              title: Text('Admin'),
              subtitle: Text('Usuarios • Ventas • Buzón (mock)'),
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout_rounded),
              title: const Text('Cerrar sesión'),
              onTap: () {},
            ),
          ),
        ],
      ),
    );
  }
}

