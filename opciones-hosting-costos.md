# Opciones de hosting y costos (RunSkateRoller)

**Fecha:** 2026-04-14 · **Contexto:** costeo de los **primeros meses** tras integrar API + PostgreSQL (eventos/calendario y datos compartidos entre usuarios). Incluye tablas detalladas por proveedor y estrategia de pago.

---

## 1. Qué exige el stack actual (impacta el hosting)

Con lo implementado recientemente, la app ya no depende solo de datos locales en el dispositivo para partes clave del producto:

| Componente | Rol | Implicación para hosting |
|------------|-----|---------------------------|
| **Backend Node/Express** (`SIIG-ROLLER-BACKEND`) | Auth JWT, REST (`/api/...`, p. ej. eventos) | Debe estar **siempre en HTTPS** en producción; la app móvil y web consumen la misma API. |
| **PostgreSQL** | Usuarios, eventos del calendario, datos transaccionales | **Base gestionada** o VPS con backups; sin DB persistente los usuarios no ven los mismos eventos. |
| **Email (Nodemailer + SMTP)** | Recuperación de contraseña, notificaciones por correo | Tier gratuito de SendGrid/Resend/Mailgun suele bastar al inicio; luego pago por volumen. |
| **Front web estático** (React Native Web / build) | Panel o versión web | Puede ir en **Pages/Netlify/Vercel** casi gratis; el costo real está en API + DB. |
| **Socket.io** (si lo usas en producción) | Tiempo real | Mismo proceso que Express o servicio separado; en PaaS conviene **un servicio** con WebSockets soportados (Render, Railway, Fly, etc.). |

**Conclusión:** en los primeros meses el gasto recurrente razonable se concentra en **API + PostgreSQL** y, si aplica, **dominio**; el front estático puede seguir en **0**.

---

## 2. Supuestos base (ajustables)

- Fase inicial: **pocos cientos de usuarios/mes** (pruebas beta y primeros rodados).
- Picos estimados: **~2–3×** el promedio (fines de semana, eventos).
- Tráfico API: bajo (pero con **latencia estable** para login, calendario y subida de datos).
- Moneda de referencia: **MXN**; precios de proveedores suelen facturarse en **USD** (tipo de cambio orientativo **~17–19 MXN/USD**, revisar al contratar).

---

## 3. Resumen de rangos mensuales (MXN, orientativos)

| Perfil | Rango mensual aprox. | Para quién |
|--------|----------------------|------------|
| **Arranque mínimo (free tiers)** | **0 – 250** | Primeras 1–3 meses, tráfico muy bajo, aceptar límites de CPU/sleep. |
| **Recomendado “primeros meses serios”** | **280 – 650** | API + DB siempre activas, menos sorpresas al crecer. |
| **Cómodo / más margen** | **700 – 2 200** | Más RAM, réplicas, o todo en un proveedor con soporte. |

*No incluyen dominio anual ni exceso de mapas (Mapbox) ni almacenamiento masivo de imágenes.*

---

## 4. Para Iván: la recomendación en texto (no solo tablas)

Hola, **Iván**. Lo que va abajo (tablas) sirve para **comparar cifras**; lo que suele faltar es **criterio** sobre cuánta infra **merece** la etapa en la que estás. Aquí va una lectura clara, alineada con **RunSkateRoller** (API en Node, PostgreSQL para datos compartidos, app móvil + web) y con la idea de **no quedarte en cero** en el sentido malo: **no depender toda la vida de “todo gratis” que se apaga, limita o te deja a los usuarios sin servicio el día del evento**—pero tampoco **pagar de más** el día 1.

### Qué significa aquí “no quedarnos en ceros”

- **No** es “meter tarjeta y gastar 2 000 MXN/mes sin pensar”.  
- **Sí** es: apartar desde el inicio un **hilo mínimo de presupuesto** (aunque sean **~300–450 MXN/mes** cuando pases a “en serio”) para que **API + base de datos** no dependan de **cold starts agresivos**, **límites de CPU** en el peor momento, o sorpresas de facturación.  
- El **0 MXN** en la tabla (escenario A) es válido **solo mientras** estás en **beta controlada** o en **desarrollo**; en cuanto tengas **gente real** dependiendo del calendario, login y eventos, lo sano es **el escenario B o C** (ver **sección 9**, totales por escenario, y **sección 12**, comparativo): es el punto donde dejas de jugar a la suerte con el free puro.

### La mejor recomendación práctica (mi lectura con tu stack)

1. **Front web (build estático):** quédate en **Cloudflare Pages o Vercel (gratis)**. Ahí el “0” no te perjudica: el front no es el cuello de botella.  
2. **Lo que nunca debería ser “cero” a largo plazo:** un **par API + PostgreSQL** que tú controles. La opción **más simple mentalmente** es **Render** (mismo sitio: Web Service + Managed Postgres) o, si te gusta ahorrar al inicio, **Neon free + API en Railway/Render** con **alertas y tope** de gasto.  
3. **Email:** con **SendGrid/Resend en free** alcanzas bien la recuperación de contraseña; subes a pago **solo** cuando haya muchos envíos.  
4. **Dominio:** no es obligatorio el primer día, pero **sí** en cuanto pases a “público suave” (Fase 2 abajo); separa el proyecto de un `localhost` o URL fea de PaaS y da **confianza**. Cuesta **~200–350 MXN/año**; en tu presupuesto mental reparte **~20–30 MXN/mes**.  
5. **Mapas e imágenes (Mapbox, Cloudinary, etc.):** déjalos en **free o casi** hasta **Fase 3**, cuando tengas **números** (usuarios activos, no solo instalaciones). Ahí el gasto deja de ser intuición y pasa a ser **decisión con datos**.

