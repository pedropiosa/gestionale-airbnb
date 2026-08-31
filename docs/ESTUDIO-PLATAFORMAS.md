# Estudio de plataformas existentes: ¿comprar o construir?

Comparativa de los productos que ya resuelven parte de lo que queremos, contra nuestros nueve requisitos, con costes estimados para **7 apartamentos en Bibione y dos propietarios**.

> **Aviso sobre las cifras.** Los precios de este sector cambian varias veces al año y varían según país, número de unidades y descuentos de temporada. Las cifras marcadas *(verificado)* proceden de búsquedas de agosto de 2026; las marcadas *(estimado)* son extrapolaciones a partir del precio base publicado. **Pide presupuesto por escrito antes de contratar nada.** Ninguna cifra aquí sustituye a una oferta.

## 1. Nuestros nueve requisitos

| # | Requisito | ¿Es común en el mercado? |
|---|---|---|
| R1 | Escaparate propio multi‑idioma (it/en/de) con SEO propio | Sí, todos |
| R2 | Listino por temporada y **semana cerrada sábado‑sábado** | Sí, casi todos |
| R3 | **Aprobación manual** con cobro solo al aceptar | Parcial |
| R4 | Depósito 30 % + saldo automático 14 días antes | Sí, los buenos |
| R5 | **Mensajería con traducción automática bidireccional** | **Casi nadie** |
| R6 | **Dos propietarios, cada uno cobrando en su cuenta** | **Casi nadie** |
| R7 | Alloggiati Web + ISTAT Véneto + imposta di soggiorno | Solo los italianos y Lodgify |
| R8 | Sincronización con Airbnb | Sí, y **mejor que la nuestra** |
| R9 | WhatsApp y contacto directo | Sí |

Dos requisitos concentran toda la dificultad: **R5 y R6**. El resto es mercado maduro.

## 2. Lo que compraríamos y no podemos construir bien

Esto es lo más importante del estudio y conviene decirlo antes que nada:

**Un PMS comercial sincroniza con Airbnb por API oficial, en tiempo real.** Nosotros, construyendo por nuestra cuenta, solo tenemos iCal, con horas de retraso en la dirección web → Airbnb. Identificamos ese retraso como el **riesgo operativo número uno** del proyecto, y resulta que comprar lo elimina, mientras que construir no puede.

Lo mismo con **Alloggiati Web**: Lodgify y los gestionales italianos ya envían las fichas automáticamente al portal de la Questura respetando los plazos, e ISTAT donde aplica. Nosotros lo habíamos planificado como "generar el fichero para subirlo a mano", que es claramente peor.

## 3. Comparativa

| Plataforma | Origen | R5 Traducción | R6 Multi‑propietario | R7 Alloggiati | R8 Airbnb API | Coste anual estimado, 7 apt. |
|---|---|---|---|---|---|---|
| **Beds24** | UK/DE | No | No (una cuenta de cobro) | No nativo | Sí | **~400 €** *(verificado: 15,90 € base + 3 €/propiedad extra)* |
| **Krossbooking** | 🇮🇹 Italia | No | Parcial | **Sí** | Sí | **~340 €** *(verificado: 4 €/unidad/mes, mín. 3)* |
| **Octorate** | 🇮🇹 Italia | No | Parcial (módulo propietarios) | **Sí** | Sí | **~1.000–1.400 €** *(estimado desde 39 €/mes por estructura)* |
| **Smoobu** | 🇩🇪 Alemania | No | No | Parcial | Sí | **~1.150 €** *(verificado: 31,50 € + 10,80 €/unidad extra, anual)* |
| **Lodgify** | 🇪🇸 España | No | No | **Sí, completo** | Sí | **~1.200–2.000 €** *(estimado; plan Professional, escala con unidades)* |
| **Hostaway** | 🇺🇸 EE. UU. | Parcial (IA) | Sí (portal propietarios) | No nativo | Sí | **~2.500–3.000 €** *(estimado)* |
| **Guesty** | 🇺🇸 EE. UU. | Parcial (IA) | Sí | No nativo | Sí | **~5.000 €+** *(Lite solo llega a 3 unidades)* |
| **Construir** | — | **Sí, a medida** | **Sí, a medida** | Semi‑automático | Solo iCal | **~600 €** de infraestructura + desarrollo |

## 4. Dónde falla cada uno para nuestro caso

**Beds24 y Krossbooking** son los más baratos con diferencia y hacen bien lo aburrido. Krossbooking además es italiano, con Alloggiati incluido. Ninguno de los dos traduce mensajes ni reparte cobros entre dos cuentas.

**Smoobu** tiene la mejor experiencia de uso del grupo intermedio y un constructor de webs decente, pero el cobro va a **una sola cuenta**: con dos propietarios, o abres dos suscripciones o alguien cobra lo del otro — que es justo lo que queremos evitar.

**Lodgify** es el único de los grandes internacionales con **Alloggiati Web e ISTAT integrados de verdad**, y eso en Italia vale mucho. Pero tampoco reparte cobros ni traduce conversaciones, y es de los caros.

**Hostaway y Guesty** sí tienen portal de propietarios con separación de cuentas, porque están pensados para gestoras profesionales con decenas de inmuebles. Para siete apartamentos son un coste desproporcionado, y ninguno cubre Alloggiati de forma nativa: haría falta contratar además un servicio de check‑in italiano.

