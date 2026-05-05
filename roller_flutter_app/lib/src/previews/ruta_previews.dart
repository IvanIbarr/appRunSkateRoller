import 'package:flutter/material.dart';

import '../core/ui/preview.dart';

@Preview('Ruta · iPhone + Desktop (Mock overlays)')
Widget previewRutaCompareMock() => previewCompare(
      title: 'Ruta · iPhone vs Desktop',
      iphone: const _RutaMock(),
      desktop: const _RutaMock(),
    );

class _RutaMock extends StatelessWidget {
  const _RutaMock();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final isDesktop = w >= 900;

    return Stack(
      children: [
        // Fondo como en origen (imagen + overlay)
        Positioned.fill(
          child: Image.asset(
            'assets/patines-fondo-nuevo.jpeg',
            fit: BoxFit.cover,
          ),
        ),
        const Positioned.fill(
          child: ColoredBox(color: Color.fromRGBO(10, 12, 24, 0.52)),
        ),

        // Contenido scrolleable
        SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _HeaderMock(compact: false),
                const SizedBox(height: 10),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: _RouteCardMock(),
                ),

                const SizedBox(height: 14),

                // Mapa (placeholder) con frame/shadow como RN mapWrapper
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: isDesktop ? 20 : 20),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(maxWidth: isDesktop ? 720 : double.infinity),
                      child: _MapWrapperMock(
                        height: isDesktop ? 420 : 360,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // Panel post-cálculo (stats + recap + iniciar + acciones)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: const [
                          _StatPill(label: 'Distancia', value: '12.3 km'),
                          _StatPill(label: 'Tiempo', value: '1h 05m'),
                          _StatPill(label: 'Velocidad', value: '11.4 km/h'),
                          _StatPill(label: 'Calorías', value: '615'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color.fromRGBO(56, 189, 248, 0.35)),
                          backgroundColor: const Color.fromRGBO(15, 23, 42, 0.20),
                        ),
                        child: const Text('Crear Recap'),
                      ),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: () {},
                        child: const Text('¡VAMOS! · Iniciar'),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {},
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF3B82F6),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              child: const Text('Compartir Ruta'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {},
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFEF4444),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              child: const Text('Terminar Ruta'),
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
      ],
    );
  }
}

class _HeaderMock extends StatelessWidget {
  const _HeaderMock({required this.compact});
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, compact ? 10 : 20, 20, compact ? 10 : 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
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
                  'Inicio de Recorrido',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontSize: compact ? 22 : 31,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        shadows: const [
                          Shadow(color: Color.fromRGBO(0, 0, 0, 0.75), blurRadius: 4, offset: Offset(2, 2)),
                        ],
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Navegación y Tracking',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontSize: compact ? 14 : 21,
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
      ),
    );
  }
}

class _RouteCardMock extends StatelessWidget {
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
            const TextField(
              decoration: InputDecoration(
                labelText: 'Origen',
                hintText: 'Ej: Lic. Primo Verdad, Col. Jardines, CDMX',
              ),
            ),
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
            const SizedBox(height: 8),
            Text(
              'Origen listo: GPS',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color.fromRGBO(248, 250, 252, 0.90),
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 10),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Destino',
                hintText: 'Ej: Xitla, Col. Arenal 4ta Sección, CDMX',
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
              ),
              child: const Text('Trazar ruta'),
            ),
            const SizedBox(height: 12),
            // Confirm card (tipo Uber)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: const Color.fromRGBO(15, 23, 42, 0.92),
                border: Border.all(color: const Color.fromRGBO(56, 189, 248, 0.35)),
                boxShadow: const [
                  BoxShadow(
                    color: Color.fromRGBO(0, 0, 0, 0.28),
                    blurRadius: 18,
                    offset: Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Destino: confirmar punto', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(
                    'Calle con nombre extremadamente largo para probar elipsis y multiline en el panel de confirmación.',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color.fromRGBO(248, 250, 252, 0.85)),
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
          ],
        ),
      ),
    );
  }
}

class _MapWrapperMock extends StatelessWidget {
  const _MapWrapperMock({required this.height});
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.35),
            blurRadius: 18,
            offset: Offset(0, 14),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: Container(
              color: const Color(0xFFE0E0E0),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.map_outlined, size: 44, color: Color(0xFF666666)),
                    SizedBox(height: 10),
                    Text('Mapa (placeholder)', style: TextStyle(color: Color(0xFF666666))),
                  ],
                ),
              ),
            ),
          ),
          // Loading overlay (como RN mapLoading)
          Positioned.fill(
            child: IgnorePointer(
              child: Container(
                color: const Color.fromRGBO(255, 255, 255, 0.90),
                child: const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 10),
                      Text('Cargando mapa...', style: TextStyle(color: Color(0xFF666666))),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({required this.label, required this.value});
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
          Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: const Color.fromRGBO(226, 232, 240, 0.78))),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}

