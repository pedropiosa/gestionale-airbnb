# Prompt maestro — Plataforma de alquiler vacacional multi-piso

Este documento contiene dos cosas:

1. **El prompt** (sección 1). Cópialo tal cual y pégalo en Claude Code / Cursor / el asistente que uses.
2. **Las decisiones abiertas y mis recomendaciones** (sección 2). Léelas antes de lanzar el prompt: hay cinco casillas que debes rellenar dentro del prompt y ahí explico qué elegiría yo y por qué.

---

## 1. EL PROMPT

> Copia desde aquí hasta el final de la sección 1.

---

### Rol

Actúas como un equipo senior de producto compuesto por: un **arquitecto de software** especializado en marketplaces de alojamiento, un **diseñador de producto UX/UI** con experiencia en e‑commerce de viaje (Airbnb, Booking, Vrbo), y un **especialista en pagos y cumplimiento normativo** para alquiler turístico en España e Italia.

No eres un generador de código genérico. Antes de escribir nada, razonas sobre reglas de negocio, casos límite de disponibilidad y consistencia de datos. Cuando una decisión tenga impacto en coste, cumplimiento legal o mantenibilidad, la señalas explícitamente y propones la opción por defecto que recomendarías, sin bloquear el avance.

### Objetivo

Construir una **web propia de reservas directas** para un pequeño propietario que gestiona varios pisos vacacionales por temporada. La web debe permitir al huésped descubrir los pisos, ver disponibilidad real, reservar y comunicarse en su propio idioma; y al propietario, gestionar calendario, precios, solicitudes y conversaciones desde un panel único.

No es un clon de Airbnb multi‑anfitrión: hay **un solo propietario** (o un equipo muy pequeño) y **N propiedades**. Optimiza para conversión directa y coste operativo bajo, no para escala de marketplace.

### Usuarios y sus objetivos

| Actor | Necesita |
|---|---|
| **Huésped** (no registrado) | Ver pisos, fotos, descripciones y disponibilidad; calcular precio total sin sorpresas; reservar en pocos pasos; escribir en su idioma. |
| **Huésped** (con reserva) | Ver el estado de su reserva, pagar, recibir instrucciones de llegada, chatear con el propietario. |
| **Propietario / admin** | Bloquear fechas, fijar precios por temporada, aceptar o rechazar solicitudes, responder mensajes sin saber el idioma del huésped, ver ingresos y ocupación. |

### Alcance funcional

#### 1. Escaparate público (catálogo)

- **Home** con presentación de la casa/marca, propuesta de valor, y un grid de tarjetas de piso. Cada tarjeta: foto principal, nombre, ubicación, capacidad, nº de dormitorios/baños, precio "desde" por noche y un indicador de disponibilidad próxima.
- **Buscador transversal** en la home: fechas de entrada/salida + nº de huéspedes → filtra y muestra **solo los pisos libres** en ese rango, con el precio total ya calculado para esas fechas. Este es el flujo principal de conversión; cuídalo.
- **Ficha de piso** con: galería de fotos (lightbox, lazy loading, formatos AVIF/WebP con *fallback*), descripción larga en varios idiomas, lista de equipamiento por categorías (cocina, baño, exterior, climatización, wifi con velocidad, parking), normas de la casa, capacidad, política de cancelación, mapa de zona (ubicación aproximada, radio, no dirección exacta hasta confirmar reserva), y **calendario de disponibilidad de 12 meses** navegable.
- **Widget de reserva** fijo (*sticky*) en la ficha: selector de fechas que bloquea visualmente días ocupados, selector de huéspedes, y **desglose de precio en tiempo real**: noches × tarifa + limpieza + tasa turística + extras − descuentos (semanal/mensual/última hora) = total. Nada de precios que cambian en el último paso.
- Página **"La zona"** (contenido SEO local: playas, restaurantes, cómo llegar) y página de **contacto**.
- **Multi‑idioma del escaparate**, con dos niveles deliberadamente distintos:
  - **Idiomas de interfaz y contenido** (traducción humana o revisada, nunca automática): **italiano, inglés y alemán**. Rutas localizadas (`/it/...`, `/en/...`, `/de/...`), `hreflang`, y meta/Open Graph por idioma. El italiano es el idioma por defecto.
  - **Idiomas de mensajería** (traducción automática, ver sección 5): además de los anteriores, **esloveno, checo y búlgaro**.
  - El **español no es prioritario**: puede añadirse más adelante como cuarto idioma de interfaz, pero no condiciona el diseño ni el orden de trabajo.
  - Detecta el idioma por `Accept-Language` y sugiere el cambio con un aviso descartable; **nunca redirijas por geolocalización** sin permitir volver, y recuerda la elección en cookie.

