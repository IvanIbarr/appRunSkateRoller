import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_config.dart';
import '../../../core/ui/app_theme.dart';
import '../../perfil/data/perfil_repository.dart';
import '../data/chat_repository.dart';
import 'chat_thread_rn_mirror.dart';

final _meProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  try {
    return await ref.watch(perfilRepositoryProvider).me();
  } catch (_) {
    return null;
  }
});

final chatThreadMessagesProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((ref, chatType) async {
  return ref.watch(chatRepositoryProvider).getMessages(chatType: chatType);
});

class ChatThreadScreen extends ConsumerStatefulWidget {
  const ChatThreadScreen({super.key, required this.chatType, this.shellEmbedded = false});
  final String chatType; // general | staff
  /// Sin AppBar ni botón atrás (p. ej. pestaña Chat del shell).
  final bool shellEmbedded;

  @override
  ConsumerState<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends ConsumerState<ChatThreadScreen> {
  final _textCtrl = TextEditingController();
  final _scroll = ScrollController();
  bool _sending = false;

  String? _pendingMediaUrl;
  String? _pendingMediaType;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _textCtrl.addListener(() => setState(() {}));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.invalidate(chatThreadMessagesProvider(widget.chatType));
    });
  }

  @override
  void dispose() {
    _textCtrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  DateTime? _parseTs(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    return DateTime.tryParse(v.toString());
  }

  List<ChatRnMessageVm> _mapMessages(List<Map<String, dynamic>> items) {
    return items
        .map(
          (it) => ChatRnMessageVm(
            id: (it['id'] ?? '').toString(),
            userId: (it['userId'] ?? '').toString(),
            userName: (it['userName'] ?? 'Usuario').toString(),
            text: (it['text'] ?? '').toString(),
            userEmail: () {
              final e = (it['userEmail'] ?? '').toString();
              return e.isEmpty ? null : e;
            }(),
            timestamp: _parseTs(it['timestamp']),
            attachmentUrl: () {
              final u = (it['attachmentUrl'] ?? it['mediaUrl'] ?? '').toString();
              return u.isEmpty ? null : u;
            }(),
            attachmentType: () {
              final t = (it['attachmentType'] ?? it['mediaType'] ?? '').toString();
              return t.isEmpty ? null : t;
            }(),
          ),
        )
        .toList();
  }

  bool _resolveOwn(ChatRnMessageVm m, String myId, String myEmail) {
    if (m.userId == 'system') return false;
    final msgEmail = (m.userEmail ?? '').toLowerCase();
    final msgUserId = m.userId;
    if (myId.isNotEmpty && msgUserId == myId) return true;
    if (myEmail.isNotEmpty && msgEmail.isNotEmpty && msgEmail == myEmail) return true;
    return false;
  }

  Future<void> _uploadFile(PlatformFile file) async {
    setState(() => _uploading = true);
    try {
      final up = await ref.read(chatRepositoryProvider).uploadMedia(file);
      debugPrint(
        'CHAT UPLOAD ok url=${up.url} mediaType=${up.mediaType} '
        'resolved=${ApiConfig.resolveMediaUrl(up.url)} name=${file.name}',
      );
      setState(() {
        _pendingMediaUrl = up.url;
        _pendingMediaType = up.mediaType;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('No se pudo subir: $e')));
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _pickImage() async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
      withData: kIsWeb,
    );
    final file = res?.files.firstOrNull;
    if (file == null) return;
    await _uploadFile(file);
  }

  Future<void> _pickVideo() async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.video,
      allowMultiple: false,
      withData: kIsWeb,
    );
    final file = res?.files.firstOrNull;
    if (file == null) return;
    await _uploadFile(file);
  }

  Future<void> _send() async {
    final text = _textCtrl.text.trim();
    if (text.isEmpty && _pendingMediaUrl == null) return;
    setState(() => _sending = true);
    try {
      await ref.read(chatRepositoryProvider).sendMessage(
            chatType: widget.chatType,
            text: text,
            mediaUrl: _pendingMediaUrl,
            mediaType: _pendingMediaType,
          );
      _textCtrl.clear();
      setState(() {
        _pendingMediaUrl = null;
        _pendingMediaType = null;
      });
      ref.invalidate(chatThreadMessagesProvider(widget.chatType));
    } catch (e) {
      if (mounted) {
        final msg = e.toString().replaceFirst('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg.length > 120 ? '${msg.substring(0, 120)}…' : msg)),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  String? _pendingThumbResolved() {
    final u = _pendingMediaUrl;
    if (u == null || u.isEmpty) return null;
    if (_pendingMediaType != 'image') return null;
    return ApiConfig.resolveMediaUrl(u);
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(_meProvider).valueOrNull;
    final myEmail = (me?['email'] ?? '').toString().toLowerCase();
    final myId = (me?['id'] ?? '').toString();
    final async = ref.watch(chatThreadMessagesProvider(widget.chatType));
    final isStaff = widget.chatType == 'staff';

    ref.listen<AsyncValue<List<Map<String, dynamic>>>>(
      chatThreadMessagesProvider(widget.chatType),
      (prev, next) {
        next.whenData((_) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!_scroll.hasClients) return;
            _scroll.jumpTo(_scroll.position.maxScrollExtent);
          });
        });
      },
    );

    final hasReady = _pendingMediaUrl != null && _pendingMediaUrl!.isNotEmpty;
    final canSend = !_sending && !_uploading && (_textCtrl.text.trim().isNotEmpty || hasReady);

    Widget threadContent(AsyncValue<List<Map<String, dynamic>>> async) {
      return async.when(
        skipLoadingOnReload: true,
        data: (items) {
          final msgs = _mapMessages(items);
          return ChatRnThreadColumn(
            isStaffChat: isStaff,
            scrollController: _scroll,
            messages: msgs,
            resolveOwn: (m) => _resolveOwn(m, myId, myEmail),
            showPendingBar: _pendingMediaUrl != null,
            pendingIsVideo: _pendingMediaType == 'video',
            pendingThumbUrl: _pendingThumbResolved(),
            onClearPending: () => setState(() {
              _pendingMediaUrl = null;
              _pendingMediaType = null;
            }),
            inputController: _textCtrl,
            onImage: _uploading ? () {} : _pickImage,
            onVideo: _uploading ? () {} : _pickVideo,
            onEmoji: () {
              showChatRnEmojiPickerModal(
                context: context,
                onSelect: (e) {
                  _textCtrl.text = '${_textCtrl.text}$e';
                  _textCtrl.selection = TextSelection.collapsed(offset: _textCtrl.text.length);
                  setState(() {});
                },
              );
            },
            onSend: _send,
            canSend: canSend,
            sending: _sending,
            uploading: _uploading,
            onRefresh: () async {
              ref.invalidate(chatThreadMessagesProvider(widget.chatType));
              await ref.read(chatThreadMessagesProvider(widget.chatType).future);
            },
            childAboveList: null,
          );
        },
        loading: () => ChatRnLoading(isStaff: isStaff),
        error: (e, st) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Error cargando chat: $e',
            style: TextStyle(color: Colors.red.shade200),
          ),
        ),
      );
    }

    if (widget.shellEmbedded) {
      return LayoutBuilder(
        builder: (context, constraints) {
          final h = constraints.maxHeight;
          final w = constraints.maxWidth;
          if (!h.isFinite || h <= 0 || !w.isFinite || w <= 0) {
            return const SizedBox.shrink();
          }
          return SizedBox(
            width: w,
            height: h,
            child: threadContent(async),
          );
        },
      );
    }

    final body = SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(child: threadContent(async)),
        ],
      ),
    );
    return Scaffold(
      backgroundColor: AppTheme.bg,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: Text(isStaff ? 'Chat staff' : 'Chat general'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () {
            if (context.canPop()) context.pop();
          },
        ),
      ),
      body: body,
    );
  }
}
