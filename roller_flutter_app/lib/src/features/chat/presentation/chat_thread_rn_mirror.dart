// Calco visual de `appRunSkateRoller/src/components/ChatThread.tsx` (StyleSheet.create).
// Sin Card/ListTile: solo valores del StyleSheet RN.

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/api_config.dart';
import 'chat_rn_media_widgets.dart';

/// Modelo mínimo para pintar un mensaje como en RN.
enum ChatRnSendState { sending, sent }

class ChatRnMessageVm {
  const ChatRnMessageVm({
    required this.id,
    required this.userId,
    required this.userName,
    required this.text,
    this.userEmail,
    this.timestamp,
    this.attachmentUrl,
    this.attachmentType,
    this.sendState,
  });

  final String id;
  final String userId;
  final String userName;
  final String text;
  final String? userEmail;
  final DateTime? timestamp;
  final String? attachmentUrl;
  final String? attachmentType;
  /// Solo aplica a mensajes propios: relojito/check.
  final ChatRnSendState? sendState;
}

abstract final class ChatRnTokens {
  static Color accentGeneral() => const Color(0xFF007AFF);
  static Color accentStaff() => const Color(0xFF34C759);

  // messageContainer
  static const Color bubbleOthersBg = Color.fromRGBO(2, 6, 23, 0.32);
  static const Color bubbleOthersBorder = Color.fromRGBO(226, 232, 240, 0.14);
  static const BorderRadius borderOthers = BorderRadius.only(
    topLeft: Radius.circular(8),
    topRight: Radius.circular(18),
    bottomLeft: Radius.circular(18),
    bottomRight: Radius.circular(18),
  );

  // ownMessageGeneral
  static const Color ownGeneralBg = Color.fromRGBO(56, 189, 248, 0.22);
  static const Color ownGeneralBorder = Color.fromRGBO(56, 189, 248, 0.38);
  static const BorderRadius borderOwnGeneral = BorderRadius.only(
    topLeft: Radius.circular(18),
    topRight: Radius.circular(8),
    bottomLeft: Radius.circular(18),
    bottomRight: Radius.circular(6),
  );

  // ownMessageStaff
  static const Color ownStaffBg = Color.fromRGBO(34, 197, 94, 0.18);
  static const Color ownStaffBorder = Color.fromRGBO(74, 222, 128, 0.32);

  // systemMessageContainer
  static const Color systemBg = Color.fromRGBO(15, 23, 42, 0.18);
  static const Color systemBorder = Color.fromRGBO(148, 163, 184, 0.5);

  static List<BoxShadow> shadowBubbleOthers() => const [
    BoxShadow(
      color: Color.fromRGBO(0, 0, 0, 0.22),
      offset: Offset(0, 8),
      blurRadius: 12,
    ),
  ];

  static List<BoxShadow> shadowSystem() => const [
    BoxShadow(
      color: Color.fromRGBO(0, 0, 0, 0.15),
      offset: Offset(0, 6),
      blurRadius: 10,
    ),
  ];

  static TextStyle userName({bool own = false}) => GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.2,
    color: own
        ? const Color.fromRGBO(226, 232, 240, 0.95)
        : const Color.fromRGBO(226, 232, 240, 0.90),
  );

  static TextStyle messageBody({bool own = false, bool system = false}) {
    if (system) {
      return GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        height: 21 / 16,
        color: const Color(0xFFE2E8F0),
      );
    }
    return GoogleFonts.inter(
      fontSize: 16,
      height: 21 / 16,
      color: own
          ? const Color(0xFFF8FAFC)
          : const Color.fromRGBO(248, 250, 252, 0.96),
    );
  }

  static TextStyle timestamp({required bool own, required bool staff}) {
    if (own && staff) {
      return GoogleFonts.inter(
        fontSize: 10,
        color: const Color.fromRGBO(240, 253, 244, 0.9),
      );
    }
    if (own) {
      return GoogleFonts.inter(fontSize: 10, color: const Color(0xFFBFDBFE));
    }
    return GoogleFonts.inter(
      fontSize: 10,
      color: const Color.fromRGBO(226, 232, 240, 0.72),
    );
  }

  static BoxDecoration timestampChip({required bool own, required bool staff}) {
    if (own && staff) {
      return const BoxDecoration(
        color: Color.fromRGBO(15, 23, 42, 0.25),
        borderRadius: BorderRadius.all(Radius.circular(10)),
      );
    }
    if (own) {
      return const BoxDecoration(
        color: Color.fromRGBO(15, 23, 42, 0.25),
        borderRadius: BorderRadius.all(Radius.circular(10)),
      );
    }
    return const BoxDecoration(
      color: Color.fromRGBO(2, 6, 23, 0.20),
      borderRadius: BorderRadius.all(Radius.circular(10)),
    );
  }
}