En una frase: **no hace falta “comprar de todo” en la v1, pero sí evitar el escenario de “cero dólares = cero prioridad al backend”** cuando la app **ya** promete a usuarios reales. Eso es “no quedarnos en ceros” en **infra sólida mínima**, no en gastar a lo loco.

### Cómo ir en fases con *tu* desarrollo (más detalle)

Esta traza conecta **qué debería estar hecho en el código** con **qué contratar** y **qué sientes en la caja**—para que el doc no sean solas celdas de Excel.

| Fase | Qué hace el producto (desarrollo) | Qué hace la infra (referencia) | Sobre el dinero (actitud) |
|------|----------------------------------|---------------------------------|---------------------------|
| **0 – Sólo dev** | Features en local: login, calendario, eventos, etc. probados en `localhost` o red interna. | Puede ser **0** o deploys de prueba. Sin compromiso. | Cero o casi cero; no confundas esto con “producción”. |
| **1 – Beta** | Build **TestFlight/Play interno** o pocos testers; quieres validar flujos y bugs **sin** prometer a cientos. Eventos y usuarios reales en BD, pero poca carga. | **Escenario A** (sección 9, totales): mucho free, quizá un **dolarillo** de Railway si ya quieres API estable. | Presupuesto **0–200 MXN/mes**; acepta fricción de límites. Ojo: si el calendario crítico depende al 100 % del free, ten plan de salto a Fase 2. |
| **2 – Público suave (tu “v1” de verdad)** | Misma app, pero con **gente de verdad** bajando la app, rodadas, eventos compartidos **entre cuentas**. Aquí aplica “lo que añadiste”: **eventos vía API + Postgres** para *todos* los usuarios. | **Escenario B o C:** API+Postgres **de pago fijo o casi fijo** (p. ej. Render ~7+7 USD + dominio). Front sigue en Pages. Email free. | A partir de **~300–500 MXN/mes** (más el dominio prorrateado) es razonable; es **el piso** para no vivir atrapado en el límite del tier gratis. |
| **2.1 – Ajuste** | Monitoreas: errores 5xx, tiempos de API, registro, envío de correos, picos de fin de semana. | Sube RAM o plan de DB **solo** si el monitoreo lo pide; no por ansiedad. | Incrementos de **cientos** de MXN, no miles, salvo crecimiento claro. |
| **3 – Escala (cuando entra tracción o dinero)** | Más tráfico, posible notificaciones push, más subida de fotos, websockets a full, más consultas a mapa. | **Parte de escenario D** (Mapbox/Cloudinary/email pago) según métrica. | Aquí el gasto **sí** sube, pero con **sponsor, cuotas, donaciones, etc.** o con datos que justifiquen. |

**Qué evitar, Iván:** lanzar a tienda pública diciendo “ya está todo en servidor” mientras en producción aún vives 100 % en free **sin** alertas, **sin** tope, **sin** probar carga de 20 personas abriendo el calendario el mismo día. **Qué priorizar en cambio:** en cuanto tengas **un solo rodada publicitada o comunidad** usando la app, pasa a **Fase 2 mínima** (B/C): con eso el documento y las tablas dejan de ser números sueltos y se convierten en un **plano** que podés comentar a quien te pregunte *“en qué andas invirtiendo en la app”*.

**Resumen de una línea para ti:** *Empieza barato (Fase 1), nunca mientas a los usuarios con estabilidad que el free no te da; y cuando pases a público, apunta a **~300–500 MXN/mes** de base en API+DB+dominio—eso es el “no quedarnos en ceros” con cabeza.*

---

## 5. Recomendación principal (lista técnica, primeros meses)

### Opción prioritaria: **empezar casi en cero y escalar cuando haya usuarios reales**

1. **Front web:** **Cloudflare Pages** o **Vercel** (gratis en tier hobby).  
2. **API:** **Railway** o **Render** en plan de **pago bajo** o **créditos iniciales** (evita que el servicio “duerma” y corte WebSockets o tareas largas).  
3. **PostgreSQL:** **Neon** (free tier con límites) o **Supabase** (free tier) **o** Postgres incluido en el mismo **Render** si prefieres **una sola factura**.  
4. **Email:** **SendGrid / Resend** free tier para transaccionales.  
5. **Dominio:** opcional al inicio; **~200 – 350 MXN/año** en .com/.mx.

**Por qué esta mezcla:** costea poco al inicio, alinea con el backend y PostgreSQL ya en uso, y permite pasar a Neon/Render pagos cuando el calendario y el registro de usuarios generen carga real.

### Alternativa si quieres **menos proveedores** (más simple mentalmente)

- **Render:** Web Service (API) + **Managed Postgres** en el mismo panel.  
- **Total típico:** ~**450 – 750 MXN/mes** según tamaño de instancia y DB (valores al cambio actual).  
- **Pros:** una factura, despliegue Git sencillo. **Contras:** menos “gratis” que Neon + Railway al arranque.

### Si el presupuesto es **muy ajustado** y aceptas mantenimiento

- **VPS** (Hetzner, Contabo, etc.) **~120 – 350 MXN/mes** con Node + Postgres en la misma máquina.  
- **Pros:** precio/GB. **Contras:** tú gestionas seguridad, backups y parches (no ideal si el foco es la app, no DevOps).