#### 2. Calendario y disponibilidad

- Modelo de **disponibilidad por noche** por propiedad. Una reserva ocupa las noches `[check_in, check_out)` — el día de salida queda libre para una entrada el mismo día.
- **Reglas configurables por propiedad y por temporada**: estancia mínima y máxima de noches, días de entrada/salida permitidos (p. ej. solo sábados en agosto), antelación mínima de reserva (*cutoff*), ventana máxima de reserva (p. ej. 18 meses), y días de bloqueo entre reservas (limpieza).
- **Temporadas y tarifas**: rangos de fechas con nombre (baja, media, alta, Navidad) y precio/noche. Posibilidad de sobrescribir el precio de una noche concreta. Recargos por huésped adicional a partir de N. Descuentos por estancia larga.
- **Bloqueos manuales** con motivo (uso propio, mantenimiento, reforma).
- **Sincronización iCal bidireccional**: exportar un `.ics` por propiedad e importar los `.ics` de Airbnb/Booking en un cron cada 15–30 min, para evitar dobles reservas si se sigue publicando en OTAs. Trata los eventos importados como bloqueos externos, marcados con su origen.
- **Prevención de doble reserva a nivel de base de datos**, no solo de aplicación: restricción de exclusión sobre rangos de fechas (en PostgreSQL, `EXCLUDE USING gist (property_id WITH =, daterange(check_in, check_out, '[)') WITH &&)` filtrando por estados que ocupan). Esta es la invariante crítica del sistema: si todo lo demás falla, esto no puede fallar.
- **Bloqueo temporal (*hold*)** de las fechas mientras el huésped completa el pago, con expiración automática (15 minutos) mediante un trabajo en segundo plano.

#### 3. Reservas

Máquina de estados explícita, sin estados implícitos:

```
BORRADOR → PENDIENTE_PAGO → (PENDIENTE_APROBACION) → CONFIRMADA → EN_CURSO → COMPLETADA
                 ↓                    ↓                    ↓
             EXPIRADA             RECHAZADA           CANCELADA
```

- **Dos modos de aceptación, configurables por propiedad y por temporada**:
  - *Instantánea*: el pago confirma la reserva automáticamente.
  - *Manual*: la solicitud queda retenida; el propietario tiene un plazo (24 h configurable) para aceptar o rechazar. El cobro se **preautoriza pero no se captura** hasta la aceptación; si se rechaza o expira, se libera sin cargo.
- Cada transición de estado registra actor, timestamp y motivo en un **log de auditoría** inmutable.
- **Emails transaccionales** en el idioma del huésped en cada transición: solicitud recibida, reserva confirmada, recordatorio de pago del saldo, instrucciones de llegada (7 días antes, con dirección exacta y códigos), petición de reseña tras la salida.
- **Cancelaciones** según política configurable (flexible / moderada / estricta) con cálculo automático del importe reembolsable y ejecución del reembolso parcial o total.
- Datos del huésped necesarios para el **registro de viajeros** (ver sección de cumplimiento).

#### 4. Pagos

- Pasarela: **Stripe** (Payment Intents + Stripe Checkout o Elements), con métodos locales activados: tarjeta, Apple/Google Pay, Bizum si está disponible, SEPA para estancias largas.
- **Dos esquemas de cobro, configurables**:
  - *Pago total* en el momento de reservar.
  - *Depósito + saldo*: X % al reservar (recomendado 30 %) y el resto cobrado automáticamente N días antes de la llegada, con la tarjeta guardada como método fuera de sesión (`setup_future_usage`), avisando por email 3 días antes del cargo.
