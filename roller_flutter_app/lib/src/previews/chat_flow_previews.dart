import 'package:flutter/material.dart';

import '../core/ui/app_theme.dart';
import '../core/ui/page_scaffold.dart';
import '../core/ui/preview.dart';
import '../features/chat/presentation/chat_thread_rn_mirror.dart';

@Preview('Chat · Thread (ChatThread.tsx 1:1) · Compare')
Widget previewChatThreadRnMirrorCompareMock() => previewCompare(
      title: 'Chat · Thread (RN 1:1)',
      iphone: const _ChatThreadRnMirrorPreviewFrame(isStaff: false),
      desktop: const _ChatThreadRnMirrorPreviewFrame(isStaff: false),
    );

@Preview('Chat · Lista de chats (iPhone + Desktop)')
Widget previewChatListCompareMock() => previewCompare(
      title: 'Chat · Lista',
      iphone: const _ChatListMock(),
      desktop: const _ChatListMock(),
    );

@Preview('Chat · Thread avanzado (emoji/adjunto UI)')
Widget previewChatAdvancedThreadCompareMock() => previewCompare(
      title: 'Chat · Thread avanzado',
      iphone: const _AdvancedThreadMock(),
      desktop: const _AdvancedThreadMock(),
    );

@Preview('Chat · Conversación (teclado cerrado)')
Widget previewChatDetailClosedCompareMock() => previewCompare(
      title: 'Chat · Conversación (cerrado)',
      iphone: const _ChatDetailMock(keyboardOpen: false),
      desktop: const _ChatDetailMock(keyboardOpen: false),
    );

@Preview('Chat · Conversación (teclado abierto)')
Widget previewChatDetailOpenCompareMock() => previewCompare(
      title: 'Chat · Conversación (abierto)',
      iphone: const _ChatDetailMock(keyboardOpen: true),
      desktop: const _ChatDetailMock(keyboardOpen: true),
    );

class _ChatListMock extends StatelessWidget {
  const _ChatListMock();

  @override
  Widget build(BuildContext context) {
    final items = const [
      (
        title: 'Chat general',
        subtitle: 'roller@roller.com: ¿Quién se apunta hoy a las 7pm en el parque?',
        unread: 2,
      ),
      (
        title: 'Staff',
        subtitle:
            'admin@roller.com: Recuerden validar el calendario y limpiar eventos viejos automáticamente.',
        unread: 0,
      ),
      (
        title: 'Roller Santa Fe (Grupo)',
        subtitle:
            'Usuario Con Nombre Extremadamente Largo Para Probar Overflows: Mensaje largo…',
        unread: 14,
      ),
    ];

    return PageScaffold(
      title: 'Chats',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Lista de chats',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
                ),
              ),
              TextButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Refrescar'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...items.map((it) {
            return Card(
              child: ListTile(
                leading: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color.fromRGBO(2, 6, 23, 0.62),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.14)),
                  ),
                  child: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFFE2E8F0), size: 20),
                ),
                title: Text(it.title, style: const TextStyle(fontWeight: FontWeight.w900)),
                subtitle: Text(
                  it.subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: it.unread > 0
                    ? Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color.fromRGBO(255, 62, 165, 0.22),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: const Color.fromRGBO(255, 62, 165, 0.35)),
                        ),
                        child: Text(
                          '${it.unread}',
                          style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      )
                    : const Icon(Icons.chevron_right_rounded),
                onTap: () {},
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _ChatDetailMock extends StatelessWidget {
  const _ChatDetailMock({required this.keyboardOpen});

  final bool keyboardOpen;

  @override
  Widget build(BuildContext context) {
    const messages = [
      (isMe: false, user: 'roller@roller.com', text: '¿Listos para rodar hoy?'),
      (
        isMe: true,
        user: 'sacx2003@gmail.com',
        text: 'Sí. Voy saliendo.\nLlevo agua y luces.',
      ),
      (
        isMe: false,
        user: 'Usuario Con Nombre Extremadamente Largo Para Probar Overflows',
        text:
            'Perfecto. Ruta sugerida: Parque → Reforma → Chapultepec. '
            'En móvil esto debe verse limpio, sin overflow y con buen contraste.',
      ),
      (isMe: true, user: 'sacx2003@gmail.com', text: 'Va.'),
    ];

    return PageScaffold(
      title: 'Chat · General',
      maxWidth: 980,
      child: SizedBox(
        height: 640,
        child: Stack(
          children: [
            Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: EdgeInsets.fromLTRB(0, 0, 0, keyboardOpen ? 260 : 0),
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
                                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                            fontWeight: FontWeight.w800,
                                            color: Colors.white,
                                          ),
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
            if (keyboardOpen)
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  height: 250,
                  decoration: BoxDecoration(
                    color: const Color.fromRGBO(2, 6, 23, 0.92),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.12)),
                    boxShadow: const [
                      BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.40), blurRadius: 20, offset: Offset(0, -10)),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'Teclado (mock)',
                      style: TextStyle(color: Color.fromRGBO(226, 232, 240, 0.70), fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _AdvancedThreadMock extends StatelessWidget {
  const _AdvancedThreadMock();

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Chat general (avanzado)',
      maxWidth: 980,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Card(
            child: ListTile(
              leading: Icon(Icons.image_rounded),
              title: Text('Adjunto listo (mock)', style: TextStyle(fontWeight: FontWeight.w900)),
              subtitle: Text('/uploads/chat/xxxx.jpg'),
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: ListView(
              reverse: true,
              children: const [
                _BubbleMock(isMe: true, user: 'sacx2003@gmail.com', text: 'Listo 😎🛼', hasAttach: true),
                _BubbleMock(isMe: false, user: 'roller@roller.com', text: 'Buenísimo. ¿Llevas luces? 🔥', hasAttach: false),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              IconButton(onPressed: null, icon: Icon(Icons.emoji_emotions_outlined)),
              IconButton(onPressed: null, icon: Icon(Icons.attach_file_rounded)),
              const Expanded(child: TextField(decoration: InputDecoration(hintText: 'Mensaje…'))),
              const SizedBox(width: 8),
              IconButton(onPressed: null, icon: Icon(Icons.send)),
            ],
          ),
          const SizedBox(height: 10),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(10),
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _EmojiCell('😀'),
                  _EmojiCell('🔥'),
                  _EmojiCell('🛼'),
                  _EmojiCell('📍'),
                  _EmojiCell('🎥'),
                  _EmojiCell('💙'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BubbleMock extends StatelessWidget {
  const _BubbleMock({required this.isMe, required this.user, required this.text, required this.hasAttach});
  final bool isMe;
  final String user;
  final String text;
  final bool hasAttach;

  @override
  Widget build(BuildContext context) {
    final bubbleColor = isMe
        ? const Color.fromRGBO(255, 62, 165, 0.24)
        : const Color.fromRGBO(2, 6, 23, 0.58);
    final radius = BorderRadius.only(
      topLeft: const Radius.circular(16),
      topRight: const Radius.circular(16),
      bottomLeft: Radius.circular(isMe ? 16 : 6),
      bottomRight: Radius.circular(isMe ? 6 : 16),
    );
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        constraints: const BoxConstraints(maxWidth: 520),
        decoration: BoxDecoration(
          color: bubbleColor,
          borderRadius: radius,
          border: Border.all(
            color: isMe ? const Color.fromRGBO(255, 62, 165, 0.25) : const Color.fromRGBO(226, 232, 240, 0.12),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              user,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w800, color: Colors.white),
            ),
            if (hasAttach) ...[
              const SizedBox(height: 8),
              Container(
                height: 140,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  color: const Color.fromRGBO(15, 23, 42, 0.30),
                  border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.12)),
                ),
                child: const Center(child: Icon(Icons.image_rounded)),
              ),
            ],
            const SizedBox(height: 8),
            Text(text, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color.fromRGBO(248, 250, 252, 0.92))),
          ],
        ),
      ),
    );
  }
}