---

## 6. Opciones detalladas (comparativo)

### A) Stack barato y probado (equilibrio costo/simplicidad)

- Front: **Cloudflare Pages** — **0**  
- API: **Render** Web Service — **~120–200** (según plan/instancia)  
- DB: **Render Postgres** — **~120–200**  
- Email: SendGrid free / pago por uso  

**Total base:** **~260 – 450 MXN/mes** + dominio opcional.

### B) Arranque con free tiers (mínimo gasto los primeros meses)

- Front: **Vercel** — **0**  
- API: **Railway** (uso variable) — **~0–200**  
- DB: **Neon** free o pago mínimo — **~0–150**  
- Email: SendGrid free tier  

**Total:** **~0 – 220 MXN/mes** (puede subir de golpe si se dispara el uso; conviene activar alertas de facturación).

### C) Todo en un panel (menos cuentas)

- **Render:** static + API + Postgres  
**Total:** **~260 – 550 MXN/mes** según combinación de instancias.

### D) VPS (más barato en bruto, más trabajo)

- VPS + Node + PostgreSQL en la misma VM  
**Total:** **~120 – 350 MXN/mes** + tu tiempo de operación.

---

## 7. Costos por categoría (referencia rápida)

**Front (web estático)**  
- Cloudflare Pages / Vercel / Netlify (hobby): **0** (límites de ancho de banda razonables para el inicio).

**Backend (Node/Express + posible Socket.io)**  
- Render / Railway / Fly.io: según RAM y horas — **~85 – 400 MXN/mes** típico en etapa pequeña.

**PostgreSQL**  
- Neon / Supabase free tiers: **0** con topes; managed pagado **~150 – 450 MXN/mes** según plan.  
- Render Postgres: **~120 – 200+** en tier básico.

**Email (recuperación de contraseña, Nodemailer)**  
- Free tier limitado; escalado **~0 – 350 MXN/mes** según volumen.

**Dominio y SSL**  
- Dominio .com/.mx: **~200 – 350 MXN/año**  
- SSL: incluido en PaaS y en Cloudflare.

**Opcionales**  
- **Mapbox** (mapas en app): free tier con techo; revisar facturación si muchas cargas de mapa.  
- **Imágenes** (Cloudinary u otro): free tier al inicio; **+150 – 500 MXN/mes** si crece el almacenamiento.  
- Backups extra / monitoring: **~85 – 350 MXN/mes** si no vienen en el plan de DB.

**Tipo de cambio en tablas siguientes:** **1 USD ≈ 18 MXN** (redondeo orientativo; al pagar, usa el TC de tu banco o del día de la factura).

---

## 8. Tabla “tipo Excel”: costo por proveedor (línea a línea)

Cada fila es un **cargo recurrente** típico en etapa de arranque. Los USD son **estimados**; confirma siempre en la página de precios del proveedor (cambian según región e impuestos).

| # | Proveedor | Servicio / plan (referencia) | USD / mes | MXN / mes (×18) | ¿Descuento si pagas 1 año? | Comentario breve |
|---|-----------|------------------------------|----------:|-----------------:|---------------------------|------------------|
| 1 | **Cloudflare** | Pages (hobby) | 0,00 | 0 | No aplica (gratis) | Front web estático. |
| 2 | **Vercel** | Hobby (front) | 0,00 | 0 | No aplica (gratis) | Alternativa al de arriba. |
| 3 | **Render** | Web Service (API, p. ej. 512 MB–1 GB) | 7,00 | 126 | Poco frecuente en tier mínimo; **revisar** pricing actual | Un solo contenedor Node + Socket.io. |
| 4 | **Render** | PostgreSQL (instancia básica) | 7,00 | 126 | Idem; suelen ser **suscripción mensual** | Misma factura que la API en Render. |
| 5 | **Railway** | Uso (API) “típico bajo” | 3,00–8,00 | 54–144 | A veces **créditos** o promos; anual poco estándar | Muy variable; activa tope de gasto. |
| 6 | **Neon** | Free tier | 0,00 | 0 | N/A | Límites de almacenamiento/CPU. |
| 7 | **Neon** | Plan pago mínimo (si sales del free) | 15,00–19,00 | 270–342 | Revisar en Neon: a veces **migran** a créditos | Postgres serverless. |
| 8 | **Supabase** | Free / Pro aprox. | 0 / 25 | 0 / 450 | **Pro** a veces con **descuento anual** (revisar web) | DB + auth extra si lo usas. |
| 9 | **SendGrid** | Free (hasta límite de correos) | 0,00 | 0 | Planes de pago: a veces **%** anual | Solo SMTP transaccional. |
| 10 | **Resend** | Free tier / Essentials | 0 / 20 | 0 / 360 | Revisar | Alternativa a SendGrid. |
| 11 | **Namecheap / Cloudflare** | **Dominio** .com (costo/ año ÷ 12) | ~0,80–1,20 | ~15–22 | Sí: **años 2+** o **multianual** suelen bajar $/año | No es “mensual” en la factura: se paga el año. |
| 12 | **Mapbox** | Free + uso | 0–20 | 0–360 | Típico **mensual o por uso** | Dependiendo de map loads. |
| 13 | **Hetzner / Contabo** | VPS 1 vCPU (solo referencia) | 4,00–6,00 | 72–108 | A veces **%** pago anual adelantado en VPS | Tú administras OS + Postgres. |