String chatRnFormatTime(DateTime? d) {
  if (d == null) return '';
  final h = d.hour.toString().padLeft(2, '0');
  final m = d.minute.toString().padLeft(2, '0');
  return '$h:$m';
}

/// Métricas respecto al ancho del contenedor unificado (tabs + lista + input).
class ChatRnLayoutMetrics {
  ChatRnLayoutMetrics({
    required BoxConstraints constraints,
    required Size screen,
  }) {
    contentWidth = constraints.maxWidth.isFinite && constraints.maxWidth > 0
        ? constraints.maxWidth
        : screen.width;
    isCompact = contentWidth < 600;
    listPaddingH = isCompact ? 10.0 : 12.0;
    inputPaddingH = listPaddingH;
    innerWidth = math.max(0, contentWidth - listPaddingH * 2);

    var bubble = innerWidth > 0 ? innerWidth * 0.82 : 280.0;
    var media = innerWidth > 0 ? innerWidth * 0.78 : 240.0;
    final mediaH = isCompact ? 240.0 : 260.0;

    media = math.min(media, math.max(120.0, bubble - 28));
    maxBubbleWidth = bubble;
    mediaMaxWidth = media;
    mediaMaxHeight = mediaH;
    mediaCardHeight = math.min(
      mediaMaxHeight,
      math.max(160.0, mediaMaxWidth * 0.62),
    );
  }

  late final double contentWidth;
  late final bool isCompact;
  late final double listPaddingH;
  late final double inputPaddingH;
  late final double innerWidth;
  late final double maxBubbleWidth;
  late final double mediaMaxWidth;
  late final double mediaMaxHeight;
  late final double mediaCardHeight;
}

class ChatRnMessageBubble extends StatelessWidget {
  const ChatRnMessageBubble({
    super.key,
    required this.msg,
    required this.isStaffChat,
    required this.isOwn,
    required this.maxBubbleWidth,
    required this.mediaMaxWidth,
    required this.mediaMaxHeight,
  });

  final ChatRnMessageVm msg;
  final bool isStaffChat;
  final bool isOwn;
  final double maxBubbleWidth;
  final double mediaMaxWidth;
  final double mediaMaxHeight;

  bool get _system => msg.userId == 'system';