- **Fianza / depósito de daños** opcional: preautorización sin captura sobre la tarjeta desde 48 h antes de la llegada, liberada automáticamente 72 h después de la salida si el propietario no reclama.
- **SCA / 3D Secure obligatorio**, gestionado por Stripe.
- **Webhooks de Stripe como fuente de verdad** del estado del pago, con verificación de firma, procesamiento **idempotente** y reintentos. Nunca confirmes una reserva desde el `redirect` del navegador.
- Registro de todos los movimientos (cargo, captura, reembolso, disputa) en una tabla de `payments` enlazada a la reserva.
- **Nunca** almacenes datos de tarjeta en tu base de datos. Solo tokens de Stripe.

#### 5. Mensajería multilingüe con traducción automática

Es la pieza diferencial. Especificación:

- **Hilo de conversación por reserva o consulta**, accesible por el huésped mediante enlace mágico (sin obligarle a crear cuenta y contraseña) y por el propietario desde el panel.
- Cada mensaje almacena: **texto original**, **idioma detectado del original**, y **N traducciones** en una tabla hija (`message_translations`: `message_id`, `lang`, `text`, `engine`, `created_at`). El original nunca se sobrescribe.
- **Idiomas de huésped soportados, por volumen real de clientes**: italiano, alemán, esloveno, checo, búlgaro, e inglés como comodín para el resto. Ese orden importa: es el de prioridad para pruebas, plantillas y revisión de calidad.
- **Flujo huésped → propietario**: el huésped escribe en su lengua materna. El sistema detecta el idioma y genera traducciones al **italiano** (idioma del propietario) y al **inglés** (para verificación y para cualquier gestor que no hable italiano). El propietario ve el italiano por defecto, con enlace a "ver original".
- **Flujo propietario → huésped**: el propietario escribe en italiano. El sistema traduce automáticamente a la **lengua materna del huésped** (la detectada en su primer mensaje, o la del navegador/perfil) y también al inglés. El huésped ve su idioma con opción de ver el original y el inglés.
- **Alfabeto cirílico**: el búlgaro exige revisar tipografía (fuente con cobertura cirílica completa), longitud de texto en la interfaz y ordenación/búsqueda. Pruébalo explícitamente, no lo asumas.
- **Indicador visible de "traducido automáticamente"** en todo mensaje traducido, con el original a un clic. Es un requisito de confianza, no un adorno.
- **Motor de traducción**: capa de abstracción `TranslationProvider` con implementaciones intercambiables. **DeepL como principal** — cubre italiano, alemán, esloveno, checo y búlgaro, y su calidad en alemán y checo es claramente superior a la de Google. Respaldo con un LLM (Claude) o Google Translate. Si el proveedor falla, el mensaje se entrega igualmente con el original y la traducción se reintenta en segundo plano — **nunca bloquees la entrega de un mensaje por un fallo de traducción**.
- **Caché de traducciones** por hash del texto + par de idiomas, para no pagar dos veces lo mismo (las plantillas y respuestas frecuentes se repiten mucho).
- **Respuestas rápidas** (plantillas) pre‑traducidas a los idiomas soportados: check‑in, wifi, parking, mascotas, salida tardía.
- **Notificaciones**: email al propietario con el mensaje ya traducido a su idioma, y email al huésped en el suyo, ambos con enlace directo al hilo.
- Moderación básica: bloquea o marca intentos de sacar la conversación fuera de la plataforma antes de la confirmación si eso te interesa comercialmente (opcional).

#### 6. Canales de contacto

- **Chat interno** (el del punto 5) como canal principal para todo lo relacionado con una reserva: deja rastro, es traducible y es auditable.
- **Botón flotante de WhatsApp** (`wa.me` con mensaje pre‑rellenado que incluye el nombre del piso y las fechas consultadas) para consultas previas rápidas. Es el canal que más convierte en España e Italia; no lo omitas. Advertencia: WhatsApp **no** pasa por la capa de traducción, así que úsalo para consultas cortas y reconduce al chat interno la conversación de la reserva.
- **Email** de contacto visible + formulario de contacto con protección anti‑spam (honeypot + rate limiting, o Turnstile).
- **Teléfono** opcional con horario de atención indicado.
- Todos los canales visibles desde la ficha de piso y desde el footer, con los mismos datos en todos los idiomas.

