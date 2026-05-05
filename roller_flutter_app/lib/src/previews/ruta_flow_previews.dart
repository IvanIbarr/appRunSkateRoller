import 'package:flutter/material.dart';

import '../core/ui/preview.dart';

@Preview('Ruta · Configuración (iPhone + Desktop)')
Widget previewRutaConfigCompare() => previewCompare(
      title: 'Ruta · Configuración',
      iphone: const _RutaConfigMock(),
      desktop: const _RutaConfigMock(),
    );

@Preview('Ruta · Confirmación trayecto (Modal abierto)')
Widget previewRutaConfirmCompare() => previewCompare(
      title: 'Ruta · Confirmación (Modal)',
      iphone: const _RutaConfirmModalMock(),
      desktop: const _RutaConfirmModalMock(),
    );

@Preview('Ruta · Viaje en progreso (Tracking)')
Widget previewRutaTrackingCompare() => previewCompare(
      title: 'Ruta · Tracking',
      iphone: const _RutaTrackingMock(),
      desktop: const _RutaTrackingMock(),
    );

@Preview('Ruta · Resumen final (Fin)')
Widget previewRutaResumenCompare() => previewCompare(
      title: 'Ruta · Resumen final',
      iphone: const _RutaResumenMock(),
      desktop: const _RutaResumenMock(),
    );

class _RutaBg extends StatelessWidget {
  const _RutaBg({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final isDesktop = w >= 900;

    return Stack(
      children: [
        Positioned.fill(
          child: Image.asset(
            'assets/patines-fondo-nuevo.jpeg',
            fit: BoxFit.cover,
          ),
        ),
        const Positioned.fill(
          child: ColoredBox(color: Color.fromRGBO(10, 12, 24, 0.52)),
        ),
        SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(20, 18, 20, 24),
            child: Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: isDesktop ? 980 : double.infinity),
                child: child,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MapMock extends StatelessWidget {
  const _MapMock({required this.height});
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: const Color.fromRGBO(2, 6, 23, 0.55),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
        boxShadow: const [
          BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.35), blurRadius: 16, offset: Offset(0, 8)),
        ],
      ),
      child: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.map_rounded, size: 42, color: Color.fromRGBO(226, 232, 240, 0.80)),
            SizedBox(height: 8),
            Text(
              'Mapa (placeholder)',
              style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.80), fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ),
    );
  }
}

class _RutaHeader extends StatelessWidget {
  const _RutaHeader({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: const Color.fromRGBO(2, 6, 23, 0.62),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
          ),
          child: const Icon(Icons.person, color: Color(0xFFE2E8F0)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      shadows: const [
                        Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
                      ],
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontSize: 18,
                      color: Colors.white,
                      shadows: const [
                        Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 3, offset: Offset(1, 1)),
                      ],
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RutaCard extends StatelessWidget {
  const _RutaCard({required this.mode});
  final _RutaCardMode mode;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.14)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Escribe o ten a la mano la calle y codigo postal para ubicar mejor origen y destino en el mapa.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color.fromRGBO(226, 232, 240, 0.78),
                    height: 17 / 12,
                  ),
            ),
            const SizedBox(height: 12),
            const TextField(decoration: InputDecoration(labelText: 'Origen')),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.55)),
                backgroundColor: const Color.fromRGBO(15, 23, 42, 0.30),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Usar mi ubicación'),
            ),
            const SizedBox(height: 10),
            const TextField(decoration: InputDecoration(labelText: 'Destino')),
            const SizedBox(height: 12),
            if (mode == _RutaCardMode.config)
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                ),
                child: const Text('Trazar ruta'),
              )
            else
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: const [
                      Expanded(child: _StatPill(label: 'Distancia', value: '12.3 km')),
                      SizedBox(width: 10),
                      Expanded(child: _StatPill(label: 'Tiempo', value: '1h 05m')),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: const [
                      Expanded(child: _StatPill(label: 'Velocidad', value: '11.4 km/h')),
                      SizedBox(width: 10),
                      Expanded(child: _StatPill(label: 'Calorías', value: '615')),
                    ],
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

enum _RutaCardMode { config, afterRoute }

class _StatPill extends StatelessWidget {
  const _StatPill({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(2, 6, 23, 0.55),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: const Color.fromRGBO(226, 232, 240, 0.72),
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
          ),
        ],
      ),
    );
  }
}

class _RutaConfigMock extends StatelessWidget {
  const _RutaConfigMock();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final mapH = w >= 900 ? 420.0 : 360.0;

    return _RutaBg(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _RutaHeader(title: 'Inicio de Recorrido', subtitle: 'Configuración de ruta'),
          const SizedBox(height: 12),
          const _RutaCard(mode: _RutaCardMode.config),
          const SizedBox(height: 14),
          _MapMock(height: mapH),
        ],
      ),
    );
  }
}

class _RutaConfirmModalMock extends StatelessWidget {
  const _RutaConfirmModalMock();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final mapH = w >= 900 ? 420.0 : 360.0;

    return _RutaBg(
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _RutaHeader(title: 'Inicio de Recorrido', subtitle: 'Confirmación de trayecto'),
              const SizedBox(height: 12),
              const _RutaCard(mode: _RutaCardMode.afterRoute),
              const SizedBox(height: 14),
              _MapMock(height: mapH),
              const SizedBox(height: 220),
            ],
          ),
          Positioned.fill(
            child: IgnorePointer(
              child: Container(color: const Color.fromRGBO(0, 0, 0, 0.35)),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              decoration: BoxDecoration(
                color: const Color.fromRGBO(15, 23, 42, 0.95),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.35)),
                boxShadow: const [
                  BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.35), blurRadius: 18, offset: Offset(0, -10)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          '¿Confirmar trayecto?',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
                        ),
                      ),
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color.fromRGBO(226, 232, 240, 0.22),
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Origen: Mi ubicación actual\nDestino: Xitla, Arenal 4ta Sección',
                    style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.85), height: 1.25),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {},
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          ),
                          child: const Text('Cambiar'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          ),
                          child: const Text('Confirmar'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RutaTrackingMock extends StatelessWidget {
  const _RutaTrackingMock();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final mapH = w >= 900 ? 460.0 : 420.0;

    return _RutaBg(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _RutaHeader(title: 'Viaje en progreso', subtitle: 'Tracking activo'),
          const SizedBox(height: 12),
          _MapMock(height: mapH),
          const SizedBox(height: 12),
          Row(
            children: const [
              Expanded(child: _StatPill(label: 'Tiempo', value: '00:18:42')),
              SizedBox(width: 10),
              Expanded(child: _StatPill(label: 'Distancia', value: '3.4 km')),
            ],
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            child: const Text('Terminar Ruta'),
          ),
        ],
      ),
    );
  }
}

class _RutaResumenMock extends StatelessWidget {
  const _RutaResumenMock();

  @override
  Widget build(BuildContext context) {
    return _RutaBg(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _RutaHeader(title: 'Resumen', subtitle: 'Recorrido finalizado'),
          const SizedBox(height: 12),
          const _RutaCard(mode: _RutaCardMode.afterRoute),
          const SizedBox(height: 12),
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: const BorderSide(color: Color.fromRGBO(226, 232, 240, 0.14)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    '¡Buen trabajo!',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Se guardó tu recorrido en Historial.\n¿Quieres crear un Recap?',
                    style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.85), height: 1.25),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(onPressed: () {}, child: const Text('Ver Historial')),
                  const SizedBox(height: 10),
                  ElevatedButton(onPressed: () {}, child: const Text('Crear Recap')),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

