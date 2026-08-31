# Prompt maestro — Plataforma de alquiler vacacional multi-piso

Proyecto: 7 apartamentos vacacionales en **Bibione** (Véneto, Italia), con posible incorporación de 4 más de un segundo propietario.

Este documento contiene dos cosas:

1. **El prompt** (sección 1). Cópialo tal cual y pégalo en Claude Code / Cursor / el asistente que uses. Las decisiones de ubicación, idiomas, aprobación, precios y stack ya están cerradas dentro del prompt; solo queda por decidir el esquema de cobro.
2. **Las recomendaciones razonadas** (sección 2), incluida la comparativa de retención frente a cobro con devolución y el análisis de costes de alojamiento.

---

## 1. EL PROMPT

> Copia desde aquí hasta el final de la sección 1.

---

### Rol

Actúas como un equipo senior de producto compuesto por: un **arquitecto de software** especializado en marketplaces de alojamiento, un **diseñador de producto UX/UI** con experiencia en e‑commerce de viaje (Airbnb, Booking, Vrbo), y un **especialista en pagos y cumplimiento normativo** para alquiler turístico en Italia (Véneto).

No eres un generador de código genérico. Antes de escribir nada, razonas sobre reglas de negocio, casos límite de disponibilidad y consistencia de datos. Cuando una decisión tenga impacto en coste, cumplimiento legal o mantenibilidad, la señalas explícitamente y propones la opción por defecto que recomendarías, sin bloquear el avance.

### Objetivo

Construir una **web propia de reservas directas** para apartamentos vacacionales en **Bibione** (San Michele al Tagliamento, provincia de Venecia, Véneto, Italia). La web debe permitir al huésped descubrir los pisos, ver disponibilidad real, reservar y comunicarse en su propio idioma; y al propietario, gestionar calendario, precios, solicitudes y conversaciones desde un panel único.

### Contexto concreto (no lo generalices)

- **7 apartamentos** de un propietario principal, con la posibilidad de incorporar **4 más de un segundo propietario**. El sistema debe ser **multi‑propietario desde el modelo de datos**, aunque la interfaz arranque mostrando uno solo (ver "Multi‑propietario" más abajo).
- **Destino de playa fuertemente estacional**: la temporada va aproximadamente de mayo a septiembre, con el pico en agosto. De octubre a abril el tráfico y las reservas son casi nulos, pero **es justo cuando se reserva el verano siguiente**: la web tiene que estar viva y rápida todo el año aunque casi no se use, y el pico de agosto tiene que aguantarse sin caerse.
- **Público real, medido sobre 220 reservas y 861 huéspedes registrados en 2025–2026** (formularios de Croce del Sud y Via del Mare; no incluye Andromeda):
  - Por reserva, según la nacionalidad del titular: **Alemania 42,7 %, Italia 16,4 %, Austria 10,5 %, Chequia 7,3 %, Hungría 5,0 %, Polonia 3,6 %, Eslovaquia 3,6 %, Suiza 2,3 %, Rumanía 1,8 %**. Eslovenia, apenas un 0,9 %.
  - **El bloque germanófono (Alemania + Austria + Suiza) es el 55 % de las reservas.** El alemán no es el segundo idioma: es el primero en volumen real.
  - El bloque de Europa central (Chequia, Eslovaquia, Hungría, Polonia) suma un 19,5 %.
  - **El 75 % de las llegadas son en sábado y la estancia mediana es de 7 noches** — el formato semanal sábado a sábado no es una costumbre local que respetar, es lo que ya hace tres de cada cuatro clientes.
  - **Grupos familiares**: media de 3,9 personas por reserva, un 16 % son grupos de 6 o más, y en torno al 25 % de los huéspedes son menores de 12 años. Diseña pensando en familias, no en parejas.
  - Un 13 % de las reservas mezclan nacionalidades dentro del mismo grupo: el idioma se decide por huésped, no por reserva.
- **Los pisos se siguen publicando en Airbnb**, así que la sincronización de calendarios no es opcional (ver sección 2).
- Costumbre local que debes respetar en el motor de precios: en temporada alta el alquiler se comercializa **por semanas, de sábado a sábado**, no por noches sueltas.

No es un clon de Airbnb multi‑anfitrión abierto: son **dos propietarios como mucho** y una docena de propiedades. Optimiza para conversión directa y coste operativo bajo, no para escala de marketplace.

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
  - **Idiomas de mensajería** (traducción automática, ver sección 5): además de los anteriores, **polaco, checo, eslovaco y húngaro** (lista provisional, pendiente de cerrar). Debe poder añadirse un idioma nuevo insertando una fila en la base de datos, sin tocar código.
  - El **español no es prioritario**: puede añadirse más adelante como cuarto idioma de interfaz, pero no condiciona el diseño ni el orden de trabajo.
  - Detecta el idioma por `Accept-Language` y sugiere el cambio con un aviso descartable; **nunca redirijas por geolocalización** sin permitir volver, y recuerda la elección en cookie.

#### 2. Calendario y disponibilidad