#### 7. Panel del propietario

- **Dashboard**: próximas entradas y salidas, solicitudes pendientes de aprobar (con cuenta atrás del plazo), mensajes sin responder, ingresos del mes, ocupación por propiedad.
- **Calendario multi‑propiedad** tipo *timeline* (propiedades en filas, días en columnas) con arrastrar para bloquear, y vista de calendario individual por piso.
- **Gestor de tarifas**: edición masiva por rango de fechas y por temporada.
- **Gestión de propiedades**: contenido, fotos (subida múltiple, reordenación, texto alternativo por idioma), equipamiento, normas, políticas.
- **Bandeja de mensajes** unificada con traducción integrada.
- **Reservas**: listado filtrable, ficha de reserva con línea temporal de eventos, acciones (aceptar, rechazar, cancelar, reembolsar, reenviar instrucciones).
- **Informes**: ingresos por propiedad y mes, tasa de ocupación, ADR, exportación CSV para la gestoría.
- Autenticación con 2FA y roles (`propietario`, `gestor`, `limpieza` con acceso solo a calendario de entradas/salidas).

### Requisitos no funcionales

- **Rendimiento**: LCP < 2,5 s en 4G en la ficha de piso. Imágenes optimizadas y servidas desde CDN en varios tamaños. El escaparate debe ser estático o renderizado en servidor con caché; solo el widget de disponibilidad consulta datos en vivo.
- **Móvil primero**. La mayoría del tráfico y de las reservas llegará desde el móvil. Diseña el flujo de reserva y el selector de fechas pensando en el pulgar, no en el ratón.
- **Accesibilidad AA**: navegación por teclado completa en el calendario, contraste suficiente, `alt` en todas las fotos, foco visible, `aria-live` para el precio que se recalcula.
- **SEO**: datos estructurados `schema.org/LodgingBusiness` y `Accommodation`, sitemap multi‑idioma, meta y Open Graph por piso e idioma, URLs limpias y legibles.
- **Zonas horarias**: guarda todo en UTC; las fechas de estancia son fechas civiles (`DATE`), no instantes — no las conviertas nunca a UTC como *timestamps* o perderás un día.
- **Dinero**: enteros en céntimos, nunca coma flotante. Moneda explícita en cada importe.
- **Observabilidad**: logs estructurados, trazas de errores (Sentry), alerta cuando falle un webhook de pago, una sincronización iCal o una traducción.
- **Copias de seguridad** diarias de la base de datos con restauración probada.

### Cumplimiento legal (impórtalo desde el día uno, no lo dejes para el final)

- **RGPD**: base legal por finalidad, aviso de privacidad, banner de cookies con consentimiento previo real, minimización de datos, derecho de acceso y supresión, plazos de retención, y **contrato de encargado de tratamiento con el proveedor de traducción** — estás enviando texto de un tercero a un servicio externo, y eso debe estar declarado en la política de privacidad.
- **España**: registro obligatorio de viajeros y comunicación a las autoridades (SES.HOSPEDAJES, Real Decreto 933/2021); número de registro de vivienda turística y de la Ventanilla Única Digital de Arrendamientos visible en el anuncio; normativa autonómica de la comunidad correspondiente; tasa turística municipal si aplica.
- **Italia**: `Codice Identificativo Nazionale` (CIN) visible en el anuncio, comunicación de huéspedes a *Alloggiati Web* (Polizia di Stato), ISTAT y `tassa di soggiorno` municipal.
- **Facturación**: numeración correlativa, IVA/IVA turístico según régimen, y datos fiscales del propietario en las facturas.
- **Términos y condiciones** y política de cancelación aceptadas explícitamente (casilla no premarcada) antes de pagar, con registro de versión y timestamp del consentimiento.

> No inventes números de registro ni afirmes cumplimiento normativo: deja los campos configurables y documenta qué debe rellenar el propietario.

### Stack propuesto

**Criterio rector: el propietario no es programador y mantendrá esto con ayuda de un asistente de IA.** Prioriza *pocas piezas móviles* sobre *arquitectura elegante*. Cada servicio adicional es una cuenta más, una factura más, un sitio más donde algo puede romperse a las 23:00 de un sábado de agosto. Rechaza cualquier complejidad que no esté pagando su coste de mantenimiento.

