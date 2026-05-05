import 'package:flutter/material.dart';

import 'chat_thread_screen.dart';

/// Pestaña **Chat** del shell: mismo UI que RN `ChatThread.tsx` vía [ChatRnThreadColumn].
class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ChatThreadScreen(chatType: 'general', shellEmbedded: true);
  }
}