- Modelo de **disponibilidad por noche** por propiedad. Una reserva ocupa las noches `[check_in, check_out)` — el día de salida queda libre para una entrada el mismo día.
- **Reglas configurables por propiedad y por temporada**: estancia mínima y máxima de noches, días de entrada/salida permitidos (p. ej. solo sábados en agosto), antelación mínima de reserva (*cutoff*), ventana máxima de reserva (p. ej. 18 meses), y días de bloqueo entre reservas (limpieza).
- **Temporadas y tarifas** — es el corazón del sistema y debe ser **totalmente configurable por el propietario desde el panel, sin tocar código**:
  - **Temporadas** definidas como rangos de fechas con nombre y color (bassa, media, alta, altissima / Ferragosto), creadas y editadas por el propietario. Cada propiedad puede usar el calendario de temporadas común o tener el suyo.
  - **Dos modos de tarificación conviviendo**, seleccionables por temporada:
    - **Por noche** (temporada baja y media): precio/noche de la temporada.
    - **Por semana, sábado a sábado** (temporada alta): precio cerrado por semana. Es como se comercializa realmente en Bibione y el huésped alemán o checo lo espera así. En estas temporadas, el selector de fechas debe **ofrecer solo sábados** como entrada y salida.
  - **Listino anual**: vista de tabla donde el propietario ve y edita de un vistazo el precio de cada semana del año para cada apartamento, con edición masiva por rango. Debe poder **duplicar el listino de un año al siguiente** y ajustarlo por porcentaje — es la tarea que hará cada invierno.
  - **Sobrescritura puntual**: precio distinto para una noche o una semana concreta, que prevalece sobre la temporada.
  - **Suplementos y extras configurables**: limpieza final, ropa de cama y toallas, cuna, mascota, plaza de garaje, aire acondicionado, llegada fuera de horario, huésped adicional a partir de N. Cada uno: obligatorio u opcional, por estancia o por persona/noche, y con IVA propio.
  - **Descuentos**: estancia larga, reserva anticipada (*prenota prima*), última hora. Con fechas de validez.
  - **Imposta di soggiorno**: importe por persona y noche, con exención por edad configurable y tope de noches gravadas. Se muestra por separado en el desglose y debe poder marcarse como "se paga en destino" o "se cobra online".
  - Todos los precios en **céntimos de euro**, y todo cambio de tarifa queda registrado con autor y fecha.
- **Simulador de precio** en el panel: el propietario introduce fechas y huéspedes y ve exactamente el mismo desglose que vería el cliente. Sirve para verificar el listino antes de publicarlo.
- **Bloqueos manuales** con motivo (uso propio, mantenimiento, reforma).
- **Sincronización iCal bidireccional — requisito crítico, no opcional**: los pisos siguen publicados en Airbnb, así que exporta un `.ics` por propiedad e importa los `.ics` de Airbnb (y de cualquier otro portal) con un cron **cada 15 minutos**. Trata los eventos importados como bloqueos externos marcados con su origen, y no los borres nunca automáticamente sin dejar rastro.
  - **Asume que iCal llega tarde.** Airbnb refresca los calendarios importados cada pocas horas, no en tiempo real, así que existe una ventana en la que una reserva hecha en Airbnb todavía no se ve en tu web. Es el riesgo operativo número uno del proyecto.
  - Mitigaciones que debes implementar: **aprobación manual** en temporada alta (el propietario comprueba antes de aceptar), **aviso destacado en el panel** cuando una sincronización falle o lleve más de 1 hora sin completarse, y **alerta inmediata** si al importar se detecta un solapamiento con una reserva propia ya confirmada, con instrucciones claras de qué hacer.
  - Registra en el panel la hora de la última sincronización correcta de cada propiedad, visible junto al calendario.
- **Prevención de doble reserva a nivel de base de datos**, no solo de aplicación: restricción de exclusión sobre rangos de fechas (en PostgreSQL, `EXCLUDE USING gist (property_id WITH =, daterange(check_in, check_out, '[)') WITH &&)` filtrando por estados que ocupan). Esta es la invariante crítica del sistema: si todo lo demás falla, esto no puede fallar.
- **Bloqueo temporal (*hold*)** de las fechas mientras el huésped completa el pago, con expiración automática (15 minutos) mediante un trabajo en segundo plano.

#### 3. Reservas

Máquina de estados explícita, sin estados implícitos:

```
BORRADOR → PENDIENTE_PAGO → (PENDIENTE_APROBACION) → CONFIRMADA → EN_CURSO → COMPLETADA
                 ↓                    ↓                    ↓
             EXPIRADA             RECHAZADA           CANCELADA
```

- **Dos modos de aceptación, configurables por propiedad y por temporada.** **Arranca con aprobación MANUAL en todas las propiedades** — es la decisión tomada — pero el modo debe ser un simple interruptor en el panel, para poder pasar a instantánea propiedad por propiedad cuando haya confianza en el sistema, sin desplegar código.
  - *Manual* (por defecto): la solicitud queda retenida; el propietario tiene un plazo (24 h configurable) para aceptar o rechazar. El cobro se **preautoriza pero no se captura** hasta la aceptación; si se rechaza o expira, se libera sin cargo y el huésped nunca ve un cargo seguido de una devolución.
  - *Instantánea*: el pago confirma la reserva automáticamente.
  - En modo manual, avisa al propietario de forma **agresiva** (email + push/WhatsApp si es posible) y muestra en el panel una cuenta atrás por solicitud. Una solicitud sin responder es una reserva perdida; el sistema debe hacerla imposible de ignorar.