Stack fijado (no lo cambies sin una razón de peso):

- **Un solo repositorio, un solo despliegue**: **Next.js (App Router) + TypeScript**. Frontend y API en el mismo proyecto (Route Handlers). Nada de backend separado.
- **Estilos**: Tailwind CSS + shadcn/ui. Componentes que se copian al repo, sin dependencia que se rompa al actualizar.
- **i18n**: `next-intl`, con los textos en ficheros JSON por idioma — editables sin tocar código.
- **Base de datos, auth y almacenamiento de fotos**: **Supabase** (PostgreSQL gestionado + Auth + Storage en un solo servicio). Acceso desde el servidor con Drizzle o Prisma. La restricción de exclusión de rangos se crea con una migración SQL escrita a mano; el ORM no la genera.
- **Tareas programadas**: **Vercel Cron** llamando a Route Handlers protegidos por secreto (expirar *holds*, sync iCal, cobrar el saldo, reintentar traducciones). **Sin Redis y sin cola de trabajos** — a este volumen no hacen falta y duplican la superficie de mantenimiento.
- **Pagos**: Stripe (Checkout alojado siempre que sea posible, para no gestionar formularios de tarjeta).
- **Traducción**: DeepL API + caché en la propia base de datos.
- **Email**: Resend, con plantillas por idioma.
- **Despliegue**: Vercel conectado a GitHub. Cada push despliega; cada rama genera una vista previa.

Total: **cuatro cuentas externas** (Vercel, Supabase, Stripe, DeepL) más el email. Ese es el techo de complejidad operativa aceptable.

Reglas de mantenibilidad que debes respetar al escribir el código:

- Nombres de fichero, funciones y variables **descriptivos en inglés**, sin abreviaturas crípticas.
- **Comentarios en las reglas de negocio** (precios, disponibilidad, estados de reserva) explicando el *porqué*, para que el propietario y un asistente puedan retomarlas meses después.
- Los valores que el propietario querrá cambiar (porcentaje de depósito, días de antelación, plazo de aprobación, mínimo de noches) van en **base de datos o variables de entorno**, nunca escritos a fuego en el código.
- Estructura de carpetas plana y previsible; evita capas de abstracción que solo se usan una vez.
- Un `README.md` que un no‑programador pueda seguir para arrancar el proyecto en local.

### Diseño visual

- Estética **cálida y editorial**, no corporativa: la foto manda. Fondo neutro claro, una tipografía con carácter para titulares y una neutra muy legible para el cuerpo, un color de acento derivado del entorno de los pisos (mar, piedra, terracota…).
- Tarjetas con esquinas redondeadas suaves, sombras discretas, mucho espacio en blanco. Nada de degradados morados ni de estética de plantilla SaaS.
- **Sistema de diseño con tokens** (color, espaciado, tipografía, radios) definidos en un único sitio, modo claro y oscuro coherentes.
- Estados vacíos, de carga (*skeletons*) y de error diseñados, no improvisados.
- Microcopy en tono cercano y humano, revisado en cada idioma. Nada de traducciones literales del italiano al alemán: el alemán ocupa un 30–40 % más de espacio, así que **valida el layout con el alemán, no con el inglés** — si aguanta ahí, aguanta en todos.

### Cómo debes trabajar

1. **Primero pregunta** solo lo imprescindible que no puedas asumir razonablemente (ver "Datos que necesito" abajo). Para todo lo demás, elige un valor por defecto sensato, decláralo y sigue.
2. Entrega un **plan por fases** antes de escribir código, con lo que incluye cada fase y qué queda fuera.
3. Implementa por fases, dejando la aplicación funcionando y desplegable al final de cada una.
4. **Tests** obligatorios en la lógica crítica: cálculo de precio, solapamiento de fechas, transiciones de estado de reserva, webhooks idempotentes, expiración de *holds*. Aquí no valen "tests de humo".
5. **Seed de datos realista**: 4 pisos con fotos de ejemplo, temporadas, reservas pasadas y futuras, y una conversación multilingüe de muestra. Nada de "Lorem ipsum".
6. Documenta en `README.md` cómo arrancar en local, qué variables de entorno hacen falta (con `.env.example`, sin secretos reales) y cómo desplegar.
7. Señala cualquier decisión que tenga coste recurrente (Stripe, DeepL, CDN, hosting) con una estimación mensual aproximada.