**Ninguna de las ocho** hace lo que nosotros llamamos mensajería traducida: conservar el original, generar traducciones al italiano y al inglés para el propietario, y devolver la respuesta en la lengua del cliente, con aviso visible de que es traducción automática. Lo más parecido son asistentes de IA que responden directamente al cliente en su idioma, que es una cosa distinta y con otros riesgos.

## 5. El truco de las dos suscripciones

Hay una salida al problema de los dos propietarios que no requiere un producto caro: **dos suscripciones separadas, una por propietario**. Cada uno con su cuenta, su Stripe y su facturación. El problema del reparto de cobros desaparece por completo, y con Krossbooking costaría del orden de 350–500 € al año entre los dos.

Lo que se pierde: el catálogo único. El cliente vería dos motores de reserva distintos y no podría buscar "una semana en agosto para 5 personas" sobre los siete apartamentos a la vez. Eso se arregla construyendo **solo el escaparate** —que es la fase 1, la parte barata— y enlazando cada apartamento a su motor.

## 6. Coste a tres años

| Opción | 3 años | Qué obtienes | Qué te falta |
|---|---:|---|---|
| Krossbooking ×2 | ~1.100 € | Todo lo operativo, Alloggiati, Airbnb en tiempo real | Traducción, catálogo único |
| Beds24 ×2 | ~1.400 € | Lo mismo, más flexible, más feo | Traducción, catálogo único, Alloggiati |
| Lodgify | ~4.500 € | Lo más completo listo para usar | Traducción, dos cuentas de cobro |
| Hostaway | ~8.000 € | Portal de propietarios de verdad | Alloggiati, traducción |
| Construir todo | ~1.800 € de infra | Exactamente lo que queremos | Meses de trabajo, y solo iCal para Airbnb |
| **Híbrido** | ~1.100 € + infra | Lo operativo comprado, lo diferencial construido | Trabajo de integración |

En dinero puro, los gestionales baratos y construir cuestan prácticamente lo mismo. **La decisión no es económica: es de tiempo y de encaje.**

## 7. Recomendación

**Comprar ahora, construir después.** Y lo digo cambiando de opinión respecto al plan inicial, por una razón concreta: **enero**.

Los clientes alemanes y checos reservan el verano entre enero y marzo. Construir las fases 1 a 3 para esa fecha es apretado y arriesgado, y si llegamos tarde se pierde una temporada entera — que en dinero vale mucho más que cualquier suscripción.

El camino que recomiendo:

**Ahora, para la temporada 2027.** Dos suscripciones de un gestional italiano barato, una por propietario. En semanas están operativos, con Alloggiati automático, Airbnb sincronizado por API real y cobros en la cuenta de cada uno. En paralelo, construir **solo el escaparate**: la web bonita en italiano, inglés y alemán, con el catálogo de los siete apartamentos, fotos, la zona, WhatsApp y el formulario. Es la fase 1 del plan original y es la parte que más convierte.

**Durante 2027.** Con la operación funcionando y el escaparate captando, construir la mensajería traducida y el motor de reservas propio sin prisa, probándolo contra reservas reales. Migrar cuando esté mejor que lo comprado, no antes.

**Lo que esto nos ahorra:** el riesgo de llegar tarde a enero, y meses de trabajo replicando cosas que ya existen y funcionan mejor —el envío a Alloggiati y la sincronización real con Airbnb— para concentrarlo en las dos que ningún producto hace: la traducción y el catálogo único de dos propietarios.

**Lo que hay que verificar antes de decidir**, y que solo se sabe pidiendo demo:

1. ¿Krossbooking u Octorate permiten el flujo depósito 30 % + saldo automático a 14 días?
2. ¿Soportan aprobación manual con cobro solo al aceptar, o cobran al reservar?
3. ¿Su motor admite semana cerrada sábado‑sábado con listino anual?
4. ¿Envían realmente a Alloggiati Web y al portal ISTAT del Véneto, o solo generan el fichero?
5. ¿Se puede exportar todo —reservas, clientes, mensajes— si un día migramos? **Esta es la más importante de las cinco.**

## Fuentes

- [Lodgify — precios y comparativa PMS](https://www.lodgify.com/it/confronto/miglior-pms-case-vacanze/)
- [Lodgify — envío automático de fichas Alloggiati e ISTAT](https://www.lodgify.com/guest-registration/)
- [Lodgify — precios, análisis independiente](https://comparatifchannelmanager.fr/en/lodgify-pricing/)
- [Smoobu — cuánto cuesta, centro de ayuda oficial](https://support.smoobu.com/hc/it/articles/360003170680-Quanto-costa-Smoobu)
- [Beds24 — precios, análisis independiente](https://comparatifchannelmanager.fr/en/beds24-pricing/)
- [Kross Booking — precios](https://www.krossbooking.com/prezzo)
- [Octorate — precios](https://octorate.com/en/pricing/)
- [Guesty — precios 2026](https://www.rakidzich.com/articles/how-much-does-guesty-cost-2026)
- [Comparativa de software de alquiler vacacional en Italia](https://vertoai.it/blog/migliori-software-gestione-affitti-brevi)