- Cada transición de estado registra actor, timestamp y motivo en un **log de auditoría** inmutable.
- **Emails transaccionales** en el idioma del huésped en cada transición: solicitud recibida, reserva confirmada, recordatorio de pago del saldo, instrucciones de llegada (7 días antes, con dirección exacta y códigos), petición de reseña tras la salida.
- **Cancelaciones** según política configurable (flexible / moderada / estricta) con cálculo automático del importe reembolsable y ejecución del reembolso parcial o total.
- Datos del huésped necesarios para el **registro de viajeros** (ver sección de cumplimiento).

#### 4. Pagos

- Pasarela: **Stripe** (Payment Intents + Stripe Checkout), con los métodos que usa de verdad el público de Bibione: tarjeta, Apple/Google Pay, **SEPA Direct Debit**, **Sofort/Klarna y giropay para el mercado alemán y austríaco** (allí la transferencia bancaria se usa muchísimo más que la tarjeta), y transferencia SEPA manual como último recurso para estancias largas. Revisa qué métodos siguen disponibles en Stripe al implementar y activa los equivalentes vigentes.
- **Ojo con los métodos sin preautorización**: SEPA, Klarna y similares **no permiten retener sin cobrar**. Con aprobación manual, esos métodos obligan a cobrar y devolver si se rechaza. Solución: en modo manual, ofrece **solo métodos que admitan preautorización** (tarjeta, Apple/Google Pay) y habilita el resto únicamente cuando la propiedad esté en aceptación instantánea. Documenta esta regla claramente en el código.
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
- **Idiomas de huésped soportados, por volumen real de clientes**: italiano, alemán, polaco, checo, eslovaco y húngaro, más inglés como comodín para el resto. La lista es provisional: trátala como datos, no como código.
- **Flujo huésped → propietario**: el huésped escribe en su lengua materna. El sistema detecta el idioma y genera traducciones al **italiano** (idioma del propietario) y al **inglés** (para verificación y para cualquier gestor que no hable italiano). El propietario ve el italiano por defecto, con enlace a "ver original".
- **Flujo propietario → huésped**: el propietario escribe en italiano. El sistema traduce automáticamente a la **lengua materna del huésped** (la detectada en su primer mensaje, o la del navegador/perfil) y también al inglés. El huésped ve su idioma con opción de ver el original y el inglés.
- **Alfabetos**: todos los idiomas previstos son latinos, pero con diacríticos poco frecuentes (ą ć ę ł ń ś ź ż en polaco, č ř ž ů en checo, ő ű en húngaro). Aun así, elige una tipografía con **cobertura latina extendida y cirílica**: no cuesta nada ahora y evita rehacer el diseño si más adelante entra un idioma que la necesite.
- **Indicador visible de "traducido automáticamente"** en todo mensaje traducido, con el original a un clic. Es un requisito de confianza, no un adorno.
- **Motor de traducción**: capa de abstracción `TranslationProvider` con implementaciones intercambiables. **DeepL como principal** — cubre italiano, alemán, polaco, checo, eslovaco y húngaro, y su calidad en alemán y checo es claramente superior a la de Google. El húngaro es el más difícil de los seis para cualquier traductor automático: pide revisión nativa antes de fiarte. Respaldo con un LLM (Claude) o Google Translate. Si el proveedor falla, el mensaje se entrega igualmente con el original y la traducción se reintenta en segundo plano — **nunca bloquees la entrega de un mensaje por un fallo de traducción**.
- **Caché de traducciones** por hash del texto + par de idiomas, para no pagar dos veces lo mismo (las plantillas y respuestas frecuentes se repiten mucho).
- **Respuestas rápidas** (plantillas) pre‑traducidas a los idiomas soportados: check‑in, wifi, parking, mascotas, salida tardía.
- **Notificaciones**: email al propietario con el mensaje ya traducido a su idioma, y email al huésped en el suyo, ambos con enlace directo al hilo.
- Moderación básica: bloquea o marca intentos de sacar la conversación fuera de la plataforma antes de la confirmación si eso te interesa comercialmente (opcional).

#### 6. Canales de contacto

- **Chat interno** (el del punto 5) como canal principal para todo lo relacionado con una reserva: deja rastro, es traducible y es auditable.
- **Botón flotante de WhatsApp** (`wa.me` con mensaje pre‑rellenado que incluye el nombre del piso y las fechas consultadas) para consultas previas rápidas. Es el canal dominante en Italia, Alemania, Austria y Europa central, y el que más convierte; no lo omitas. Advertencia: WhatsApp **no** pasa por la capa de traducción, así que úsalo para consultas cortas y reconduce al chat interno la conversación de la reserva.
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

#### 8. Multi‑propietario (prepararlo ahora, activarlo después)

Hoy hay 7 apartamentos de un propietario. Es probable que se sumen 4 de un segundo propietario. **Construye el modelo de datos preparado para eso desde el primer día, pero no construyas la interfaz de gestión multi‑propietario hasta que haga falta.** Cambiar el modelo de datos después es caro; añadir pantallas después es barato.

Qué hacer ahora:

- Tabla `owners`, y **`owner_id` obligatorio en `properties`** y, por herencia, en reservas, pagos, mensajes y conversaciones.
- **Aislamiento de datos a nivel de base de datos** con Row Level Security de Supabase: un propietario nunca puede leer ni escribir datos de otro, ni siquiera si hay un fallo en el código de la aplicación. No confíes solo en filtros en las consultas.
- Todos los informes y listados filtran por propietario; el rol `admin` de la plataforma puede ver todo.
- El escaparate público **no distingue propietarios**: el huésped ve una sola marca y un solo catálogo. La separación es interna.
- Cada propietario tiene sus propios datos fiscales, su CIN por apartamento, su logotipo opcional en las facturas y sus propias plantillas de mensajes.

Qué **no** hacer todavía: registro autoservicio de propietarios, panel de administración de la plataforma, facturación entre propietarios, reparto de comisiones. Eso llega solo si aparece un tercer propietario.

**El dinero es la parte delicada.** Si cobras en tu cuenta el alquiler de los apartamentos de otro propietario, dejas de ser un propietario con web y pasas a ser un **intermediario**, con consecuencias fiscales serias en Italia (entre otras, la retención del 21 % sobre los alquileres cobrados por intermediarios en régimen de *cedolare secca*). Para evitarlo:

- Usa **Stripe Connect con cargos directos** (*direct charges*): cada propietario conecta su propia cuenta de Stripe y el dinero de sus apartamentos va **directamente a su cuenta**, sin pasar nunca por la tuya.
- No implementes reparto de ingresos ni cobro centralizado sin que un *commercialista* lo valide antes.
- Mientras solo haya un propietario, una única cuenta de Stripe normal es suficiente; deja el código preparado para que la cuenta de destino sea un campo del propietario, no una constante.

> Advierte explícitamente de este punto fiscal al propietario y recomiéndale consultarlo con su asesor antes de incorporar al segundo propietario. No des por buena ninguna interpretación fiscal por tu cuenta.

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
- **CIN (Codice Identificativo Nazionale)**: obligatorio y **visible en cada anuncio** — en la ficha de cada apartamento, no escondido en el pie de página. Campo por propiedad, rellenado por el propietario. Si el Véneto exige además un código regional (CIR), añade un segundo campo opcional y muéstralo junto al CIN. No inventes ni valides formatos que no conozcas con certeza.
- **Alloggiati Web** (Polizia di Stato): comunicación obligatoria de los datos de **todos** los huéspedes dentro de las 24 h siguientes a la llegada (24 h, o el mismo día si la estancia es de una sola noche — confirma el plazo vigente). Diseña para esto:
  - Formulario de **pre‑check‑in online** que el huésped rellena antes de llegar, con enlace enviado por email en su idioma: nombre, apellidos, fecha y lugar de nacimiento, ciudadanía, tipo y número de documento, país de expedición. Distingue *ospite singolo*, *capofamiglia*/*capogruppo* y *familiare*/*membro gruppo*, que es como Alloggiati clasifica a los huéspedes.
  - **Genera el fichero de texto en el formato de Alloggiati Web** listo para subir, y permite descargarlo por rango de fechas. La integración automática con su servicio web es opcional y de fase posterior; el fichero descargable resuelve el 100 % del problema con una fracción del esfuerzo.
  - **Alerta en el panel** cuando haya llegadas del día con el registro pendiente de enviar. Es una obligación con sanción; trátala como un bloqueo, no como un recordatorio suave.
  - Estos datos son **categoría sensible**: cifrado en reposo, acceso restringido, y borrado automático pasado el plazo de conservación legal.
- **ISTAT / Véneto**: declaración periódica del movimiento de huéspedes al portal turístico regional. Prepara la exportación de los datos agregados (llegadas, pernoctaciones, nacionalidad) en CSV; la integración directa, si llega, es de fase posterior.
- **Imposta di soggiorno de San Michele al Tagliamento (Bibione)**: importe por persona y noche, con exenciones (menores de cierta edad, y las que fije el reglamento municipal) y tope de noches gravadas. **Todo configurable, nada escrito a fuego**, porque el ayuntamiento lo cambia. Debe aparecer separado en el desglose de precio y en el informe trimestral de liquidación.
- **Fiscalidad**: régimen del propietario (*cedolare secca* u ordinario) configurable, facturas o recibos con numeración correlativa, y exportación para el *commercialista*. Ver también la advertencia sobre intermediación en la sección 8.
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

**Sobre los planes gratuitos** (léelo antes de elegir plan, es un negocio real y estacional):