### Fases sugeridas

| Fase | Contenido | Resultado |
|---|---|---|
| **0** | Arquitectura, modelo de datos, sistema de diseño, esqueleto del proyecto | Repo con base sólida y decisiones documentadas |
| **1** | Escaparate público multi‑idioma + fichas + calendario de solo lectura + formulario de contacto + WhatsApp | Web publicable que ya capta consultas |
| **2** | Motor de disponibilidad y precios + panel del propietario + gestión de contenido | El propietario ya gestiona todo desde dentro |
| **3** | Reservas online + Stripe + aprobación automática/manual + emails transaccionales | Reservas directas cobrando |
| **4** | Mensajería con traducción automática + notificaciones | El canal diferencial funcionando |
| **5** | Sync iCal, informes, registro de viajeros, reseñas, optimización SEO y rendimiento | Operación completa |

### Criterios de aceptación (verificables)

- Dos reservas simultáneas sobre las mismas fechas: la segunda **falla en base de datos**, no solo en la interfaz.
- El precio mostrado en la ficha coincide **exactamente** con el importe cobrado por Stripe, hasta el céntimo.
- Un webhook de Stripe reenviado tres veces produce **un solo** cambio de estado y **un solo** email.
- Un *hold* no pagado libera las fechas automáticamente a los 15 minutos.
- Un mensaje escrito en búlgaro llega al propietario en italiano y en inglés, con el original accesible, y la respuesta que el propietario escribe en italiano llega al huésped en búlgaro. Repite la prueba con esloveno, checo y alemán.
- El texto en cirílico se renderiza correctamente y no desborda ningún componente de la interfaz.
- Si DeepL devuelve error, el mensaje se entrega igualmente y la traducción aparece después sin intervención manual.
- La ficha de piso pasa Lighthouse con ≥ 90 en rendimiento, accesibilidad y SEO en móvil.
- Cambiar de idioma mantiene la página, las fechas seleccionadas y el estado del formulario.

### Datos que necesito antes de empezar

Pregúntame estos y solo estos; para el resto, asume y avísame de lo asumido:

1. Número de pisos, ciudad(es) y país(es) donde están (determina qué normativa aplica).
2. ¿Pago total o depósito? Si depósito: porcentaje y cuántos días antes se cobra el saldo.
3. ¿Aceptación de reservas automática o manual? ¿Igual para todas las propiedades y temporadas?
4. ¿Se sigue publicando en Airbnb/Booking? (determina si el sync iCal es crítico o secundario)
5. Presupuesto mensual aceptable para servicios de terceros.

Ya está decidido y **no lo preguntes**: los idiomas (interfaz en italiano, inglés y alemán; mensajería además en esloveno, checo y búlgaro; italiano por defecto; español no prioritario) y el stack técnico de la sección anterior.

> Fin del prompt.

---

## 2. DECISIONES ABIERTAS — MI RECOMENDACIÓN

Estas son las cinco casillas que dejaste sin cerrar. Puedes lanzar el prompt tal cual y responder cuando te pregunte, pero te ahorras una ronda si decides ahora.

### 2.1 ¿Pago total o fianza?

**Recomendación: depósito del 30 % al reservar + saldo cobrado automáticamente 14 días antes de la llegada.** Añade la fianza por daños como preautorización opcional solo si tus pisos lo justifican.

El motivo: el pago total por adelantado es lo mejor para tu caja, pero es exactamente donde más carritos se abandonan en reserva directa, porque el huésped que no te conoce compara con Airbnb, donde paga en dos plazos. El 30 % cubre de sobra tu riesgo de cancelación (limpieza + margen) y baja mucho la fricción psicológica. Para estancias que empiezan en menos de 21 días, cobra el 100 % directamente: no hay tiempo para dos cargos.

La **fianza por daños es un asunto distinto del depósito de reserva** y conviene no mezclarlos en la interfaz ni en el código. Si la pones, hazla como preautorización (retención sin cargo) 48 h antes de la llegada, no como cobro con devolución posterior. Para pisos vacacionales estándar, mi consejo es **no** poner fianza y absorber el riesgo — el coste de gestionarla y las fricciones que genera suelen superar los daños reales.