*Los ítems 1–2 usas **uno** de los dos (no ambos) para el front, salvo que dupliques entornos.*

### 8.1 Qué filas de la tabla anterior usar para arrancar (no es otra tabla nueva)

La **tabla recomendada para iniciar** en serio (cuando ya quieres **API + Postgres estables** y **v1 pública**) no reemplaza la de arriba: es el **subconjunto de filas** que debes **sumar**. Corresponde al **escenario B** de la **sección 9** (totales).

| ¿Incluir? | Fila # (arriba) | Proveedor | Qué es | USD/mes | MXN/mes (×18) |
|-----------|-----------------|-----------|--------|--------:|--------------:|
| Sí | **1** o **2** | Cloudflare **o** Vercel | Front web (elige **uno**) | 0 | 0 |
| Sí | **3** | Render | Web Service = tu API Node | 7 | 126 |
| Sí | **4** | Render | PostgreSQL gestionado | 7 | 126 |
| Sí | **9** | SendGrid | Email transaccional (free) | 0 | 0 |
| Sí (cuando salgas a público) | **11** | Dominio .com | Costo **mental** mes a mes (anual ÷ 12) | ~1 | **~18–25** |
| No al inicio | **12** | Mapbox | Déjalo en free hasta Fase 3 | 0 | 0 |
| No mezclar sin criterio | **5** | Railway | Solo si **no** usas Render para la API (elige un camino) | var. | var. |

**Suma del pack “Iván – arranque producción” (solo filas 3+4+1 o 2+9+11):**

| Concepto | USD/mes | MXN/mes |
|----------|--------:|--------:|
| Render API + Postgres (filas 3 + 4) | **14** | **252** |
| Front Cloudflare o Vercel (fila 1 o 2) | 0 | 0 |
| Email SendGrid (fila 9) | 0 | 0 |
| Dominio prorrateado (fila 11, ~300 MXN/año) | — | **~25** |
| **Total presupuesto mensual fijo (orden de magnitud)** | **~15** | **~277** → **~300–330** con TC/impuestos |

**Totales anuales (para tu hoja de caja, Iván):**

| Concepto | Cálculo | MXN / año (aprox.) |
|----------|---------|-------------------:|
| Solo API + DB (Render 14 USD × 12 meses, TC 18) | 252 × 12 | **3 024** |
| Dominio (1 pago típico .com) | — | **~250–350** |
| **Total año 1 (hosting + dominio)** | 3 024 + dominio | **~3 300 – 3 400** |

*(Mapbox, Resend de pago, etc. van **aparte** cuando subas de fase; aquí no los sumamos.)*

### 8.2 Mi plan Iván: mes 1, mes 2… (una fila por mes)

Números **fijos orientativos** para no improvisar; ajusta el **mes en que pasas a Render** según tu beta.

| Mes | Etapa | Qué haces en producto | Total **MXN/mes** (meta de bolsillo) | Notas |
|-----|-------|------------------------|-------------------------------------|--------|
| **1** | Beta / prueba | Pocos testers; calendario y auth en servidor | **0 – 120** | Free max (Neon + Railway bajo) o casi free; ver escenario A, sec. 9. |
| **2** | Beta | Mismo; revisas límites y errores | **0 – 120** | Si ya te aprieta el free, **adelanta** el salto al mes 3. |
| **3** | Público suave | Activas **Render filas 3+4** + **dominio** + front en fila 1 o 2 | **300 – 330** | Aquí arranca el **pack fijo** de la tabla de suma de arriba. |
| **4** | Igual | Estabilidad, feedback de rodadas | **300 – 330** | Mismo presupuesto base. |
| **5** | Igual | Métricas (DAU, registros) | **300 – 330** | Revisa si DB o API pide más RAM. |
| **6** | Igual o ajuste | Opcional: +RAM/DB **solo** si el monitoreo lo pide | **300 – 450** | No subas por ansiedad; por datos. |

**Acumulado aprox. primeros 6 meses (si meses 1–2 ~80 MXN y 3–6 ~315 MXN):**  
80+80+315×4 = 160 + 1 260 = **~1 420 MXN** + **dominio** si lo pagas en un mes suelto (~300) → **~1 720 MXN** en el semestre (orden de magnitud; no incluye el laptop ni tiendas de apps).

**Frase de cierre:** *“Nos arrancamos con”* **las filas 1 (o 2) + 3 + 4 + 9 + 11** de la tabla de la sección 8, **~300–330 MXN/mes** en producción, y **~3,3k MXN** en el año con dominio. El resto de filas (Mapbox, email de pago, etc.) **cuando tengas tracción**.

---

## 9. Totales por escenario (pago a mes, “fila de total”)

Suma aproximada con **TC 18**; redondea en tu hoja al TC real.

| Escenario | Qué incluye (resumido) | Suma USD/mes (rango) | **Total MXN/mes** (rango) | **Total MXN / año** (rango) |
|-----------|------------------------|----------------------|---------------------------|----------------------------|
| **A – Mínimo (free max)** | Cloudflare + Railway bajo + Neon free + email free, sin Mapbox pago | 0–5 | **0 – 90** | **0 – 1 080** |
| **B – Equilibrado (recomendado al arrancar “en serio”)** | Cloudflare + Render API + Render Postgres + dominio prorrateado, email free | ~15–17 | **~270 – 310** + dominio | **~3 200 – 3 800** + **~250–400/año** dominio |
| **C – Un solo panel** | Render (static + API + Postgres) todo pagado, email free | ~16–25 | **~290 – 450** | **~3 500 – 5 400** |
| **D – v1 con todo** | C + Resend/SendGrid pago ligero + Mapbox cerca del techo + Cloudinary básico | 35–60 | **~630 – 1 080** | **~7 500 – 13 000** |