- Los planes gratuitos de la mayoría de plataformas **están limitados a proyectos no comerciales** en sus condiciones de uso. Una web que cobra reservas es comercial. Verifica los términos vigentes de cada servicio antes de asumir que el plan gratuito sirve; no lo des por hecho.
- Varios servicios gratuitos **suspenden el proyecto tras días de inactividad**. Con una temporada de mayo a septiembre y un invierno casi sin tráfico —justo cuando se reserva el verano—, una suspensión silenciosa en enero significa perder reservas sin enterarse. Si se usa un plan gratuito, elige uno que **reanude solo** al recibir una petición, y añade un cron de "latido" que toque la web a diario.
- **La base de datos es lo último que hay que poner en gratuito.** Contiene reservas, pagos y datos de registro de viajeros con obligación legal de conservación. Un plan de pago barato con copias de seguridad automáticas y restauración a un punto en el tiempo vale mucho más de lo que cuesta.
- Escribe el código **sin depender de nada exclusivo de una plataforma**: PostgreSQL estándar, `.ics` estándar, ficheros en S3‑compatible. Así, si un proveedor cambia sus precios, la migración es un fin de semana y no una reescritura.
- Añade al `README.md` una tabla con el coste mensual real de cada servicio y qué pasa si se supera el límite del plan.

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
5. **Seed de datos realista**: los 7 apartamentos con fotos de ejemplo, listino semanal de temporada alta, temporadas, reservas pasadas y futuras, y una conversación multilingüe de muestra. Nada de "Lorem ipsum".
6. Documenta en `README.md` cómo arrancar en local, qué variables de entorno hacen falta (con `.env.example`, sin secretos reales) y cómo desplegar.
7. Señala cualquier decisión que tenga coste recurrente (Stripe, DeepL, CDN, hosting) con una estimación mensual aproximada.

### Fases sugeridas

| Fase | Contenido | Resultado |
|---|---|---|
| **0** | Arquitectura, modelo de datos multi‑propietario, sistema de diseño, esqueleto del proyecto | Repo con base sólida y decisiones documentadas |
| **1** | Escaparate público (it/en/de) + fichas de los 7 apartamentos + calendario de solo lectura + CIN visible + formulario de contacto + WhatsApp | Web publicable que ya capta consultas |
| **2** | Motor de disponibilidad, temporadas y listino semanal + panel del propietario + gestión de contenido + **sync iCal con Airbnb** | El propietario gestiona todo desde dentro y no hay riesgo de doble reserva |
| **3** | Reservas online + Stripe + aprobación manual con preautorización + emails transaccionales | Reservas directas cobrando |
| **4** | Mensajería con traducción automática (it/en/de/sl/cs/bg) + notificaciones | El canal diferencial funcionando |
| **5** | Pre‑check‑in y fichero de Alloggiati Web, imposta di soggiorno, informes, reseñas, SEO y rendimiento | Operación completa |

**El calendario del negocio manda sobre el del proyecto.** El público alemán, austríaco y checo de Bibione reserva el verano entre enero y marzo. Eso fija la prioridad: las fases 1 a 3 tienen que estar en producción **antes de enero**, aunque sea con menos funciones de las previstas. La fase 4 puede llegar en primavera y la 5 antes de la primera llegada de mayo — salvo el registro de viajeros, que es obligatorio desde el primer huésped y, si no está listo, se cubre a mano con el portal de Alloggiati Web mientras tanto.

### Criterios de aceptación (verificables)

- Dos reservas simultáneas sobre las mismas fechas: la segunda **falla en base de datos**, no solo en la interfaz.
- El precio mostrado en la ficha coincide **exactamente** con el importe cobrado por Stripe, hasta el céntimo.
- Un webhook de Stripe reenviado tres veces produce **un solo** cambio de estado y **un solo** email.
- Un *hold* no pagado libera las fechas automáticamente a los 15 minutos.
- Un mensaje escrito en polaco llega al propietario en italiano y en inglés, con el original accesible, y la respuesta que el propietario escribe en italiano llega al huésped en polaco. Repite con checo, eslovaco, húngaro y alemán.
- Los diacríticos del polaco, el checo y el húngaro se renderizan correctamente y no desbordan ningún componente de la interfaz.
- Si DeepL devuelve error, el mensaje se entrega igualmente y la traducción aparece después sin intervención manual.
- La ficha de piso pasa Lighthouse con ≥ 90 en rendimiento, accesibilidad y SEO en móvil.
- Cambiar de idioma mantiene la página, las fechas seleccionadas y el estado del formulario.

### Decisiones ya tomadas — NO las preguntes de nuevo

- **Ubicación**: Bibione (San Michele al Tagliamento, Véneto, Italia). Aplican CIN, Alloggiati Web e imposta di soggiorno municipal. España queda fuera de alcance.
- **Propiedades**: 7 apartamentos de un propietario, más 4 posibles de un segundo. Modelo de datos multi‑propietario desde el día 0, interfaz de un solo propietario por ahora.
- **Idiomas**: interfaz en italiano, inglés y alemán, con arquitectura preparada para un cuarto sin rehacer nada; mensajería con traducción automática además en polaco, checo, eslovaco y húngaro (provisional). Italiano por defecto. El español no es prioritario.
- **Aprobación**: manual en todas las propiedades al arrancar, con interruptor por propiedad para pasar a instantánea.
- **Airbnb**: se mantiene. La sincronización iCal es crítica desde la fase 2.
- **Precios**: configurables por temporada desde el panel, con listino semanal sábado‑a‑sábado en temporada alta.
- **Stack**: el de la sección anterior.

### Lo único que debes preguntar antes de empezar

1. ¿Pago total al reservar, o depósito más saldo? Si depósito: porcentaje y cuántos días antes se cobra el resto.
2. ¿Presupuesto mensual aceptable para servicios de terceros?
3. Datos concretos de los 7 apartamentos (nombre, capacidad, dormitorios, CIN) — o si prefieres que arranque con datos de ejemplo y los sustituya después.