#### Retención sin cargo vs. cobro con devolución

Se parecen en la pantalla del huésped y no se parecen en nada por debajo:

| | Cobro con devolución | Retención sin cargo (*hold*) |
|---|---|---|
| Movimiento de dinero | Sale de su cuenta y entra en la tuya | Ninguno: solo se reserva crédito |
| Cómo lo ve el huésped | Cargo real en el extracto | Importe "pendiente", crédito no disponible |
| Al liberarlo | Reembolso que tarda 5–10 días hábiles | Caduca solo, sin hacer nada |
| Comisión | La del cargo original **no se recupera** al reembolsar | Ninguna si no se captura |
| Cobro parcial | Devolución parcial calculada a mano | Capturas solo lo que necesitas (80 € de 300 €) |
| Límite de tiempo | Sin límite | ~7 días en tarjeta (Stripe) |

En Stripe es el mismo `PaymentIntent` con `capture_method: 'manual'`: creas la retención y después o llamas a `capture`, o la dejas expirar. Como la retención de tarjeta caduca a los 7 días, la fianza se crea **48 h antes de la llegada**, no al reservar.

La contrapartida a tener presente: aunque el dinero no salga, **el crédito disponible del huésped sí baja**. Quien llega con la tarjeta justa tras pagar el viaje puede quedarse sin margen en destino. Si retienes, avisa por email dos días antes.

Este mismo mecanismo es el que hace que la **aprobación manual** no duela: retienes al solicitar, capturas al aceptar, dejas caducar al rechazar. El huésped rechazado nunca ve un cargo seguido de una devolución en su extracto.

### 2.2 ¿Aceptación automática o manual?

**Recomendación: híbrido.** Automática por defecto, con reglas que fuercen la revisión manual cuando: la estancia empieza en menos de 48 h, dura más de 21 noches, el número de huéspedes es el máximo de la propiedad, o cae en fechas señaladas (Nochevieja, festivales locales).

La aceptación automática convierte muchísimo mejor y evita que pierdas reservas por responder tarde. El riesgo real (fiestas, huéspedes problemáticos) se concentra en unos pocos patrones que puedes detectar con reglas. Empieza en manual las primeras semanas hasta que te fíes del sistema, y pasa a automática después: el prompt ya lo deja configurable por propiedad y temporada, así que es un cambio de ajuste, no de código.

Importante en modo manual: **preautoriza, no cobres.** Cobrar y devolver si rechazas es una mala experiencia y te cuesta comisiones.

### 2.3 ¿Chat interno o WhatsApp?

**Los dos, con papeles distintos.** WhatsApp para la consulta previa (es el canal que la gente en España e Italia usa de verdad y el que más convierte), chat interno para todo lo que ocurre desde que hay una reserva.

La razón para no dejarlo todo en WhatsApp es precisamente tu requisito de traducción: WhatsApp no pasa por tu capa de traducción y no deja rastro auditable ligado a la reserva. La razón para no dejarlo todo en el chat interno es que obligar a un desconocido a registrarse para preguntar "¿admite mascotas?" te cuesta consultas. Enlace mágico por email en el chat interno (sin contraseña) reduce mucho esa fricción.

### 2.4 Idiomas y motor de traducción

Tu mezcla real de clientes es **italiano > alemán > esloveno > checo > búlgaro**, y eso cambia el diseño: el español deja de ser prioritario y el alemán pasa a ser el segundo idioma de peso.

**Separa dos cosas que suelen confundirse:**

- **Idiomas del escaparate** (contenido comercial, traducido a mano): **italiano, inglés y alemán**. Solo tres. Añadir esloveno, checo y búlgaro al sitio web significa mantener seis versiones de cada descripción de piso cada vez que cambias una frase, y esos tres públicos navegan sin problema en inglés o alemán. No pagues ese coste.
- **Idiomas de la mensajería** (traducción automática): **los seis**. Aquí sí, porque escribir a máquina en tu propio idioma sobre las llaves y el aparcamiento es donde el cliente agradece de verdad no tener que pelearse en inglés. Es tu diferencial y es barato de mantener.

