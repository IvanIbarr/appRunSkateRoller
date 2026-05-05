import 'package:flutter/material.dart';

import '../core/ui/page_scaffold.dart';
import '../core/ui/preview.dart';

@Preview('Chat · iPhone + Desktop (Mock)')
Widget previewChatCompareMock() => previewCompare(
      title: 'Chat · iPhone vs Desktop',
      iphone: const _ChatMock(),
      desktop: const _ChatMock(),
    );

class _ChatMock extends StatelessWidget {
  const _ChatMock();

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
      (
        isMe: true,
        user: 'sacx2003@gmail.com',
        text: 'OK.',
      ),
    ];

    return PageScaffold(
      title: 'Chat',
      maxWidth: 980,
      child: SizedBox(
        height: 620,
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Refrescar'),
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: messages.length,
                itemBuilder: (context, i) {
                  final m = messages[i];
                  final bubbleColor = m.isMe
                      ? const Color.fromRGBO(255, 62, 165, 0.24)
                      : const Color.fromRGBO(2, 6, 23, 0.58);
                  final align = m.isMe ? Alignment.centerRight : Alignment.centerLeft;
                  final radius = BorderRadius.only(
                    topLeft: const Radius.circular(16),
                    topRight: const Radius.circular(16),
                    bottomLeft: Radius.circular(m.isMe ? 16 : 6),
                    bottomRight: Radius.circular(m.isMe ? 6 : 16),
                  );
                  return Align(
                    alignment: align,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      constraints: const BoxConstraints(maxWidth: 520),
                      decoration: BoxDecoration(
                        color: bubbleColor,
                        borderRadius: radius,
                        border: Border.all(
                          color: m.isMe
                              ? const Color.fromRGBO(255, 62, 165, 0.25)
                              : const Color.fromRGBO(226, 232, 240, 0.12),
                        ),
                        boxShadow: const [
                          BoxShadow(
                            color: Color.fromRGBO(0, 0, 0, 0.25),
                            blurRadius: 12,
                            offset: Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  m.user,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context)
                                      .textTheme
                                      .labelSmall
                                      ?.copyWith(fontWeight: FontWeight.w800, color: Colors.white),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                '09:41',
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                      color: const Color.fromRGBO(226, 232, 240, 0.70),
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            m.text,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: const Color.fromRGBO(248, 250, 252, 0.92),
                                  height: 1.25,
                                ),
                          ),
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