Para todo lo demás, asume un valor sensato, decláralo y sigue adelante.

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

### 2.2 Aceptación manual (decidido) — cómo hacer que no te cueste reservas

Empezar en manual me parece bien, y en tu caso tiene una ventaja extra que quizá no habías considerado: **compensa el retraso del iCal de Airbnb**. Airbnb no publica sus reservas en el calendario compartido al instante, así que existe una ventana de horas en la que tu web puede creer libre una semana que ya se ha vendido allí. Revisar cada solicitud a mano tapa exactamente ese agujero. Mientras sigas en Airbnb, la aprobación manual no es solo prudencia: es una red de seguridad real.

El coste de la aprobación manual es uno solo, y es serio: **la reserva que pierdes por tardar en contestar**. Un cliente alemán que solicita un sábado por la noche y no recibe respuesta hasta el lunes ya ha reservado en otro sitio. Por eso el prompt exige aviso agresivo (email + notificación al móvil) y cuenta atrás visible por solicitud.

Mi recomendación práctica: pasa a **instantánea en temporada baja y media** en cuanto lleves un par de meses funcionando, y mantén el **manual solo en julio y agosto**, que es cuando el riesgo de solapamiento con Airbnb es máximo y cuando cada semana vale mucho dinero. El prompt lo deja configurable por propiedad y temporada, así que es un interruptor, no un desarrollo.

Y no lo olvides: en modo manual, **preautoriza, no cobres** — con la salvedad de que los métodos de pago alemanes tipo SEPA o Klarna no admiten preautorización, así que en manual hay que ofrecer solo tarjeta.

### 2.3 ¿Chat interno o WhatsApp?

**Los dos, con papeles distintos.** WhatsApp para la consulta previa (es el canal que usan de verdad tanto italianos como alemanes, austríacos y checos, y el que más convierte), chat interno para todo lo que ocurre desde que hay una reserva.

La razón para no dejarlo todo en WhatsApp es precisamente tu requisito de traducción: WhatsApp no pasa por tu capa de traducción y no deja rastro auditable ligado a la reserva. La razón para no dejarlo todo en el chat interno es que obligar a un desconocido a registrarse para preguntar "¿admite mascotas?" te cuesta consultas. Enlace mágico por email en el chat interno (sin contraseña) reduce mucho esa fricción.

### 2.4 Idiomas y motor de traducción

Tu mezcla real de clientes es **italiano y alemán primero, y después checo, eslovaco, polaco, húngaro y esloveno**. Eso cambia el diseño: el español deja de ser prioritario y el alemán pasa a ser el segundo idioma de peso.

**Separa dos cosas que suelen confundirse:**

- **Idiomas del escaparate** (contenido comercial, traducido a mano): **italiano, inglés y alemán**. Solo tres. Añadir cada idioma más al sitio web significa mantener una versión más de cada descripción de piso cada vez que cambias una frase, y esos públicos navegan sin problema en inglés o alemán. No pagues ese coste.
- **Idiomas de la mensajería** (traducción automática): **todos los de la lista**. Aquí sí, porque escribir a máquina en tu propio idioma sobre las llaves y el aparcamiento es donde el cliente agradece de verdad no tener que pelearse en inglés. Es tu diferencial y es barato de mantener.

**DeepL sigue siendo la elección correcta**, y con tu mezcla lo es aún más: cubre polaco, checo, eslovaco, húngaro y esloveno, y en alemán y checo su ventaja sobre Google es notable en texto conversacional. Miles de mensajes al mes te cuestan pocos euros.

Dos cosas que no debes saltarte con este mix:

- Los **diacríticos centroeuropeos** (polaco, checo, húngaro) rompen tipografías mal elegidas. Escoge una con cobertura latina extendida —y ya de paso cirílica, por si acaso— y compruébalo con texto real.
- El **alemán es el idioma que más se alarga** al traducir (30–40 % más largo que el inglés). Si el diseño de los botones y las tarjetas aguanta el alemán, aguanta todo lo demás. Úsalo como caso de prueba del layout.

Y sigue en pie lo de antes: declara la traducción en tu política de privacidad, porque estás enviando texto escrito por el huésped a un tercero.

### 2.5 ¿Construir esto desde cero?

Te lo digo con franqueza porque es la decisión con más impacto: **lo que describes es un proyecto de varios meses**, y existen productos (Lodgify, Smoobu, Hostaway, Guesty) que traen el 80 % hecho por 30–100 €/mes.

Aun así, construirlo tiene sentido en tu caso por dos razones concretas: la **mensajería con traducción bidireccional automática no la hace bien ninguno** de esos productos, y las reservas directas te ahorran el 15–20 % de comisión de las OTAs de forma permanente. Con 7 apartamentos en Bibione facturando en temporada, esa comisión ahorrada son miles de euros al año, no céntimos. Adelante.

Mi consejo táctico: **no construyas las fases 0–5 de golpe.** Lanza la fase 1 (escaparate + WhatsApp + formulario) en dos o tres semanas y empieza a captar reservas gestionadas a mano por email. Con las primeras conversaciones reales sabrás muchísimo mejor cómo debe funcionar el motor de reservas, y habrás validado la demanda antes de escribir la parte cara.