*Dominio: muchos registradores cobran **1 vez al año**; en la tabla B el “+ dominio” es **~15–25 MXN/mes** de costo promedio si divides el pago anual entre 12.*

---

## 10. Descuento anual, tarjeta de crédito y no “desfalcarte” el efectivo

**Cómo suelen cobrar las herramientas de desarrollo (2026, patrón habitual)**

- **PaaS** (Render, Railway, Vercel hobby, Neon free): la mayoría factura **mes a mes** y **no** ofrecen “12 meses por el precio de 10” en el plan más barato. El descuento anual, cuando existe, es más común en **planes Pro** o en **VPS** (Hetzner a veces ~15–20 % menos por prepago anual: **revisar** checkout).
- **Dominio:** es lo más típico en pagar **1 año o varios**; el 2.º/3.º año a veces sube: conviene autorenovación con alerta.
- **“Meterlo a meses en la tarjeta”** en México suele ser el **cobro diferido bancario** (MSI) o **línea de crédito**: aplica a **compras en comercio**, no a suscripciones extranjeras en USD de forma automática. Para **Stripe/Render/Neon** normalmente se **carga el total mensual a la TC**; lo que tú haces en tu cabeza es el **presupuesto** (ver abajo).

**Estrategia de flujo (sin quedarte en rojo aunque el negocio aún no pague)**

1. **Cuenta fija “infra”** en Excel/Notion: *sólo* hosting + dominio (prorrateado) + 1 servicio de email si aplica. Cada mes debe cuadrar con lo que puedes sostener **3–6 meses** sin ingresos de la app.  
2. **Pago anual de dominio:** aunque pagues **300 MXN** en un mes, anota en tu presupuesto **25 MXN/mes** para no “olvidar” el costo.  
3. **Tarjeta de crédito:** paga el **corte** con disciplina; el costo de infra estructurado (suma de filas de la sección 8, proveedores) debe ser **menor o igual** a un porcentaje fijo de tus ingresos o de tu ahorro dedicado.  
4. **Alertas de billing:** en Render/Railway/Neon activa **límite de gasto y correos** al 50 % y 80 % del presupuesto.  
5. **“Equivalencia anual con descuento”** solo donde exista: si un VPS cuesta 100 USD/mes o 1 000 USD/año, la equivalencia con descuento sería **~1 000/12 ≈ 83 USD/mes**; úsala solo si **puedes** soltar el capital anual y el descuento es real en el checkout.

| Concepto | Pago frecuente | Cómo repartirlo en tu mente (mensual) |
|----------|----------------|----------------------------------------|
| Dominio 300 MXN/año | 1× al año | 300 ÷ 12 = **25 MXN/mes** reservados |
| Render 7+7 USD/mes (API+DB) | 12 veces al año | **252 MXN/mes** a tipo 18 (sin MSI) |
| Inversión anual con descuento (VPS) | 1× | Total ÷ 12 = **cuota mental mensual** |

*Nota:* el desglose línea a línea por proveedor está en la **sección 8** (tabla Excel).

---

## 11. Estrategia: ¿salir con “todo” en la v1 o por fases?

**Opción 1 – Lanzar en fases (encaja con poco riesgo de caja)**

| Fase | Qué activas | Alcance o detalle (qué cubre) | Objetivo de negocio | Ref. de coste | **Suma aprox. MXN/mes** | **Suma aprox. MXN/año** |
|------|------------|---------------------------------|--------------------|---------------|-------------------------:|--------------------------:|
| **1 – Beta** | Free tiers: front + (Railway/Render mín) + Neon free + email free; dominio opcional | **Cubre:** probar con **pocos** usuarios a la vez; aceptar **límites** del free (CPU, conexiones, a veces “sueño” del servicio). **Incluye:** registro, login, calendario/eventos en servidor con carga baja. **No cubre aún:** disponibilidad tipo 24/7 “de tienda”, ni escala a cientos en paralelo; el foco es **encontrar bugs y validar flujos**, no marketing masivo. **Detalle de números y frases (pocos, límites, 24/7, flujos):** ver **§11.1** debajo. | Probar con grupo cerrado, calendario y auth en serio | A (sec. 9) | **0 – 90** | **0 – 1 080** |
| **2 – Público suave** | API+DB de pago fijo (Render o similar), **sin** dejar de dormir; dominio propio; alertas de billing | **Cubre:** **mismos** flujos que en beta pero con **gente real** descargando la app, rodadas y eventos en vivo; datos **unificados** en PostgreSQL para **todos** los usuarios (misma lógica que eventos vía API). **Incluye:** HTTPS con dominio, servicio despierto, alertas de facturación, correo transaccional en free si alcanza. **No es obligatorio aún:** mapas/imgs a nivel de pago, email masivo, CDN caro. | Primeras descargas y rodadas; ingresar feedback | B o C (sec. 9) | **~300 – 450** | **~3 500 – 5 400** |
| **3 – Crecer** | Más RAM/DB, email de pago si haces muchos envíos, Mapbox/Cloudinary si hace falta | **Cubre:** **más** usuarios en paralelo, picos (fines de semana), y **costos variables** (mapas, almacenamiento, miles de correos) según **datos reales** (retención, DAU, picos de API). **Incluye:** ajuste de recursos, posible monitoreo/backup extra. **Escala solo** lo que las **métricas** justifiquen, no “por si acaso” enteros. | Cuando ya hay **métrica** (usuarios activos, retención) | D parcial (sec. 9) | **~450 – 1 080+** | **~5 400 – 13 000+** |

