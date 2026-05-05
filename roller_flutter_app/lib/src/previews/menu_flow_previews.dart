import 'package:flutter/material.dart';

import '../core/ui/page_scaffold.dart';
import '../core/ui/preview.dart';

@Preview('Menú · Grupo (iPhone + Desktop)')
Widget previewMenuGrupoCompareMock() => previewCompare(
      title: 'Menú · Grupo',
      iphone: const _MenuGrupoMock(),
      desktop: const _MenuGrupoMock(),
    );

@Preview('Menú · Suscripciones (iPhone + Desktop)')
Widget previewMenuSuscripcionesCompareMock() => previewCompare(
      title: 'Menú · Suscripciones',
      iphone: const _MenuSuscripcionesMock(),
      desktop: const _MenuSuscripcionesMock(),
    );

@Preview('Menú · Admin (iPhone + Desktop)')
Widget previewMenuAdminCompareMock() => previewCompare(
      title: 'Menú · Admin',
      iphone: const _MenuAdminMock(),
      desktop: const _MenuAdminMock(),
    );

@Preview('Menú · Comunidad (iPhone + Desktop)')
Widget previewMenuComunidadCompareMock() => previewCompare(
      title: 'Menú · Comunidad',
      iphone: const _MenuComunidadMock(),
      desktop: const _MenuComunidadMock(),
    );

@Preview('Menú · Cambiar Alias (iPhone + Desktop)')
Widget previewMenuCambiarAliasCompareMock() => previewCompare(
      title: 'Menú · Cambiar Alias',
      iphone: const _MenuCambiarAliasMock(),
      desktop: const _MenuCambiarAliasMock(),
    );

class _MenuGrupoMock extends StatelessWidget {
  const _MenuGrupoMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Mi grupo',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Card(
            child: ListTile(
              title: Text('Nombre del grupo'),
              subtitle: Text('Roller Santa Fe (mock)'),
            ),
          ),
          const Card(
            child: ListTile(
              title: Text('Integrantes'),
              subtitle: Text('sacx2003@gmail.com, roller@roller.com, lider@roller.com, ...'),
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: () {}, child: const Text('Invitar integrante')),
        ],
      ),
    );
  }
}

class _MenuSuscripcionesMock extends StatelessWidget {
  const _MenuSuscripcionesMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Mis suscripciones',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: const [
          Card(
            child: ListTile(
              title: Text('Plan Pro'),
              subtitle: Text('Renovación: 2026-05-15 · Estado: Activa'),
              trailing: Icon(Icons.check_circle_outline_rounded),
            ),
          ),
          Card(
            child: ListTile(
              title: Text('Recap 15s'),
              subtitle: Text('Comprado: 2026-04-01 · Uso: 1/3'),
              trailing: Icon(Icons.movie_outlined),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuAdminMock extends StatelessWidget {
  const _MenuAdminMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Admin',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: const [
          Card(child: ListTile(leading: Icon(Icons.people_alt_outlined), title: Text('Usuarios'))),
          Card(child: ListTile(leading: Icon(Icons.chat_outlined), title: Text('Chats (Admin)'))),
          Card(child: ListTile(leading: Icon(Icons.sell_outlined), title: Text('Ventas generales'))),
          Card(child: ListTile(leading: Icon(Icons.support_agent_outlined), title: Text('Buzón'))),
        ],
      ),
    );
  }
}

class _MenuComunidadMock extends StatelessWidget {
  const _MenuComunidadMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Comunidad',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Publicaciones',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 10),
          ...List.generate(
            4,
            (i) => Card(
              child: ListTile(
                leading: const Icon(Icons.forum_outlined),
                title: Text('Post #${i + 1}'),
                subtitle: const Text(
                  'Texto de ejemplo con varias líneas para validar espaciados y legibilidad en el estilo oscuro.',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuCambiarAliasMock extends StatelessWidget {
  const _MenuCambiarAliasMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Cambiar alias',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(decoration: InputDecoration(labelText: 'Alias', hintText: 'MiAlias_2026')),
          const SizedBox(height: 12),
          SizedBox(height: 50, child: ElevatedButton(onPressed: () {}, child: const Text('Guardar'))),
          const SizedBox(height: 10),
          const Text(
            'Reglas: máximo 100 caracteres; letras, números, espacios, guión y guión bajo.',
            style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.70)),
          ),
        ],
      ),
    );
  }
}