### 2.6 ¿Qué stack es más manejable si lo hacemos juntos?

Pediste "el que sea más fácil y gestionable con tu ayuda", y eso tiene una respuesta bastante clara: **Next.js + Supabase + Vercel + Stripe**, todo en un único repositorio.

El razonamiento no es que sea la tecnología más potente, sino que minimiza las piezas que tú tendrías que entender y mantener:

- **Un repo, un despliegue.** Web y API viven juntas. No hay dos proyectos que sincronizar ni dos despliegues que puedan quedarse descompasados.
- **Supabase te da tres cosas en una cuenta**: base de datos PostgreSQL de verdad (que necesitas para la restricción anti‑doble‑reserva), login y almacenamiento de fotos. La alternativa sería montar tres servicios distintos.
- **Vercel despliega solo** en cada push a GitHub, y cada rama genera una URL de vista previa donde puedes ver un cambio antes de publicarlo. Para trabajar conmigo esto vale mucho: te enseño un enlace, tú lo miras en el móvil, decides.
- **He quitado Redis y la cola de trabajos** que llevaba la versión anterior del prompt. A once apartamentos no aportan nada y son dos cosas más que pueden caerse. Las tareas periódicas van con Vercel Cron, que es una línea de configuración.

Quedan **cuatro cuentas externas**: Vercel, Supabase, Stripe y DeepL. Ese es el techo que yo no pasaría.

Sobre TypeScript: añade algo de verbosidad, pero detecta errores antes de que lleguen a producción y —esto importa para nuestro caso— hace que un asistente de IA se equivoque bastante menos al modificar código que no escribió. Merece la pena.

### 2.7 ¿Hay alojamiento y base de datos gratis para siempre?

Respuesta corta: **existe, pero no deberías usarlo para esto**, y quiero explicarte por qué antes de que lo decidas.

Hay tres trampas concretas en los planes gratuitos, y las tres te tocan de lleno:

**1. Casi todos prohíben el uso comercial.** Los planes gratuitos de las plataformas de despliegue suelen estar limitados en sus condiciones a proyectos personales y no comerciales. Una web que cobra reservas es comercial sin discusión. No es que te vayan a cerrar la cuenta mañana, pero estarías construyendo el negocio sobre un incumplimiento de contrato que pueden hacer valer justo cuando más lo necesitas — en agosto.

**2. Suspenden el proyecto por inactividad, y tu invierno es inactivo.** Varios servicios gratuitos de base de datos pausan el proyecto tras unos días sin peticiones. Tu web tiene tráfico casi nulo de noviembre a febrero… que es exactamente cuando los alemanes reservan el verano. Una base de datos pausada en enero significa una web caída en el mes que más importa, y sin nadie mirando. Se puede parchear con un cron que "toque" la web a diario, pero estás poniendo una tirita sobre algo que no debería sangrar.

**3. Sin copias de seguridad decentes.** Tu base de datos contendrá reservas cobradas y datos de documentos de identidad con obligación legal de conservación. Los planes gratuitos rara vez incluyen restauración a un punto en el tiempo. Perder eso no es un problema técnico, es un problema legal y de dinero.

**Los números, para que decidas con ellos delante.** El coste realista de hacerlo bien está en torno a **40–60 €/mes** (despliegue, base de datos con copias, traducción, email y dominio), más las comisiones de Stripe, que son proporcionales a lo que ingresas. Aproximadamente **600 €/año**. Una sola semana de agosto en un apartamento de Bibione ronda o supera esa cifra. Y solo con **una** reserva directa de 1.000 € que antes habría ido por Airbnb ya te has ahorrado unos 150 € de comisión.

Dicho de otro modo: ahorrarte 40 €/mes te expone a perder una semana de agosto entera por una caída silenciosa. Es de las peores relaciones riesgo/beneficio que conozco.

**Lo que sí haría gratis:**

- **Todo el desarrollo**, hasta que la web se publique de verdad. Mientras no cobre reservas no es comercial y no hay ningún problema en usar planes gratuitos. Eso son meses sin pagar nada.
- **Vistas previas de ramas** para que revises cambios antes de publicarlos.
- Herramientas de apoyo: repositorio en GitHub, monitorización básica, analítica.

**Y una condición que sí te ahorra dinero de verdad a largo plazo**, que ya he metido en el prompt: que el código **no dependa de nada exclusivo de un proveedor**. PostgreSQL estándar, ficheros `.ics` estándar, almacenamiento compatible con S3. Si dentro de dos años Vercel o Supabase suben precios, migrar a un servidor propio de 5 €/mes en Hetzner es un fin de semana de trabajo en vez de una reescritura. Esa es la protección real contra los costes: poder irte, no empezar gratis.

Un aviso final sobre estas cifras: los planes y límites de estos servicios cambian a menudo, y mi información tiene fecha de caducidad. Antes de contratar nada, comprueba los precios y las condiciones vigentes en cada web. Lo que no cambia es el razonamiento: no pongas el negocio de la temporada en una infraestructura que puede pausarse sin avisarte.

---

## 3. Cómo usar el prompt

