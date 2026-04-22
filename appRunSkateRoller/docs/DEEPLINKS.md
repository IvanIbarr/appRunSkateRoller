# Enlaces profundos: “Sígueme” en Android e iOS

## Qué hace la app

- **Web:** `https://tu-sitio/?seguimiento=<uuid>` (igual que antes).
- **Nativo (compartir):**  
  - Si rellenas `PUBLIC_WEB_APP_BASE` en `src/config/seguimientoLinks.ts`, el texto usa **HTTPS** (recomendado para WhatsApp / redes).  
  - Si no, se usa **`runskateroller://seguimiento/<uuid>`** (abre la app cuando el sistema reconoce el esquema).

- **React Navigation** interpreta `runskateroller://seguimiento/<uuid>`.
- **URLs `https://...?seguimiento=`** en Android/iOS se leen con `Linking.getInitialURL` y `Linking.addEventListener('url')` y llevan a la pantalla **Navegación** con el mismo flujo espectador que en web.

## Android (ya en el proyecto)

1. `AndroidManifest.xml`: `intent-filter` con `scheme=runskateroller`, `host=seguimiento`.
2. `MainActivity.kt`: `onNewIntent` para que los enlaces lleguen bien con `launchMode="singleTask"`.

### App Links (HTTPS) — cuando tengas dominio

1. Pon en `PUBLIC_WEB_APP_BASE` la URL base pública (sin `/` final), p. ej. `https://app.tudominio.com`.
2. Añade en `AndroidManifest` otro `intent-filter` con `android:scheme="https"`, tu `android:host`, y `android:autoVerify="true"`.
3. Publica `https://tudominio.com/.well-known/assetlinks.json` con el fingerprint SHA-256 del keystore de firma y el `package` de la app (`com.siigroller`).

## iOS (cuando generes el proyecto `ios/`)

1. En **Info.plist**, registra el esquema personalizado:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>runskateroller</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.siigroller</string>
  </dict>
</array>
```

2. **Universal Links:** en Xcode, *Signing & Capabilities* → *Associated Domains* → `applinks:tudominio.com`.  
   Publica `https://tudominio.com/apple-app-site-association` (sin extensión) con los paths que deben abrir la app.

## Producción

- Rellena **`PUBLIC_WEB_APP_BASE`** con la misma base que uses en la web en producción para que el mensaje compartido sea un enlace **HTTPS** verificable.
- Prueba en dispositivo real: WhatsApp a veces no resalta esquemas personalizados; **HTTPS + Universal/App Links** es el camino fiable.