**DeepL sigue siendo la elección correcta**, y con tu mezcla lo es aún más: cubre esloveno, checo y búlgaro, y en alemán y checo su ventaja sobre Google es notable en texto conversacional. Miles de mensajes al mes te cuestan pocos euros.

Dos cosas que no debes saltarte con este mix:

- El **búlgaro va en cirílico**. Elige una tipografía con cobertura cirílica completa y prueba que no rompe la interfaz: el texto cambia de longitud y hay componentes que se desbordan.
- El **alemán es el idioma que más se alarga** al traducir (30–40 % más largo que el inglés). Si el diseño de los botones y las tarjetas aguanta el alemán, aguanta todo lo demás. Úsalo como caso de prueba del layout.

Y sigue en pie lo de antes: declara la traducción en tu política de privacidad, porque estás enviando texto escrito por el huésped a un tercero.

### 2.5 ¿Construir esto desde cero?

Te lo digo con franqueza porque es la decisión con más impacto: **lo que describes es un proyecto de varios meses**, y existen productos (Lodgify, Smoobu, Hostaway, Guesty) que traen el 80 % hecho por 30–100 €/mes.

Aun así, construirlo tiene sentido en tu caso por dos razones concretas: la **mensajería con traducción bidireccional automática no la hace bien ninguno** de esos productos, y las reservas directas te ahorran el 15–20 % de comisión de las OTAs de forma permanente. Si el volumen es de 4 pisos y te importa el control, adelante.

Mi consejo táctico: **no construyas las fases 0–5 de golpe.** Lanza la fase 1 (escaparate + WhatsApp + formulario) en dos o tres semanas y empieza a captar reservas gestionadas a mano por email. Con las primeras conversaciones reales sabrás muchísimo mejor cómo debe funcionar el motor de reservas, y habrás validado la demanda antes de escribir la parte cara.

### 2.6 ¿Qué stack es más manejable si lo hacemos juntos?

Pediste "el que sea más fácil y gestionable con tu ayuda", y eso tiene una respuesta bastante clara: **Next.js + Supabase + Vercel + Stripe**, todo en un único repositorio.

El razonamiento no es que sea la tecnología más potente, sino que minimiza las piezas que tú tendrías que entender y mantener:

- **Un repo, un despliegue.** Web y API viven juntas. No hay dos proyectos que sincronizar ni dos despliegues que puedan quedarse descompasados.
- **Supabase te da tres cosas en una cuenta**: base de datos PostgreSQL de verdad (que necesitas para la restricción anti‑doble‑reserva), login y almacenamiento de fotos. La alternativa sería montar tres servicios distintos.
- **Vercel despliega solo** en cada push a GitHub, y cada rama genera una URL de vista previa donde puedes ver un cambio antes de publicarlo. Para trabajar conmigo esto vale mucho: te enseño un enlace, tú lo miras en el móvil, decides.
- **He quitado Redis y la cola de trabajos** que llevaba la versión anterior del prompt. A cuatro pisos no aportan nada y son dos cosas más que pueden caerse. Las tareas periódicas van con Vercel Cron, que es una línea de configuración.

Quedan **cuatro cuentas externas**: Vercel, Supabase, Stripe y DeepL. Ese es el techo que yo no pasaría. En plan gratuito o básico, hasta que haya volumen real, el coste ronda los 25–45 €/mes.

Sobre TypeScript: añade algo de verbosidad, pero detecta errores antes de que lleguen a producción y —esto importa para nuestro caso— hace que un asistente de IA se equivoque bastante menos al modificar código que no escribió. Merece la pena.

---

## 3. Cómo usar el prompt

1. Rellena en la sección "Datos que necesito" las respuestas a las seis preguntas (o deja que te las pregunte).
2. Pega el prompt completo en una sesión nueva del asistente.
3. Pídele primero **solo la fase 0** y revisa el modelo de datos y las decisiones antes de dejarle escribir la aplicación entera. El modelo de datos de disponibilidad y precios es lo que más caro sale de cambiar después.
4. Al empezar cada fase, vuelve a pegar el prompt como contexto y añade "implementa la fase N".