*Cifras alineadas a la **sección 9** (escenarios A–D), tipo de cambio **~18 MXN/USD**; el dominio en B/C puede ser un **pago anual** separado: suma unos **+250–400 MXN/año** al dominio según registrador. En Fase 1, si usas un mínimo de Railway/Render, puedes acercarte a **~120 MXN/mes**; no contradice el techo de **90** en free puro (sec. 9-A).*

### 11.1 Fase 1 (Beta): qué significa cada frase (números y términos)

Aquí se desglosa en lenguaje claro lo de la **Fase 1** de la tabla anterior, para que no quede en aire.

**“Pocos usuarios a la vez” — ¿cuántos?**  
No es un número mágico del reglamento; es **orden de magnitud** para **beta cerrada**:

- **Grupo de prueba (técnico):** suele ser **~5–30 personas** *muy activas* o **~30–80** en una **primera tanda** si abrís en **lotes** (entradas por semana) y el uso no se concentra en un solo anuncio masivo.  
- **Uso repartido en el tiempo:** puedes tener **decenas o bajo centenar** de cuentas creadas en el mes si no todos usan la app **al mismo instante**.  
- **Lo que aquí NO se persigue:** que **cientos** de personas abran la app **a la vez** (mismo minuto) o generen un **pico** de peticiones a la API como en un evento masivo anunciado en redes. Eso ya se acerca a **Fase 2/3** y a planes de pago.

**Comunidad grande (ej. 806 personas en un grupo) — ¿contradice la Fase 1?**  
**No.** Esas **806** son la **audiencia o comunidad**; la Fase 1 mira otra cosa: **cuánta gente hace *picos* de uso al mismo tiempo** (y cuánta soporta tu plan free).

| Idea | Cómo pensarlo |
|------|----------------|
| **806 en el grupo** | Son **quienes pueden enterarse**; no implica 806 *testers simultáneos*. |
| **“Pocos en Fase 1”** | Se refiere a **primera tanda de prueba controlada** + **evitar múltiples cientos en el mismo minuto** mientras el backend es free o mínimo. |
| **Promedio razonable para *comunicar* en Fase 1** | Decir, por ejemplo: *“Abrimos **voluntariado / primera tanda: ~30–50 personas** (o **hasta 80** si vamos por *lotes* y turnos de descarga). El resto del grupo entra en **rondas siguientes** cuando estabilicemos.”* Eso **llama atención** al grupo de forma honesta: todos saben que existen, pero el orden es **por estabilidad**, no por desaire. |
| **Si anunciás a todo el grupo “descarguen ya”** | El riesgo no es el número 806 en sí, sino **cuántos cliquean a la vez**; un solo mensaje con enlace en un chat activo puede generar un **pico** que en free se nota. Mejor: **enlace con cupo/turno**, fechas, o **lista** de voluntarios. |
| **Cuándo “sube el listón”** | Si ya pasaste a **Fase 2** (API+DB de pago, sin dormir), podés asumir **cientos** de usuarios **repartidos** o picos mayores, con un costo fijo (ver tablas de MXN). |

**Texto sugerido (podés copiar y adaptar):** *“Fase 1 (beta) es con **voluntari@s** y **rondas**: empezamos con una **primera tanda** de aprox. **X personas** (ej. 40–50) para afinar fallos. Las **800+** del grupo no quedan afuera: vamos abriendo **más tandas** según vayamos listos. Avisamos por este mismo canal.”*

**Comunicación en un grupo de WhatsApp (~806 personas, varios estados) — 50 de beta, ¿sí?**

- **Cifra:** 50 probadoras = **~6 %** del grupo (806 × 0,10 ≈ **81** sería un **10 %**; o sea, 50 es **conservador** y razonable para Fase 1 con infra free o mínima).  
- **¿Se podrá?** Sí, **sí** repartís el **pico** (ver abajo). El riesgo en WhatsApp no es “50 en el mes”, sino **50 bajando y registrándose en los mismos 15–20 minutos** tras un solo mensaje.  
- **Estrategia concreta (recomendada):**
  1. **Anuncio fijado o documento:** un mensaje fijo con enlace, formulario o instrucción “**cupo: 50 primeras inscripciones**” o “**lista de voluntariado** con fecha límite”, para que no haya fomo masivo ciego.  
  2. **Dos mitades (25 + 25):** *“Lote A — descarga del [día/hora]”* y una semana después *“Lote B”*; así bajas el pico simultáneo a la **mitad** sin cambiar el total.  
  3. **Por estados (opcional):** si tenés *admins* por región, podés abrir *“por ahora solo X y Y estados”* o *“una persona por club”* para repartir feedback geográfico — útil, no imprescindible.  
  4. **Canal de bugs:** un segundo grupo pequeño o hilo *solo* para probar, para no llenar el general de 806 con ruido.  
  5. **Si quisieras acercarte al 10 % (~80):** hacelo en **dos olas** (p. ej. 40 + 40 en semanas distintas) o ya con **Fase 2** (API+DB de pago) que aguanta picos mejores.  