  @override
  Widget build(BuildContext context) {
    if (_system) {
      return Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxBubbleWidth * (0.90 / 0.88)),
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: ChatRnTokens.systemBg,
              borderRadius: ChatRnTokens.borderOthers,
              border: Border.all(color: ChatRnTokens.systemBorder),
              boxShadow: ChatRnTokens.shadowSystem(),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (msg.text.trim().isNotEmpty)
                  Text(
                    msg.text,
                    textAlign: TextAlign.center,
                    style: ChatRnTokens.messageBody(system: true),
                  ),
                if (msg.timestamp != null) ...[
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment.centerRight,
                    child: DecoratedBox(
                      decoration: ChatRnTokens.timestampChip(
                        own: false,
                        staff: false,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        child: Text(
                          chatRnFormatTime(msg.timestamp),
                          style: ChatRnTokens.timestamp(
                            own: false,
                            staff: false,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    final mediaUri = ApiConfig.resolveMediaUrl(msg.attachmentUrl);

    final bubbleDecoration = () {
      if (isOwn) {
        final bg = isStaffChat
            ? ChatRnTokens.ownStaffBg
            : ChatRnTokens.ownGeneralBg;
        final border = isStaffChat
            ? ChatRnTokens.ownStaffBorder
            : ChatRnTokens.ownGeneralBorder;
        return BoxDecoration(
          color: bg,
          borderRadius: ChatRnTokens.borderOwnGeneral,
          border: Border.all(color: border),
          boxShadow: ChatRnTokens.shadowBubbleOthers(),
        );
      }
      return BoxDecoration(
        color: ChatRnTokens.bubbleOthersBg,
        borderRadius: ChatRnTokens.borderOthers,
        border: Border.all(color: ChatRnTokens.bubbleOthersBorder),
        boxShadow: ChatRnTokens.shadowBubbleOthers(),
      );
    }();

    final mediaW = mediaMaxWidth;
    final mediaH = mediaMaxHeight;

    final bubble = ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxBubbleWidth),
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: bubbleDecoration,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color.fromRGBO(226, 232, 240, 0.16),
                      border: Border.all(
                        width: 2,
                        color: isOwn
                            ? const Color.fromRGBO(251, 191, 36, 0.95)
                            : (isStaffChat
                                  ? const Color.fromRGBO(34, 197, 94, 0.95)
                                  : const Color.fromRGBO(56, 189, 248, 0.95)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isOwn ? 'Tú' : msg.userName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: ChatRnTokens.userName(own: isOwn),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              if (msg.attachmentType == 'image' && mediaUri.isNotEmpty) ...[
                Align(
                  alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
                  child: _ChatRnMediaCard(
                    width: mediaW,
                    height: mediaH,
                    child: ChatRnMessageNetworkImage(
                      messageId: msg.id,
                      url: mediaUri,
                      width: mediaW,
                      height: mediaH,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
              if (msg.attachmentType == 'video' && mediaUri.isNotEmpty) ...[
                Align(
                  alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
                  child: _ChatRnMediaCard(
                    width: mediaW,
                    height: math.min(mediaH, 220.0),
                    child: ChatRnMessageNetworkVideo(
                      messageId: msg.id,
                      url: mediaUri,
                      width: mediaW,
                      height: math.min(mediaH, 220.0),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
              if (msg.text.trim().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    msg.text,
                    style: ChatRnTokens.messageBody(own: isOwn),
                  ),
                ),
              Align(
                alignment: Alignment.centerRight,
                child: DecoratedBox(
                  decoration: ChatRnTokens.timestampChip(
                    own: isOwn,
                    staff: isStaffChat && isOwn,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          chatRnFormatTime(msg.timestamp),
                          style: ChatRnTokens.timestamp(
                            own: isOwn,
                            staff: isStaffChat && isOwn,
                          ),
                        ),
                        if (isOwn && msg.sendState != null) ...[
                          const SizedBox(width: 6),
                          Icon(
                            msg.sendState == ChatRnSendState.sending
                                ? Icons.schedule_rounded
                                : Icons.check_rounded,
                            size: 12,
                            color: (isStaffChat && isOwn)
                                ? const Color.fromRGBO(240, 253, 244, 0.9)
                                : (isOwn ? const Color(0xFFBFDBFE) : const Color.fromRGBO(226, 232, 240, 0.72)),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );

    return SizedBox(
      width: double.infinity,
      child: Align(
        alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
        child: bubble,
      ),
    );
  }
}

class _ChatRnMediaCard extends StatelessWidget {
  const _ChatRnMediaCard({
    required this.width,
    required this.height,
    required this.child,
  });

  final double width;
  final double height;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: width,
        height: height,
        child: ColoredBox(
          color: const Color.fromRGBO(15, 23, 42, 0.2),
          child: child,
        ),
      ),
    );
  }
}

class ChatRnPendingBar extends StatelessWidget {
  const ChatRnPendingBar({
    super.key,
    required this.isVideo,
    required this.thumbUrl,
    required this.onClear,
  });

  final bool isVideo;
  final String? thumbUrl;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: Color.fromRGBO(30, 41, 59, 0.95),
        border: Border(
          top: BorderSide(
            width: 0.5,
            color: Color.fromRGBO(255, 255, 255, 0.12),
          ),
        ),
      ),
      child: Row(
        children: [
          if (!isVideo && thumbUrl != null && thumbUrl!.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                ApiConfig.resolveMediaUrl(thumbUrl),
                width: 48,
                height: 48,
                fit: BoxFit.cover,
                errorBuilder: (context, error, _) {
                  debugPrint('MEDIA IMAGE ERROR (pending): $error');
                  return _pendingPlaceholder(isVideo);
                },
              ),
            )
          else
            _pendingPlaceholder(isVideo),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isVideo ? 'Video listo' : 'Imagen lista',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(
                color: const Color(0xFFE2E8F0),
                fontSize: 14,
              ),
            ),
          ),
          GestureDetector(
            onTap: onClear,
            child: Text(
              'Quitar',
              style: GoogleFonts.inter(
                color: const Color(0xFF93C5FD),
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pendingPlaceholder(bool video) {
    if (video) {
      return const Text('🎬', style: TextStyle(fontSize: 28));
    }
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: const Color(0xFF334155),
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: const Text('🖼', style: TextStyle(fontSize: 28)),
    );
  }
}

class ChatRnInputOuter extends StatelessWidget {
  const ChatRnInputOuter({
    super.key,
    required this.isStaffChat,
    required this.controller,
    required this.onImage,
    required this.onVideo,
    required this.onEmoji,
    required this.onSend,
    required this.canSend,
    required this.sending,
    required this.uploading,
  });

  final bool isStaffChat;
  final TextEditingController controller;
  final VoidCallback onImage;
  final VoidCallback onVideo;
  final VoidCallback onEmoji;
  final VoidCallback onSend;
  final bool canSend;
  final bool sending;
  final bool uploading;

  Color get _accent =>
      isStaffChat ? ChatRnTokens.accentStaff() : ChatRnTokens.accentGeneral();

  @override
  Widget build(BuildContext context) {
    final hint = sending
        ? 'Enviando… (si la red va lento, esto es normal)'
        : uploading
        ? 'Subiendo archivo…'
        : null;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 6, bottom: 4),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(2, 6, 23, 0.62),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color.fromRGBO(226, 232, 240, 0.16)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.22),
            offset: Offset(0, 10),
            blurRadius: 18,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _RnAttachButton(emoji: '🖼', onTap: uploading ? null : onImage),
                _RnAttachButton(emoji: '🎬', onTap: uploading ? null : onVideo),
                Expanded(
                  child: Container(
                    margin: const EdgeInsets.only(right: 6),
                    padding: const EdgeInsets.only(left: 6, right: 10),
                    decoration: BoxDecoration(
                      color: const Color.fromRGBO(226, 232, 240, 0.10),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color.fromRGBO(226, 232, 240, 0.14),
                      ),
                    ),
                    child: Row(
                      children: [
                        _RnEmojiInline(onTap: uploading ? null : onEmoji),
                        Expanded(
                          child: TextField(
                            controller: controller,
                            enabled: !sending && !uploading,
                            minLines: 1,
                            maxLines: 5,
                            maxLength: 1000,
                            maxLengthEnforcement: MaxLengthEnforcement.enforced,
                            textInputAction: TextInputAction.send,
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              color: const Color.fromRGBO(248, 250, 252, 0.96),
                            ),
                            cursorColor: _accent,
                            decoration: const InputDecoration(
                              isDense: true,
                              border: InputBorder.none,
                              hintText: 'Mensaje…',
                              hintStyle: TextStyle(color: Color(0xFF94A3B8)),
                              counterText: '',
                              contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                            ),
                            onSubmitted: canSend ? (_) => onSend() : null,
                            onTapOutside: (_) =>
                                FocusScope.of(context).unfocus(),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                _RnSendButton(
                  accent: _accent,
                  canSend: canSend,
                  sending: sending,
                  onSend: onSend,
                ),
              ],
            ),
          ),
          if (hint != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: Text(
                hint,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: const Color.fromRGBO(148, 163, 184, 0.95),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _RnAttachButton extends StatelessWidget {
  const _RnAttachButton({required this.emoji, required this.onTap});

  final String emoji;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(19),
          child: Ink(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: const Color.fromRGBO(226, 232, 240, 0.10),
              borderRadius: BorderRadius.circular(19),
              border: Border.all(
                color: const Color.fromRGBO(226, 232, 240, 0.14),
              ),
            ),
            child: Center(
              child: Text(emoji, style: const TextStyle(fontSize: 20)),
            ),
          ),
        ),
      ),
    );
  }
}

class _RnEmojiInline extends StatelessWidget {
  const _RnEmojiInline({required this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(17),
          child: Ink(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: const Color.fromRGBO(226, 232, 240, 0.10),
              borderRadius: BorderRadius.circular(17),
              border: Border.all(
                color: const Color.fromRGBO(226, 232, 240, 0.14),
              ),
            ),
            child: const Center(
              child: Text('😀', style: TextStyle(fontSize: 24)),
            ),
          ),
        ),
      ),
    );
  }
}

class _RnSendButton extends StatelessWidget {
  const _RnSendButton({
    required this.accent,
    required this.canSend,
    required this.sending,
    required this.onSend,
  });

  final Color accent;
  final bool canSend;
  final bool sending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: canSend ? onSend : null,
        borderRadius: BorderRadius.circular(21),
        child: Ink(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: canSend ? accent : const Color(0xFFCCCCCC),
            borderRadius: BorderRadius.circular(21),
          ),
          child: Center(
            child: sending
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    '➤',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

/// Modal de emojis como `EmojiPicker.tsx` (fondo blanco, radios 20).
Future<void> showChatRnEmojiPickerModal({
  required BuildContext context,
  required void Function(String emoji) onSelect,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      return Padding(
        padding: EdgeInsets.only(top: MediaQuery.of(ctx).size.height * 0.3),
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xFFFFFFFF),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [
              BoxShadow(
                color: Color.fromRGBO(0, 0, 0, 0.2),
                blurRadius: 40,
                offset: Offset(0, -4),
              ),
            ],
          ),
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.7,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.max,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFE0E0E0))),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Seleccionar Emoji',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF333333),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(ctx),
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0F0F0),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '✕',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            color: const Color(0xFF666666),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: _EmojiPickerRnBody(
                    onPick: (e) {
                      onSelect(e);
                      Navigator.pop(ctx);
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

class _EmojiPickerRnBody extends StatelessWidget {
  const _EmojiPickerRnBody({required this.onPick});

  final void Function(String emoji) onPick;

  static const _caras = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
    '😎',
    '🤩',
    '🥳',
    '😏',
    '😒',
    '😞',
    '😔',
    '😟',
    '😕',
    '🙁',
    '☹️',
    '😣',
    '😖',
    '😫',
    '😩',
    '🥺',
    '😢',
    '😭',
    '😤',
    '😠',
    '😡',
    '🤬',
    '🤯',
    '😳',
    '🥵',
    '🥶',
    '😱',
    '😨',
    '😰',
    '😥',
    '😓',
  ];
  static const _gestos = [
    '👋',
    '🤚',
    '🖐',
    '✋',
    '🖖',
    '👌',
    '🤏',
    '✌️',
    '🤞',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '👍',
    '👎',
    '✊',
    '👊',
    '🤛',
    '🤜',
    '👏',
    '🙌',
    '👐',
    '🤲',
    '🤝',
    '🙏',
    '✍️',
    '💪',
    '🦵',
    '🦶',
    '👂',
    '🦻',
    '👃',
  ];
  static const _deportes = [
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
    '🏏',
    '🥅',
    '⛳',
    '🏹',
    '🎣',
    '🥊',
    '🥋',
    '🎽',
    '🛹',
    '🛷',
    '⛸',
    '🥌',
    '🎿',
    '⛷',
    '🏂',
    '🏋️',
    '🤼',
    '🤸',
    '🤺',
    '🤾',
    '🤹',
    '🧘',
    '🏄',
    '🏊',
    '🤽',
  ];
  static const _simbolos = [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '💟',
    '☮️',
    '✝️',
    '☪️',
    '🕉',
    '☸️',
    '✡️',
    '🔯',
    '🕎',
    '☯️',
    '☦️',
    '🛐',
    '⛎',
    '♈',
    '♉',
    '♊',
    '♋',
    '♌',
    '♍',
    '♎',
    '♏',
    '♐',
    '♑',
    '♒',
    '♓',
    '🆔',
    '⚛️',
    '🉑',
    '☢️',
    '☣️',
  ];

  @override
  Widget build(BuildContext context) {
    Widget section(String title, List<String> emojis) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF666666),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 0,
              runSpacing: 0,
              children: [
                for (final e in emojis)
                  Padding(
                    padding: const EdgeInsets.only(right: 8, bottom: 8),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () => onPick(e),
                        child: SizedBox(
                          width: 44,
                          height: 44,
                          child: Center(
                            child: Text(
                              e,
                              style: const TextStyle(fontSize: 28),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        section('Caras', _caras),
        section('Gestos', _gestos),
        section('Deportes', _deportes),
        section('Simbolos', _simbolos),
      ],
    );
  }
}

/// Cuerpo del hilo: lista + barra pendiente + input (estructura RN).
/// [childAboveList] opcional (p. ej. botón refrescar) fuera del scroll de mensajes.
class ChatRnThreadColumn extends StatelessWidget {
  const ChatRnThreadColumn({
    super.key,
    required this.isStaffChat,
    required this.scrollController,
    required this.messages,
    required this.resolveOwn,
    required this.showPendingBar,
    required this.pendingIsVideo,
    required this.pendingThumbUrl,
    required this.onClearPending,
    required this.inputController,
    required this.onImage,
    required this.onVideo,
    required this.onEmoji,
    required this.onSend,
    required this.canSend,
    required this.sending,
    required this.uploading,
    this.onRefresh,
    this.childAboveList,
  });

  final bool isStaffChat;
  final ScrollController scrollController;
  final List<ChatRnMessageVm> messages;
  final bool Function(ChatRnMessageVm m) resolveOwn;
  final bool showPendingBar;
  final bool pendingIsVideo;
  final String? pendingThumbUrl;
  final VoidCallback onClearPending;
  final TextEditingController inputController;
  final VoidCallback onImage;
  final VoidCallback onVideo;
  final VoidCallback onEmoji;
  final VoidCallback onSend;
  final bool canSend;
  final bool sending;
  final bool uploading;
  final Future<void> Function()? onRefresh;
  final Widget? childAboveList;

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.sizeOf(context);

    return LayoutBuilder(
      builder: (context, constraints) {
        final layout = ChatRnLayoutMetrics(constraints: constraints, screen: mq);
        const listBottomPad = 12.0;
        final padH = layout.listPaddingH;

        Widget list;
        if (messages.isEmpty) {
          list = ListView(
            controller: scrollController,
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: EdgeInsets.fromLTRB(padH, 12, padH, listBottomPad),
            children: [
              if (childAboveList != null) ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: childAboveList,
                ),
              ],
              Padding(
                padding: const EdgeInsets.only(top: 24),
                child: Text(
                  'Sin mensajes todavía',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    color: const Color(0xFF94A3B8),
                  ),
                ),
              ),
            ],
          );
        } else {
          list = ListView.builder(
            controller: scrollController,
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: EdgeInsets.fromLTRB(padH, 12, padH, listBottomPad),
            itemCount: messages.length + (childAboveList != null ? 1 : 0),
            itemBuilder: (context, i) {
              if (childAboveList != null && i == 0) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: childAboveList,
                );
              }
              final idx = childAboveList != null ? i - 1 : i;
              final m = messages[idx];
              final own = resolveOwn(m);
              return ChatRnMessageBubble(
                msg: m,
                isStaffChat: isStaffChat,
                isOwn: own,
                maxBubbleWidth: layout.maxBubbleWidth,
                mediaMaxWidth: layout.mediaMaxWidth,
                mediaMaxHeight: layout.mediaCardHeight,
              );
            },
          );
        }

        if (onRefresh != null) {
          list = RefreshIndicator(onRefresh: onRefresh!, child: list);
        }

        final composer = Padding(
          padding: EdgeInsets.fromLTRB(
            layout.inputPaddingH,
            6,
            layout.inputPaddingH,
            MediaQuery.viewInsetsOf(context).bottom + 8,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (showPendingBar)
                ChatRnPendingBar(
                  isVideo: pendingIsVideo,
                  thumbUrl: pendingThumbUrl,
                  onClear: onClearPending,
                ),
              ChatRnInputOuter(
                isStaffChat: isStaffChat,
                controller: inputController,
                onImage: onImage,
                onVideo: onVideo,
                onEmoji: onEmoji,
                onSend: onSend,
                canSend: canSend,
                sending: sending,
                uploading: uploading,
              ),
            ],
          ),
        );

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: list),
            composer,
          ],
        );
      },
    );
  }
}

class ChatRnLoading extends StatelessWidget {
  const ChatRnLoading({super.key, required this.isStaff});

  final bool isStaff;

  @override
  Widget build(BuildContext context) {
    final accent = isStaff
        ? ChatRnTokens.accentStaff()
        : ChatRnTokens.accentGeneral();
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 36,
            height: 36,
            child: CircularProgressIndicator(color: accent, strokeWidth: 3),
          ),
          const SizedBox(height: 10),
          Text(
            'Cargando mensajes...',
            style: GoogleFonts.inter(
              fontSize: 16,
              color: const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }
}
