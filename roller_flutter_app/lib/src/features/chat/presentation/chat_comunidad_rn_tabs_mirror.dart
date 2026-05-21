import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/ui/rn_shell_bottom_tab_bar.dart';
import 'chat_thread_rn_mirror.dart';

enum _ChatTab { general, staff }

/// Clearance inferior solo para /chat (no usar [RnBottomNavigationSlot.reservedBottomInset]).
/// El shell ya dibuja la bottom nav; aquí solo evitamos que el panel choque con ella.
double _chatBottomInset(BuildContext context) {
  final safeBottom = MediaQuery.paddingOf(context).bottom;
  final isMobile = MediaQuery.sizeOf(context).width < 600;
  if (isMobile) {
    return safeBottom + 14;
  }
  return safeBottom + 18;
}

/// Espejo estructural de `ComunidadScreen.tsx`: selector General/Staff + panes apilados.
/// Nota: para Preview usamos mock "usuario con grupo" => staff visible.
///
/// En la app real ([embedRnShell] false) pasar [generalPane] / [staffPane] con hilos conectados al API.
class ChatComunidadRnTabsMirror extends StatefulWidget {
  const ChatComunidadRnTabsMirror({
    super.key,
    this.canViewStaff = true,
    this.embedRnShell = true,
    this.staffLabel = 'Chat Staff',
    this.generalPane,
    this.staffPane,
  });

  final bool canViewStaff;
  final bool embedRnShell;
  /// RN: `nombreGrupo ? 'Chat Staff ${nombreGrupo}' : 'Chat Staff'`.
  final String staffLabel;
  final Widget? generalPane;
  final Widget? staffPane;

  @override
  State<ChatComunidadRnTabsMirror> createState() => _ChatComunidadRnTabsMirrorState();
}

class _ChatComunidadRnTabsMirrorState extends State<ChatComunidadRnTabsMirror> {
  _ChatTab _active = _ChatTab.general;

  late final ScrollController _scrollGeneral;
  late final TextEditingController _textGeneral;
  late final ScrollController _scrollStaff;
  late final TextEditingController _textStaff;