1. Rellena en la sección "Datos que necesito" las respuestas a las seis preguntas (o deja que te las pregunte).
2. Pega el prompt completo en una sesión nueva del asistente.
3. Pídele primero **solo la fase 0** y revisa el modelo de datos y las decisiones antes de dejarle escribir la aplicación entera. El modelo de datos de disponibilidad y precios es lo que más caro sale de cambiar después.
4. Al empezar cada fase, vuelve a pegar el prompt como contexto y añade "implementa la fase N".

---

## 4. Lista per la riunione con i proprietari

Punti aperti da chiudere **prima** di iniziare a costruire. Ogni voce porta la mia raccomandazione.

| # | Tema | Raccomandazione |
|---|---|---|
| 1 | **Lingue del sito** | Italiano, inglese e tedesco. Il tedesco copre il 55 % delle prenotazioni reali: va trattato come lingua principale, non secondaria. Quarta lingua eventuale: **ceco**. |
| 2 | **Lingue della messaggistica** | Italiano, inglese, tedesco, **ceco** (che copre anche gli slovacchi), ungherese e polacco. **Lo sloveno si può togliere**: è lo 0,9 % delle prenotazioni. Da valutare il rumeno, in crescita nel 2026. |
| 3 | **Politica di incasso** | Acconto del 30 % + saldo 14 giorni prima dell'arrivo. Incasso **solo al momento dell'accettazione**, mai prima. |
| 4 | **Cauzione danni** — quattro opzioni | **(a) Nessuna**, la mia raccomandazione. **(b) Carta salvata in garanzia**: comoda, ma il cliente può contestare l'addebito e nei danni di solito vince. **(c) Contanti all'arrivo**: l'unica senza rischio di contestazione, ma richiede presenza fisica. **(d) Blocco sulla carta**: scade dopo 7 giorni. Se si sceglie il blocco, crearlo **2–3 giorni prima della partenza**, non prima dell'arrivo. |
| 5 | **Conto di incasso** | Stripe Connect con addebiti diretti: ogni proprietario incassa sul proprio conto. |
| 6 | **Prime prenotazioni (prima del sito)** | Email per la parte formale, WhatsApp per il resto. Tenere traccia di tutto in un unico posto. |
| 7 | **Canale di messaggistica definitivo** | WhatsApp prima della prenotazione, chat del sito con traduttore dopo la conferma. |
| 8 | **Airbnb come canale residuo** | Il sito è la fonte di verità. A febbraio si apre su Airbnb **solo ciò che è ancora libero**. Mai i due canali sullo stesso inventario. |
| 9 | **Chi controlla il calendario prima di accettare su Airbnb** | Procedura scritta e **una sola persona responsabile** in alta stagione. |
| 10 | **Le persone già interessate per il 2027** | Non farle aspettare il sito. Aprire subito una lista d'attesa con nome, appartamento, settimana e lingua, e confermare a mano con acconto tramite link di pagamento. Sono le prime prenotazioni dirette e il miglior test del processo. |
| 11 | **Politica di cancellazione** | Una sola politica, chiara, uguale per tutti gli appartamenti. |
| 12 | **Soggiorno minimo e giorno di arrivo** | Settimana sabato‑sabato a luglio e agosto (già il 75 % delle prenotazioni). Libero nel resto della stagione, dove i soggiorni brevi di 3–4 notti sono frequenti. |
| 13 | **Tempo di risposta alle richieste** | Massimo 24 ore, meglio 12. Definire chi risponde. |
| 14 | **Se fallisce l'incasso del saldo** | Nuovo tentativo automatico e link di pagamento via email o WhatsApp. Come ultima risorsa, link di pagamento dal telefono del cliente all'arrivo — meglio di un POS fisico, che obbliga il proprietario a spostarsi. |
| 15 | **Listino della prossima stagione** | Necessario prima di aprire le prenotazioni. |
| 16 | **Imposta di soggiorno** | Si incassa online o in loco? |
| 17 | **Dati di ogni appartamento** | CIN, capienza, camere, foto, descrizione. |
| 18 | **Un marchio o tre?** | Oggi ci sono tre nomi: Croce del Sud, Via del Mare, Andromeda. Decidere se il sito è un marchio unico con tre residenze o tre identità separate. Consiglio: **un marchio unico**, molto più semplice da posizionare su Google. |
| 19 | **Dominio e account** | Chi intesta dominio, Stripe, Google e hosting. Vanno intestati alla proprietà, non a una persona di passaggio. |
| 20 | **Profilo Google e recensioni** | Aprire una scheda Google Business per struttura e chiedere la recensione via email dopo la partenza, nella lingua del cliente. È il canale gratuito con più impatto sulle prenotazioni dirette. |
| 21 | **Chi scrive i testi e le traduzioni** | Le descrizioni in tedesco e inglese vanno scritte o riviste da un umano, non tradotte a macchina. |

### Nota sui dati

L'analisi delle nazionalità è calcolata su **220 prenotazioni e 861 ospiti** dei moduli Jotform di Croce del Sud e Via del Mare (2025 e 2026). Non include Andromeda 2026 e la stagione 2026 non è ancora completa. Sono ospiti effettivamente arrivati: non dicono nulla su chi ha chiesto e non ha prenotato.
