Opciones de hosting y costos (RunSkateRoller)

Fecha: 2026-03-05

Supuestos base (ajustables)
- Escenario actual: 200 usuarios/mes creciendo a 500.
- Picos estimados: 3x sobre el promedio.
- Tráfico bajo/medio (hasta 5k–20k usuarios/mes).
- Backend Node/Express + PostgreSQL.
- Front web estático (React/React Native Web).
- Emails transaccionales (recuperación de contraseña) vía SendGrid SMTP.
- Imágenes en Cloudinary o similar (costos aparte).
- Dominio propio opcional.

Resumen rápido (rangos mensuales MXN)
- Configuración mínima (stack gratis): 0–220
- Económica estable: 260–750
- Pro ligera: 750–2200
- VPS todo-en-uno: 120–300 (pero más mantenimiento)

Opciones recomendadas por costo

1) Stack barato y simple (recomendado)
- Front: Cloudflare Pages (gratis)
- API: Render Web Service (~120/mes)
- DB: Render Postgres (~120/mes)
Email: SendGrid (free tier limitado / pago por uso)
Total estimado: ~260/mes
Pros: simple, confiable, fácil de mantener.
Contras: planes separados.

2) Arranque gratis (ideal para pruebas)
- Front: Vercel (gratis)
- API: Railway (pago por uso, típico 0–170/mes en bajo tráfico)
- DB: Neon (gratis en arranque)
Email: SendGrid (free tier limitado)
Total estimado: 0–220/mes
Pros: costo casi cero al inicio.
Contras: límites en free tier.

3) Todo-en-uno con panel (simple)
- Render (front estático + API + DB)
Email: SendGrid (free tier limitado / pago por uso)
Total estimado: 260–480/mes
Pros: todo en un mismo proveedor.
Contras: costos suben si crece el uso.

4) VPS ultra-barato (más técnico)
- Hetzner/Contabo (VPS desde 6–9/mes)
Email: SendGrid (free tier limitado / pago por uso)
Total estimado: 120–300/mes
Pros: más barato y flexible.
Contras: mantenimiento (Linux, backups, seguridad).

Costos por proveedor (aprox.)

Front (web estático)
- Cloudflare Pages: 0
- Vercel: 0 (Pro ~20)
- Netlify: 0 (Pro ~19)

Backend (Node/Express)
- Render: ~120 por servicio
- Railway: pago por uso (típico 0–255)
- Fly.io: pago por uso (típico 85–340)

PostgreSQL
- Render Postgres: ~120
- Neon: 0 (free), luego ~320
- Supabase: 0 (free), luego ~425

Email transaccional (recuperación de contraseña)
- SendGrid SMTP: free tier limitado, luego pago por uso (aprox. 0–340/mes según volumen)
- Alternativa: Mailgun/Resend (similares, depende del volumen)

Dominio y SSL
- Dominio: 170–260/año
- SSL: incluido en la mayoría de proveedores

Costos opcionales (no incluidos arriba)
- Cloudinary (imágenes): free tier, luego ~170+ según uso
- Logs/monitoring: 0–170
- Backups avanzados: 85–340
 
Búsquedas (para tener costo total mensual)
- PostgreSQL (ILIKE / FTS básico): 0 adicional (incluido en DB)
- Meilisearch en el mismo servidor: 0 adicional (más CPU/RAM)
- Algolia (externo): 0 en free tier, luego ~170–850 según consultas

Comparativo rápido

Opción | Front | API | DB | Total aprox
----- | ----- | --- | -- | -----------
Stack barato | Cloudflare | Render | Render | ~260/mes
Arranque gratis | Vercel | Railway | Neon | 0–220/mes
Todo en uno | Render | Render | Render | 260–480/mes
VPS | N/A | VPS | VPS | 120–300/mes

Estimado recomendado (200 → 500 usuarios/mes)
- Stack elegido: Cloudflare Pages + Render API + Render Postgres
- Búsquedas: PostgreSQL (sin costo adicional)
- Picos: hasta 3x (cubierto por planes base)
- Email: SendGrid (free tier limitado)

Total mensual estimado (MXN)
- Front: 0
- API: 120
- DB: 120
- Búsquedas: 0
- Dominio: ~20 (240/año aprox.)
Total base: ~260/mes (sin contar email si excede free tier)

Con imágenes (Cloudinary)
- Free tier: +0 (si alcanza)
- Si se excede: +170 a +425
Total con imágenes: ~260–685/mes

Siguiente paso
Si quieres, ajusto este cálculo con:
- Tamaño promedio de imágenes y cantidad/mes
- Porcentaje de usuarios activos diarios
- Dominio final a usar

Nota de conversión
- Tipo de cambio usado: 17 MXN por 1 USD (aprox.)
- Los rangos dependen de consumo real y de los tiers activos.
