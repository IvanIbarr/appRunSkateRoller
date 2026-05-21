# Diagnóstico layout `/chat` (móvil)

Fecha: 2026-05-21  
Estado: **rollback aplicado** — archivos de chat restaurados a `HEAD` (commit `83123e3`).

## Qué se revirtió (último cambio roto)

Cambio que se deshizo por completo:

1. **`chat_layout_insets.dart`** (archivo nuevo) — eliminado.
2. **`chat_comunidad_rn_tabs_mirror.dart`** — se quitó `Padding(bottom: _chatPanelBottomClearance)` del contenedor y se dejó el panel sin reserva inferior global.
3. **`chat_thread_rn_mirror.dart`** — el composer pasó a usar `chatComposerBottomInset()` (altura nav + safe area + 10px) en lugar de padding 0 con teclado cerrado.
4. **`chat_thread_screen.dart`** — `LayoutBuilder` + `SizedBox(height: h)` sustituido por `SizedBox.expand` en `shellEmbedded`.

**Versión restaurada (git):** `reservedBottomInset` en el padre del panel + `LayoutBuilder` en el hilo embebido.

## Síntoma reportado tras el cambio

- Pantalla `/chat`: *"No se pudo cargar la información del usuario"*.
- Posible sensación de regresión en auth (no se revirtió auth en este rollback; ver nota abajo).

### Mensaje de error — origen en código

`chat_screen.dart` → `_chatTabMeProvider` → `currentMeProvider.future`. Si falla o devuelve `null`, `_buildChatContent(null)` muestra ese texto.

**Causa probable del error (hipótesis, no confirmada en runtime):**

| Hipótesis | Detalle |
|-----------|---------|
| A. Layout / constraints | `SizedBox.expand` en `ChatThreadScreen` (`shellEmbedded`) con padre sin altura acotada puede provocar asserts o árbol inestable en web móvil; en cascada el tab Chat podría quedar en estado raro al invalidar providers en `initState`. |
| B. API / sesión | Token expirado, backend caído o `/me` fallando — independiente del layout; conviene revisar red y `authSessionProvider`. |
| C. Carrera de providers | `initState` invalida `_chatTabMeProvider` y mensajes en el primer frame; si `currentMeProvider` aún carga, un fallo transitorio deja `null`. |

**Rollback de chat no toca** `auth_controller.dart`, `auth_repository.dart` ni `app.dart` (cambios i18n/registro siguen en working tree).

## Causa probable del espacio inferior (problema original)

El hueco entre composer y bottom nav **no** se resolvía solo bajando el composer. Había dos capas de reserva vertical:

1. **Padre del panel** (`ChatComunidadRnTabsMirror`, `embedRnShell: false`):
   - `Padding(bottom: RnBottomNavigationSlot.reservedBottomInset(context))`
   - Fórmula: `totalHeight` (78+28) + `floatingOuterBottomMargin` (16) + `MediaQuery.padding.bottom`
   - El buffer **+28** en `totalHeight` suele ser mayor que la barra visible → franja vacía bajo el panel glass (se ve el fondo de Comunidad).

2. **Composer** (`ChatRnThreadColumn`):
   - Padding inferior extra cuando el teclado está cerrado (en iteraciones intermedias: 0 o 4–6px; en el cambio roto: todo el inset de nav en el composer).

Efecto visual: el **panel glass termina antes** que la bottom nav; el composer queda arriba del hueco; la lista pierde altura útil.

## Widgets involucrados

```
ChatScreen (Scaffold, SafeArea bottom: false)
└── Column
    ├── Header Comunidad
    └── Expanded → ChatComunidadRnTabsMirror
        └── SizedBox.expand
            └── Padding(bottom: reservedBottomInset)  ← principal sospechoso del hueco
                └── Column
                    ├── Tabs (_ChatTabsSelector)
                    └── Expanded → panel glass
                        └── ChatThreadScreen (shellEmbedded)
                            └── LayoutBuilder → SizedBox(h) → ChatRnThreadColumn
                                ├── Expanded → ListView mensajes
                                └── composer (ChatRnInputOuter)
```

**Globales (solo lectura para fix futuro):**

- `RnBottomNavigationSlot.reservedBottomInset` — `rn_shell_bottom_tab_bar.dart`
- `RnShellScaffold` / `extendBody: true` — `rn_mirror_layouts.dart`
- `AppShell` — no modificar en fixes de chat

## Constraints / paddings detectados

| Ubicación | Valor / comportamiento | Efecto |
|-----------|------------------------|--------|
| `reservedBottomInset` | ~106 + 16 + safeBottom (+28 implícitos) | Encoge toda la columna tabs+panel |
| `chat_comunidad` padH | 8–12px horizontal | OK |
| `ChatRnThreadColumn` composer | `viewInsets.bottom + 4–6` (pre-rollback intermedio) | Solo teclado; no debe duplicar nav |
| Sin `maxHeight` fijo 520/560 en chat | — | No era el problema principal |
| `Center` + `maxWidth: 480` | Solo `wideWeb` en `chat_screen` | No limita alto en móvil estrecho |

## Propuesta de fix mínimo (para después, estable)

1. **Un solo dueño del inset inferior** — no sumar nav en padre **y** en composer.
2. **Opción recomendada:**
   - Panel: `Expanded` sin `Padding(bottom: reservedBottomInset)` (o usar solo `kPreferredInteriorHeight + 16 + safe + 10`, sin el +28 de `totalHeight`).
   - Composer: `padding.bottom = chatComposerBottomInset(context)` solo con teclado cerrado; con teclado: `viewInsets.bottom + 4`.
3. **Mantener** `ChatThreadScreen` embebido con `LayoutBuilder` + altura finita (como en HEAD), no `SizedBox.expand` a ciegas.
4. **Probar** en 390×844 y Safari iOS antes de tocar `rn_shell_bottom_tab_bar.dart`.
5. **Gap objetivo:** 8–12px entre composer y top de la bottom nav.

## Archivos que NO se deben tocar (fix layout chat)

- `lib/src/core/ui/rn_shell_bottom_tab_bar.dart` (bottom nav global)
- `lib/src/core/ui/rn_mirror_layouts.dart` (shell global)
- `lib/src/features/shell/presentation/app_shell.dart`
- `lib/src/features/ruta/**`
- `lib/src/features/auth/**` (salvo bug auth confirmado)
- `lib/src/app.dart` (router)
- Lógica de envío/API en `chat_repository.dart`, `chat_thread_screen.dart` (handlers `_send`, `_pickImage`, etc.)

## Archivos seguros para un fix futuro solo UI chat

- `lib/src/features/chat/presentation/chat_comunidad_rn_tabs_mirror.dart`
- `lib/src/features/chat/presentation/chat_thread_rn_mirror.dart`
- `lib/src/features/chat/presentation/chat_thread_screen.dart` (solo layout embebido, no lógica)
- `lib/src/features/chat/presentation/chat_screen.dart` (solo header/spacing)
- Nuevo helper local opcional: `chat_layout_insets.dart` (recreado con pruebas)

## Verificación post-rollback

- [ ] `/chat` — usuario, tabs, mensajes, composer, bottom nav visibles
- [ ] `/ruta` — sin regresiones
- [ ] `/inicio` — si aplica en shell
- [ ] Sin mensaje *"No se pudo cargar la información del usuario"* con sesión válida

Reiniciar front tras rollback: `flutter run -d web-server` + proxy `https://192.168.1.79:8443`.