  @override
  void initState() {
    super.initState();
    _scrollGeneral = ScrollController();
    _textGeneral = TextEditingController();
    _scrollStaff = ScrollController();
    _textStaff = TextEditingController();
    _textGeneral.addListener(() => setState(() {}));
    _textStaff.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _scrollGeneral.dispose();
    _textGeneral.dispose();
    _scrollStaff.dispose();
    _textStaff.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canStaff = widget.canViewStaff;
    if (!canStaff && _active == _ChatTab.staff) {
      _active = _ChatTab.general;
    }

    final useLive = widget.generalPane != null;
    final screenW = MediaQuery.sizeOf(context).width;
    final isCompact = screenW < 600;
    final padH = isCompact ? 10.0 : 12.0;
    final panelRadius = isCompact ? 16.0 : 20.0;

    // RN: flex:1 + minHeight:0 en el panel. En shell web el padre a veces deja alto 0 / ∞:
    // Column+Expanded ahí rompe y SliverFillRemaining(false) puede ver intrínseca infinita → error en Web.
    // Forzamos un alto usable con fallback a viewport menos barra flotante RN.
    final panel = DecoratedBox(
      decoration: BoxDecoration(
        color: const Color.fromRGBO(12, 16, 28, 0.68),
        borderRadius: BorderRadius.circular(panelRadius),
        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.10)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.30),
            offset: Offset(0, 14),
            blurRadius: 18,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(panelRadius),
        child: SizedBox.expand(
          child: useLive
              ? _LiveChatPanes(
                  active: _active,
                  canViewStaff: canStaff,
                  general: widget.generalPane!,
                  staff: widget.staffPane,
                )
              : Stack(
                  fit: StackFit.expand,
                  children: [
                  _pane(
                    visible: _active == _ChatTab.general,
                    child: ChatRnThreadColumn(
                      isStaffChat: false,
                      scrollController: _scrollGeneral,
                      messages: _mockGeneral(),
                      resolveOwn: (m) => m.userId == 'demo-me',
                      showPendingBar: true,
                      pendingIsVideo: false,
                      pendingThumbUrl: null,
                      onClearPending: () {},
                      inputController: _textGeneral,
                      onImage: () {},
                      onVideo: () {},
                      onEmoji: () {
                        showChatRnEmojiPickerModal(
                          context: context,
                          onSelect: (e) {
                            _textGeneral.text = '${_textGeneral.text}$e';
                            _textGeneral.selection = TextSelection.collapsed(offset: _textGeneral.text.length);
                            setState(() {});
                          },
                        );
                      },
                      onSend: () {},
                      canSend: _textGeneral.text.trim().isNotEmpty,
                      sending: false,
                      uploading: false,
                      onRefresh: () async {},
                      childAboveList: null,
                    ),
                  ),
                  if (canStaff)
                    _pane(
                      visible: _active == _ChatTab.staff,
                      child: ChatRnThreadColumn(
                        isStaffChat: true,
                        scrollController: _scrollStaff,
                        messages: _mockStaff(),
                        resolveOwn: (m) => m.userId == 'demo-me',
                        showPendingBar: true,
                        pendingIsVideo: false,
                        pendingThumbUrl: null,
                        onClearPending: () {},
                        inputController: _textStaff,
                        onImage: () {},
                        onVideo: () {},
                        onEmoji: () {
                          showChatRnEmojiPickerModal(
                            context: context,
                            onSelect: (e) {
                              _textStaff.text = '${_textStaff.text}$e';
                              _textStaff.selection = TextSelection.collapsed(offset: _textStaff.text.length);
                              setState(() {});
                            },
                          );
                        },
                        onSend: () {},
                        canSend: _textStaff.text.trim().isNotEmpty,
                        sending: false,
                        uploading: false,
                        onRefresh: () async {},
                        childAboveList: null,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );

    final tabsAndPanel = Padding(
      padding: EdgeInsets.symmetric(horizontal: padH),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(height: isCompact ? 6 : (kIsWeb ? 10 : 6)),
          _ChatTabsSelector(
            canViewStaff: canStaff,
            active: _active,
            staffLabel: widget.staffLabel,
            onSelect: (t) => setState(() => _active = t),
          ),
          SizedBox(height: isCompact ? 8 : 10),
          Expanded(child: panel),
        ],
      ),
    );

    if (!widget.embedRnShell) {
      return SizedBox.expand(
        child: Padding(
          padding: EdgeInsets.only(bottom: _chatBottomInset(context)),
          child: tabsAndPanel,
        ),
      );
    }

    return RnShellScaffold(
      activeRoute: RnMainRoute.chat,
      child: SizedBox.expand(child: tabsAndPanel),
    );
  }

  Widget _pane({required bool visible, required Widget child}) {
    return Positioned.fill(
      child: IgnorePointer(
        ignoring: !visible,
        child: Offstage(
          offstage: !visible,
          child: child,
        ),
      ),
    );
  }

  List<ChatRnMessageVm> _mockGeneral() => [
        ChatRnMessageVm(
          id: 'g1',
          userId: 'other',
          userName: 'roller@roller.com',
          text: 'Chat general: ¿Listos?',
          timestamp: DateTime(2025, 5, 4, 9, 41),
        ),
        ChatRnMessageVm(
          id: 'g2',
          userId: 'demo-me',
          userName: 'demo@mail.com',
          text: 'Sí. Voy saliendo.',
          timestamp: DateTime(2025, 5, 4, 9, 42),
          sendState: ChatRnSendState.sent,
        ),
      ];

  List<ChatRnMessageVm> _mockStaff() => [
        ChatRnMessageVm(
          id: 's1',
          userId: 'other',
          userName: 'admin@roller.com',
          text: 'Chat staff: recuerden validar eventos.',
          timestamp: DateTime(2025, 5, 4, 9, 50),
        ),
        ChatRnMessageVm(
          id: 's2',
          userId: 'demo-me',
          userName: 'demo@mail.com',
          text: 'Recibido.',
          timestamp: DateTime(2025, 5, 4, 9, 51),
          sendState: ChatRnSendState.sending,
        ),
      ];
}

class _LiveChatPanes extends StatelessWidget {
  const _LiveChatPanes({
    required this.active,
    required this.canViewStaff,
    required this.general,
    this.staff,
  });

  final _ChatTab active;
  final bool canViewStaff;
  final Widget general;
  final Widget? staff;

  @override
  Widget build(BuildContext context) {
    if (!canViewStaff || staff == null) {
      return SizedBox.expand(child: general);
    }
    final index = active == _ChatTab.general ? 0 : 1;
    return IndexedStack(
      index: index,
      sizing: StackFit.expand,
      children: [
        SizedBox.expand(child: general),
        SizedBox.expand(child: staff!),
      ],
    );
  }
}

class _ChatTabsSelector extends StatelessWidget {
  const _ChatTabsSelector({
    required this.canViewStaff,
    required this.active,
    required this.staffLabel,
    required this.onSelect,
  });

  final bool canViewStaff;
  final _ChatTab active;
  final String staffLabel;
  final void Function(_ChatTab tab) onSelect;

  @override
  Widget build(BuildContext context) {
    final isCompact = MediaQuery.sizeOf(context).width < 600;
    final tabPadV = isCompact ? 10.0 : 11.0;
    final marker = GoogleFonts.permanentMarker;
    TextStyle tabText(bool isActive) => marker(
          fontSize: 16,
          height: 1.05,
          fontWeight: isActive ? FontWeight.w700 : FontWeight.w600,
          color: isActive ? Colors.white : const Color(0xFFE2E8F0),
          shadows: [
            Shadow(
              color: isActive
                  ? const Color.fromRGBO(56, 189, 248, 0.6)
                  : const Color.fromRGBO(0, 0, 0, 0.6),
              offset: const Offset(0, 1),
              blurRadius: isActive ? 6 : 4,
            ),
          ],
        );

    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color.fromRGBO(20, 24, 38, 0.72),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.16)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.25),
            offset: Offset(0, 10),
            blurRadius: 16,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => onSelect(_ChatTab.general),
                  child: Container(
                    alignment: Alignment.center,
                    padding: EdgeInsets.symmetric(horizontal: 6, vertical: tabPadV),
                    color: active == _ChatTab.general
                        ? const Color.fromRGBO(56, 189, 248, 0.18)
                        : Colors.transparent,
                    child: Text(
                      'Chat General',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: tabText(active == _ChatTab.general),
                    ),
                  ),
                ),
              ),
              if (canViewStaff)
                Container(
                  width: 1,
                  margin: const EdgeInsets.symmetric(vertical: 10),
                  decoration: const BoxDecoration(
                    color: Color.fromRGBO(255, 255, 255, 0.18),
                    boxShadow: [
                      BoxShadow(
                        color: Color.fromRGBO(0, 0, 0, 0.3),
                        offset: Offset(0, 0),
                        blurRadius: 2,
                      ),
                    ],
                  ),
                ),
              if (canViewStaff)
                Expanded(
                  child: InkWell(
                    onTap: () => onSelect(_ChatTab.staff),
                    child: Container(
                      alignment: Alignment.center,
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: tabPadV),
                      color: active == _ChatTab.staff
                          ? const Color.fromRGBO(56, 189, 248, 0.18)
                          : Colors.transparent,
                      child: Text(
                        staffLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: tabText(active == _ChatTab.staff),
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