- **Resumen para vos:** **50 en la beta por WhatsApp está bien**; es **prudente** frente a 806; el **%** no es 10, es ~6 %, y el truco no es bajar de 50 sino **no concentrar** las 50 descargas en un solo instante.

**Horarios reales de las rutas (L–V 20:00–23:00; S–D 8:00–11:00 o 20:00–23:00) — impacto en beta, picos y costos**

- **Contexto (RunSkateRoller en terreno):** en semana, las salidas se concentran **de noche (aprox. 20:00 a 23:00)**. En fin de semana, el horario **varía** (madrugada **8:00–11:00** o de nuevo **noche 20:00–23:00**). Eso no cambia el **precio fijo** del hosting en MXN (Render/Neon cobran **por plan**, no “por noche de rodada”), pero **sí** cambia **dónde y cuándo** se producen **picos** de uso y registro.  
- **Carga concentrada, no 24/7:** muchas personas abrirán calendario, mapa o notificaciones **en ventanas de ~3 h**, no repartido todo el día. Eso implica:  
  - **Ventaja:** en horas valle (mañana/día) la API y la DB hacen **poco**; en **free** a veces el servicio **enfría**; la **primera** petición a la noche puede tener **latencia** (cold start) hasta “despertar” el back.  
  - **Cuidado:** un **mismo corte** de hora (p. ej. 20:05) puede concentrar a **más gente a la vez** que si el uso fuera continuo. Ahí aplica de nuevo: **lotes 25+25** y no “bajen todos el viernes 20:00”.  
- **Beta: cómo afinar el mensaje a este patrón:**  
  1. Podés decir: *“Para probar, lo ideal es entrar al calendario / mapa en **horario de ruta** (L–V noche o finde según tengas rodada).”* Así el feedback y los bugs son **reales** al uso, no a las 2 de la mañana en vacío.  
  2. **Separar tandas** por franja: *“Lote A — probá principalmente noche de semana”* / *“Lote B — fin de semana (mañana o noche).”* Reparte picos y cubre distintos modos.  
- **Número de personas (sigue 50, con matices):** 50 sostiene, pero si **muchas** comparten el mismo **8:00–8:20 noche** en el mismo **estado**, el **pico concurrente** se acerca; por eso reforzamos lotes/estado o días. **No** hace falta bajar a 20 si hacés **ventanas** distintas.  
- **Costo en MXN:** el presupuesto de Fase 1/2/3 en las tablas **sigue válido**; el dato de horario **no suma renglón** “extra” de pago, pero explica **por qué** monitorear de **20:00 a 23:00** (y sábados **8:00–11:00**) si ves lentitud o 5xx. Con **Fase 2 (API+DB fijo)**, el cold start baja; si el free te pica en el arranque nocturno, es señal de subir fase, no de “otro costo misterioso”.  
- **Resumen una línea:** *Las rodadas se concentran en unas **ventanas** al día: usá eso para **comunicar** la beta, **repartir** tandas y **vigilar** el servidor a esas horas; el plan mensual de MXN no cambia por el horario, cambia el **cómo** (picos) y **cuándo** mirar el panel.*

**“Límites del free” — ¿cuáles?**  
Dependen del **proveedor concreto** (Neon, Railway, Render, etc.) y **cambian**; por eso debes mirar siempre el **panel** y la documentación actual. En la práctica suelen caer en estas **familias**:

| Tipo de límite | Qué significa en la vida real |
|----------------|-------------------------------|
| **Almacenamiento de la base** | La DB free trae un **techo** de GB; al llenarlo, toca borrar datos, optimizar o pagar. |
| **CPU / tiempo de cómputo** | Algunos planes limitan **horas** de procesamiento al mes (especialmente serverless). |
| **Conexiones o “cuota” de requests** | Demasiadas peticiones seguidas pueden **ralentizar** o cortar hasta el próximo ciclo de facturación. |
| **Servicio que “duerme” (cold start)** | Si nadie usa la API **un rato**, el servicio puede **apagarse** para ahorrar; el **primer** acceso después tarda **varios segundos** en “despertar”. Eso **no** es el mismo comportamiento que un backend **siempre caliente** de pago. |

Ninguno de esos límites impide **probar** registro, login y calendario; sí pueden **molestar** si prometes a un patrocinador “como Netflix” sin haber pasado a Fase 2.

**“No prometemos escala a cientos” — ¿qué es “escala” aquí?**  
**Escala** = que el sistema aguante **mucha carga al mismo tiempo**: muchas personas **en paralelo** (mismo momento) abriendo pantallas, refrescando el calendario o registrándose, con la API y la DB al **mismo** picos. En Fase 1 **no** estás diseñando (ni pagando) para ese escenario; validas que el **código** y los **flujos** funcionen. Cuando quieras **anunciar** a cientos o miles, **sube de fase** y de presupuesto.

**“24/7 de tienda” — ¿qué es?**  
Se refiere a un **compromiso tipo “app de producción comercial”**: el servicio **disponible**, **rápido** y **predecible** en **cualquier** hora, como esperarías de una app en App Store con muchas reseñas. En **free** suele ocurrir:

- **Cold start** (primera petición lenta tras inactividad).  
- **Sin SLA** (acuerdo formal de disponibilidad) en el sentido empresarial.