class _EmojiCell extends StatelessWidget {
  const _EmojiCell(this.e);
  final String e;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 42,
      height: 42,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color.fromRGBO(15, 23, 42, 0.30),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.12)),
        ),
        child: Center(child: Text(e, style: const TextStyle(fontSize: 20))),
      ),
    );
  }
}

/// Preview del hilo con datos mock (misma capa visual que producción).
class _ChatThreadRnMirrorPreviewFrame extends StatefulWidget {
  const _ChatThreadRnMirrorPreviewFrame({required this.isStaff});
  final bool isStaff;

  @override
  State<_ChatThreadRnMirrorPreviewFrame> createState() => _ChatThreadRnMirrorPreviewFrameState();
}

class _ChatThreadRnMirrorPreviewFrameState extends State<_ChatThreadRnMirrorPreviewFrame> {
  late final ScrollController _scroll;
  late final TextEditingController _text;

  @override
  void initState() {
    super.initState();
    _scroll = ScrollController();
    _text = TextEditingController();
    _text.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _scroll.dispose();
    _text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final msgs = <ChatRnMessageVm>[
      ChatRnMessageVm(
        id: '1',
        userId: 'other',
        userName: 'roller@roller.com',
        text: '¿Listos para rodar hoy?',
        timestamp: DateTime(2025, 5, 4, 9, 41),
      ),
      ChatRnMessageVm(
        id: '2',
        userId: 'demo-me',
        userName: 'demo@mail.com',
        text: 'Sí. Voy saliendo.\nLlevo agua y luces.',
        timestamp: DateTime(2025, 5, 4, 9, 42),
      ),
      ChatRnMessageVm(
        id: '3',
        userId: 'system',
        userName: '',
        text: 'Recordatorio: respetar carriles y luces.',
        timestamp: DateTime(2025, 5, 4, 9, 43),
      ),
      ChatRnMessageVm(
        id: '4',
        userId: 'other2',
        userName: 'Usuario con nombre larguísimo para overflow',
        text: 'Perfecto. Ruta sugerida: Parque → Reforma → Chapultepec.',
        timestamp: DateTime(2025, 5, 4, 9, 44),
      ),
    ];

    final hasReady = _text.text.trim().isNotEmpty;
    final canSend = hasReady;

    return ColoredBox(
      color: AppTheme.bg,
      child: LayoutBuilder(
        builder: (context, cs) {
          return SizedBox(
            height: cs.maxHeight,
            width: cs.maxWidth,
            child: ChatRnThreadColumn(
              isStaffChat: widget.isStaff,
              scrollController: _scroll,
              messages: msgs,
              resolveOwn: (m) => m.userId == 'demo-me',
              showPendingBar: true,
              pendingIsVideo: false,
              pendingThumbUrl: null,
              onClearPending: () {},
              inputController: _text,
              onImage: () {},
              onVideo: () {},
              onEmoji: () {
                showChatRnEmojiPickerModal(
                  context: context,
                  onSelect: (e) {
                    _text.text = '${_text.text}$e';
                    _text.selection = TextSelection.collapsed(offset: _text.text.length);
                    setState(() {});
                  },
                );
              },
              onSend: () {},
              canSend: canSend,
              sending: false,
              uploading: false,
              onRefresh: () async {},
              childAboveList: null,
            ),
          );
        },
      ),
    );
  }
}