Por eso en Fase 1 no “vendes” a terceros que la app **nunca** fallará ni **siempre** será instantánea; en Fase 2, con API+DB de pago **sin dormir**, te acercas mucho más a ese nivel de **seriedad**.

**“Foco en bugs y flujos” — ¿a quién y en qué?**  

- **Bugs** = **errores en el código** o en la configuración: pantallas en blanco, 500 en la API, evento que no se guarda, login que falla en un caso concreto. El objetivo de Fase 1 es **encontrarlos y corregirlos** con un grupo pequeño antes de exponerte a mucha gente.  
- **Flujos** = **secuencias completas** que un usuario real hace: “registrarse → confirmar correo (si aplica) → iniciar sesión → ver listado de eventos → abrir un día en el calendario”. Validar que **todo el camino** funcione, no solo una pantalla suelta.  
- **A quién va dirigido:** a **vos y a quienes prueban** (testers): el **trabajo** es probar y reportar; **no** es todavía la fase de marketing masivo ni de prometer a sponsors un producto **maduro** a escala.

**Ventajas:** no comprometes 600–1 000 MXN/mes **desde el día 1**; subes el gasto cuando tengas señal de uso o de ingresos (sponsors, donaciones, cuotas, etc.).

**Opción 2 – Primera versión “completa” (más ambición técnica el día 1)**

- Incluyes: dominio, API siempre encendida, DB gestionada, email confiable, mapas cerca de producción, imágenes con CDN. Se acerca a la **fila D** (630–1 080 MXN/mes o más).  
- **Hazlo solo si** tienes colchón de **3–6 meses** de esa cuota aunque la app aún no monetice, o un ingreso que la cubra.  
- Mitigación: un solo proveedor (Render) **reduce** sorpresas; sigue activando **topes** y monitorización.

**Híbrido (recomendación práctica)**

- **v1 pública = fase 2** mínima (B/C): “completo” en **funcional** (auth, calendario en servidor, web), sin pagar todavía **todos** los extras.  
- **v1.1** suma lo que faltó (fase 3) cuando veas tráfico o ingresos.

---

## 12. Tabla comparativa corta (recordatorio)

| Opción | Front | API | DB | Total aprox. (MXN/mes) |
|--------|-------|-----|----|-------------------------|
| Recomendada (inicio) | Cloudflare/Vercel | Railway/Render | Neon/Supabase/Render | **0 – 450** |
| Estable un proveedor | Render static | Render | Render Postgres | **450 – 750** |
| Mínimo técnico | — | VPS | misma VPS | **120 – 350** + mantenimiento |

---

## 13. Estimado “primeros 3–6 meses” (escenario realista)

**Objetivo:** calendario y datos compartidos **estables** sin apagar el backend de noche.

- Front estático: **0**  
- API (un dyno/servicio pequeño siempre activo): **~150 – 280**  
- Postgres gestionado mínimo: **~120 – 220**  
- Email (dentro de free tier): **0**  
- Dominio prorrateado: **~20 – 30 / mes**  

**Banda total razonable:** **~290 – 530 MXN/mes**  
(Si te quedas solo en free tiers agresivos, puedes bajar a **~0 – 150**, con riesgo de límites o cold starts según proveedor.)

---

## 14. Próximos pasos (para afinar números)

- Definir si **WebSocket** en producción va en el **mismo** servicio que Express (afecta RAM mínima).  
- Estimar **MAU** y **requests/día** tras 1–2 meses en beta.  
- Decidir si **un solo proveedor** (Render) vs **mejor free tier** (Neon + Railway).

**Nota de tip de cambio:** los importes en USD de los sitios de Render/Railway/Neon cambian; convierte con el tipo del día al presupuestar.

---

## 15. Historial de documento

- **2026-03-05:** versión inicial (200–500 usuarios, stack Node + Postgres).  
- **2026-04-14:** stack actual (API centralizada, PostgreSQL, email, WebSocket); costeo primeros meses; recomendación free tiers / Render. **Ampliación:** tablas **por proveedor** (estilo Excel), **totales por escenario** (MXN/mes y MXN/año), **pago anual vs mensual** y **tarjeta / flujo de caja**; estrategia **por fases vs. v1 completa** (híbrido).

**Export a Excel / vista clara (misma carpeta del repositorio):**

- `RunSkateRoller-hosting-VISUAL.html` — abrir con el **navegador** (doble clic): tablas con formato legible; imprimible a PDF (Ctrl+P).
- `RunSkateRoller-hosting-proveedores.csv`, `RunSkateRoller-hosting-escenarios.csv`, `RunSkateRoller-hosting-flujo-caja.csv`, `RunSkateRoller-hosting-fases.csv`, `RunSkateRoller-hosting-comparativo.csv` — **doble clic** abre en **Excel**; si los acentos fallan, en Excel: *Datos → Desde texto/CSV* y codificación **UTF-8**.  
- `RunSkateRoller-paquete-ivan-suma.csv` — filas 8.1 a sumar + totales mes/año. `RunSkateRoller-plan-ivan-meses.csv` — plan mes 1…6.  
- **Sección 4 (nueva):** carta a **Iván** — recomendación en prosa; “no quedarnos en ceros en infra” explicado; fases 0–3 ligadas a desarrollo y a la caja; el HTML de vista incluye un resumen arriba.  
- **Secciones 8.1 y 8.2:** qué **filas** de la tabla de proveedores entran al pack de arranque, **suma fija** y **tabla mes a mes**.
