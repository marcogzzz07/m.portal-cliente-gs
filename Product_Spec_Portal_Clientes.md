# Product Spec maestro — Portal de Clientes GS

**Versión:** 1.0  
**Fecha:** 12 de octubre de 2026  
**Responsable de producto:** Marco González, Planeación Estratégica  
**Estado:** borrador maestro para revisión de producto antes de iniciar el prototipo en Claude Code; no constituye alcance técnico aprobado de producción.  
**Documentos relacionados:** [[Contexto Marco/Portal/_CONTEXT|Contexto vigente]], [[Contexto Marco/Portal/Benchmark_Portal_Clientes_2026|Benchmark de mercado]], [[Contexto Marco/Portal/Portal_Estrategia|Estrategia histórica del Portal]].

> Este documento define qué se construirá y cómo deberá comportarse. La implementación del prototipo comenzará únicamente después de revisar y aprobar esta especificación.

## 1. Resumen

El Portal de Clientes será el espacio digital donde una empresa gestiona toda su relación con González Solís. Reunirá servicios, resultados, pendientes, documentos, conversaciones, contratos, facturas, pagos, calendario, equipo e insights para una o varias razones sociales.

El producto debe responder cinco preguntas cada vez que el cliente entra:

1. ¿Qué requiere mi atención?
2. ¿Cómo está mi empresa?
3. ¿Qué hizo GS durante este periodo?
4. ¿Qué viene después?
5. ¿Qué conviene revisar o decidir?

**Promesa de experiencia:**

> GS conoce mi empresa, coordina mis servicios y me ayuda a actuar.

## 2. Problema

La relación de un cliente con una firma multidisciplinaria suele fragmentarse entre correo, WhatsApp, carpetas, hojas de cálculo, PDFs, reuniones y plataformas especializadas. Esto provoca:

- Información difícil de encontrar.
- Incertidumbre sobre pendientes y avance.
- Poca visibilidad del trabajo realizado por GS.
- Solicitudes repetidas o sin contexto.
- Entregables técnicos con poco apoyo interpretativo.
- Firmas, facturas y pagos separados del servicio.
- Experiencias distintas entre departamentos.
- Dificultad para administrar varias razones sociales y usuarios.

GS ya construye el Portal interno y centraliza datos. El Portal de Clientes debe convertir esas capacidades en una experiencia de servicio sin duplicar los sistemas fuente.

## 3. Objetivos

### Del cliente

- Entender su situación sin recorrer varios canales.
- Atender pendientes con instrucciones claras.
- Consultar resultados, entregables y avance.
- Encontrar documentos y conversaciones históricas.
- Firmar, aclarar facturas y pagar desde el mismo entorno.
- Recibir análisis y recomendaciones con contexto.

### De GS

- Elevar la calidad percibida y real del servicio.
- Reducir seguimiento manual y comunicación dispersa.
- Hacer visible el valor entregado.
- Mejorar puntualidad y calidad de la información recibida.
- Crear una experiencia consistente entre áreas.
- Conectar operación, datos y atención al cliente.
- Preparar una base escalable para analítica e IA.

## 4. Alcance y límites

### Alcance previsto para el futuro prototipo

- Web responsive de alta fidelidad.
- Datos y empresas ficticias.
- Todos los módulos principales y sus estados.
- Recorridos navegables con interacciones simuladas.
- Cambio entre grupo y cinco razones sociales.
- Simulación de roles.
- Firma y pagos simulados.
- Estados vacíos, de error, revisión y acceso restringido representativos.

### Exclusiones del futuro prototipo

- Autenticación o MFA reales.
- Procesamiento real de dinero.
- Firma legal real.
- Persistencia de producción.
- Datos reales de clientes.
- Integraciones con Odoo, ContaLink, BFiskur, AuditBrain o DocuSign.
- Aplicación móvil nativa.
- Recomendaciones autónomas de IA.

### Fuera del primer producto real

- Reemplazar sistemas especialistas.
- Exponer la gestión interna completa de GS.
- Vender el software a terceros.
- Sincronización bidireccional de calendarios.
- Publicación automática de noticias o recomendaciones.

## 5. Usuarios

### Persona primaria — Dirección / dueño / CFO

Necesita una visión consolidada del grupo, riesgos, resultados, decisiones, contratos y obligaciones. Entra con menor frecuencia, pero requiere alta claridad y confianza.

### Personas secundarias

| Persona | Necesidad principal |
|---|---|
| Administración / Contraloría del cliente | Documentos, calendario, facturas, pagos y seguimiento. |
| Responsable contable o fiscal | Cargas, validaciones, cumplimiento y conversaciones técnicas. |
| Firmante autorizado | Identificar qué debe firmar, por qué y antes de cuándo. |
| Usuario de consulta | Acceder solo a información autorizada. |

## 6. Modelo de acceso

GS crea el grupo, las razones sociales, los servicios y el primer administrador. No existe autorregistro público.

### Roles base

| Rol | Consultar | Cargar | Aprobar | Firmar | Pagar | Administrar usuarios |
|---|---:|---:|---:|---:|---:|---:|
| Administrador del cliente | Sí | Sí | Sí | Configurable | Configurable | Sí |
| Ejecutivo | Sí | No | Configurable | Configurable | Configurable | No |
| Responsable operativo | Configurable | Sí | Configurable | No | No | No |
| Firmante autorizado | Limitado | No | No | Sí | No | No |
| Facturación y pagos | Facturación | Comprobante | Aclaraciones | No | Sí | No |
| Solo consulta | Limitado | No | No | No | No | No |

Los permisos se restringen adicionalmente por grupo, razón social, servicio y proyecto. Una persona puede combinar roles.

### Activación

1. Invitación personal con expiración.
2. Confirmación del correo.
3. Creación de credencial.
4. Configuración de MFA.
5. Aceptación de avisos aplicables.
6. Entrada al onboarding o al inicio.

Meta de experiencia: activar el acceso en aproximadamente tres minutos.

## 7. Modelo de información

```text
Grupo empresarial
├── Razones sociales
│   ├── Servicios recurrentes
│   │   └── Periodos
│   ├── Proyectos o encargos
│   │   └── Hitos
│   ├── Pendientes y eventos
│   ├── Documentos
│   └── Facturación
├── Usuarios y permisos
└── Vista consolidada
```

### Entidades funcionales

- **Group:** grupo empresarial.
- **Company:** razón social con RFC, estatus y servicios.
- **User:** persona invitada.
- **Membership:** rol y permisos por alcance.
- **Service:** relación recurrente con un departamento.
- **Engagement:** proyecto o encargo con inicio y cierre.
- **Milestone:** etapa visible del servicio o proyecto.
- **ActionItem:** acción requerida al cliente o a GS.
- **CalendarEvent:** vencimiento, reunión, entrega o renovación.
- **Document:** archivo y metadatos.
- **DocumentVersion:** versión, autor, fecha y validación.
- **Conversation:** hilo contextual.
- **Insight:** hallazgo revisado y publicado.
- **ContentItem:** novedad o artículo curado.
- **Proposal:** alcance comercial y honorarios.
- **Agreement:** documento y proceso de firma.
- **Invoice:** factura sincronizada desde Odoo.
- **PaymentAttempt:** intento o evidencia de pago.
- **Notification:** aviso derivado de un evento.
- **AuditEvent:** registro de acción sensible.

## 8. Arquitectura y navegación

El contexto activo debe ser visible en todo momento:

- **Grupo completo**, para información consolidada.
- **Razón social**, para información individual.

Ninguna cifra se mostrará sin alcance, periodo y fecha de actualización.

### Navegación

1. Inicio.
2. Pendientes y calendario.
3. Servicios.
4. Documentos.
5. Propuestas y contratos.
6. Facturación y pagos.
7. Mensajes.
8. Novedades.
9. Equipo GS.
10. Administración de usuarios.

Los módulos sin contenido o sin permiso se ocultan. Una búsqueda global posterior podrá encontrar documentos, empresas, servicios y conversaciones.

## 9. Inicio ejecutivo

### 9.1 Requiere tu atención

Máximo cinco elementos prioritarios. Cada uno incluye:

- Acción.
- Razón social.
- Servicio.
- Fecha límite.
- Prioridad.
- Responsable.
- Botón directo.

### 9.2 Panorama

Indicadores variables según el alcance seleccionado:

- Cumplimiento.
- Estado de servicios.
- Entregables del periodo.
- Documentos pendientes.
- Facturas y saldo.
- Indicadores financieros autorizados.

### 9.3 Lo que hizo GS

- Hitos completados.
- Entregables publicados.
- Obligaciones presentadas.
- Revisiones terminadas.
- Próximos pasos.

### 9.4 Insights

Tarjetas con hallazgo, impacto, recomendación y acción. Siempre muestran fuente, periodo, fecha y aprobación de GS.

### 9.5 Próximas fechas

Calendario compacto de obligaciones, reuniones, entregables, pagos, renovaciones y firmas.

## 10. Pendientes y calendario

### Bandeja

- Agrupación por fecha, prioridad, empresa y servicio.
- Filtros por responsable, estado y tipo.
- Vistas “Míos”, “De mi equipo”, “Esperando a GS” y “Completados”.
- Acciones: subir, actualizar, aprobar, firmar, pagar o responder.

### Estados de ActionItem

`upcoming` → `open` → `submitted` → `under_review` → `completed`

Desvíos permitidos:

- `under_review` → `changes_required` → `submitted`
- Cualquier pendiente vigente → `overdue`
- Elementos dependientes → `blocked`

### Calendario

- Día, semana, mes y agenda.
- Tipos: fiscal, contable, contractual, proyecto, reunión, pago y renovación.
- Suscripción externa de solo lectura mediante feed.
- La acción se completa únicamente dentro del Portal.

## 11. Servicios

Todos usan una plantilla común:

1. Resumen y estado.
2. Indicadores.
3. Hitos visibles.
4. Pendientes.
5. Entregables.
6. Calendario.
7. Insights.
8. Conversaciones.
9. Equipo responsable.

### Servicios recurrentes

Se organizan por periodo mensual, trimestral o anual. El cliente puede comparar periodos y distinguir datos preliminares de cifras cerradas.

### Proyectos y encargos

Auditoría, Legal, Precios de Transferencia y Consultoría utilizan timeline de hitos. Se muestra estado útil, no porcentaje arbitrario.

Estados de hito: `upcoming`, `in_progress`, `waiting_client`, `under_review`, `completed`, `delayed`.

### Primeros módulos demostrativos

**Contabilidad:** panorama financiero, estado de resultados, balance, entregables y cierre mensual.  
**Impuestos:** cumplimiento, obligaciones, estimación conceptual y alertas.  
**Auditoría:** etapas, evidencias solicitadas, hallazgos autorizados y entrega.  
**Legal/Financiero:** proyecto con hitos, documentos, reuniones y entregables.

## 12. Documentos

### Vistas

- Pendientes.
- Enviados por el cliente.
- Recibidos de GS.
- Firmados.
- Archivo.

### Estados

`requested`, `uploaded`, `under_review`, `changes_required`, `approved`, `completed`, `expired`.

### Reglas

- Cada archivo tiene empresa, servicio/proyecto, periodo, tipo y visibilidad.
- Reemplazar crea una nueva versión; nunca borra el historial.
- “Cargado” no equivale a “aprobado”.
- La corrección incluye explicación visible.
- La descarga registra usuario, documento, versión y fecha.
- La conversación puede abrirse desde el documento.
- Entregables permiten PDF, Excel o PowerPoint según disponibilidad.

## 13. Propuestas, contratos y firma

### Contenido mínimo de propuesta

- Empresas incluidas.
- Servicios y alcance.
- Exclusiones.
- Entregables.
- Honorarios y periodicidad.
- Fechas y vigencia.
- Firmantes.
- Condiciones.

### Acciones

- Revisar.
- Descargar.
- Solicitar aclaración.
- Solicitar cambio.
- Aprobar.
- Rechazar.
- Firmar.

### Estados

`draft`, `sent`, `viewed`, `changes_requested`, `partially_signed`, `completed`, `declined`, `expired`, `voided`.

### Firma

DocuSign ejecuta la firma embebida. El Portal conserva contexto y estado. Al completar:

1. Recibe el evento confirmado.
2. Guarda documento final y certificado.
3. Actualiza firmantes.
4. Completa la acción.
5. Habilita onboarding, anticipo o servicio según reglas.

## 14. Onboarding

### Checklist adaptable

1. Activar acceso y MFA.
2. Confirmar grupo y razones sociales.
3. Aceptar avisos.
4. Firmar propuesta y contratos.
5. Confirmar datos fiscales y de facturación.
6. Registrar contactos y usuarios.
7. Cargar documentación inicial.
8. Cubrir anticipo, cuando aplique.
9. Agendar o confirmar kickoff.
10. Activar servicios.

Estados: `locked`, `available`, `in_progress`, `submitted`, `under_review`, `changes_required`, `approved`, `completed`.

Cada paso muestra responsable, vencimiento, requisitos y criterio de validación. El cliente puede guardar y continuar.

## 15. Facturación y pagos

Odoo es la fuente oficial. El Portal no crea una cartera paralela.

### Funciones

- Estado de cuenta consolidado y por empresa.
- Facturas, XML/PDF y notas de crédito disponibles.
- Servicio y periodo facturado.
- Historial de pagos.
- Solicitud de aclaración.
- Pago total o parcial cuando esté habilitado.
- Liga de pago.
- Tarjeta.
- Ficha o instrucciones de transferencia.
- Carga de comprobante.
- Recibo y confirmación.

### Estados de factura

`issued`, `due_soon`, `overdue`, `disputed`, `partially_paid`, `paid`, `voided`.

### Estados de pago

`initiated`, `processing`, `pending_validation`, `applied`, `failed`, `refunded`.

### Aclaraciones

- La factura cambia a “En aclaración”.
- Se abre hilo contextual con Contraloría.
- Se registra motivo, responsable y fecha esperada.
- Los recordatorios se adaptan para no ignorar la aclaración.
- Solo Odoo confirma saldo y aplicación final.

## 16. Mensajes

- Hilos por documento, pendiente, factura, insight, contrato o proyecto.
- Bandeja general filtrable por empresa y servicio.
- Participantes y responsable GS.
- Archivos adjuntos.
- Estado abierto o resuelto.
- Registro histórico.
- Correos y futuras notificaciones push enlazan al hilo.
- El Portal conserva el registro principal de conversaciones iniciadas allí.

## 17. Insights y simuladores

### Estructura

- Hallazgo.
- Fuente.
- Alcance y periodo.
- Explicación.
- Impacto.
- Recomendación.
- Acción sugerida.
- Responsable GS.
- Fecha de aprobación.

Estados: `draft`, `under_review`, `approved`, `published`, `archived`.

### Gobierno

- El sistema puede detectar y calcular.
- Un profesional de GS revisa la interpretación.
- Ningún insight llega al cliente sin aprobación inicial.
- Proyecciones muestran supuestos y no se presentan como hechos.
- Toda recomendación identifica quién la aprobó y cuándo.

### Primeros casos

- Variaciones de ingresos, costos y márgenes.
- Real contra presupuesto.
- Tendencias y estacionalidad.
- Estimación conceptual de impuestos.
- Vencimientos de e.firma y CSD.
- Riesgos de cumplimiento.
- Escenarios financieros sencillos.

## 18. Novedades

- Contenido creado o aprobado por GS.
- Segmentación por servicio, empresa, tema e impacto.
- Resumen y “Por qué te importa”.
- Vigencia y área responsable.
- Acción recomendada.
- Relación opcional con calendario, pendiente o conversación.
- Enlace al contenido completo.

No se publicará un feed externo automático sin revisión.

## 19. Equipo GS

- Contacto principal.
- Especialistas por servicio.
- Rol y materia.
- Acción para iniciar conversación.
- Sustitución temporal cuando aplique.
- Ruta de escalamiento y soporte.

## 20. Administración de usuarios

- Invitar y reenviar invitación.
- Asignar empresas, servicios y capacidades.
- Copiar permisos de otro usuario.
- Suspender o revocar.
- Consultar último acceso y estado de MFA.
- Revisar sesiones y actividad sensible.
- GS conserva capacidad de administración y revocación.

## 21. Notificaciones

### Eventos iniciales

- Nuevo pendiente.
- Vencimiento próximo o vencido.
- Documento aceptado o con correcciones.
- Entregable publicado.
- Firma requerida o completada.
- Factura emitida, próxima a vencer o pagada.
- Respuesta en conversación.
- Insight o novedad relevante.

### Canales

- Centro de notificaciones.
- Correo transaccional.
- Push en fase móvil.

Cada usuario controla recordatorios no obligatorios. Alertas de seguridad y acciones legales conservan reglas propias.

## 22. Integraciones funcionales

| Sistema | Responsabilidad | Dirección del flujo |
|---|---|---|
| Odoo | Facturas, saldo, pagos y cobranza | Bidireccional controlado; Odoo confirma aplicación. |
| ContaLink | Información contable, estados y cumplimiento | Hacia el Portal; escritura solo si un caso futuro lo exige. |
| BFiskur | Riesgos e indicadores fiscales | Por confirmar tras recorrido real. |
| AuditBrain | Hitos, solicitudes y entregables de auditoría | Por confirmar tras recorrido real. |
| DocuSign | Sobres, firmantes y documentos completados | Portal crea sesión; eventos actualizan estado. |
| Repositorio documental | Archivo, versiones y metadatos | Bidireccional desde flujos autorizados. |
| Calendario | Feed de eventos de solo lectura | Portal hacia calendarios externos. |

Toda integración debe identificar fuente, última sincronización, dueño del dato y comportamiento ante error.

## 23. Requisitos no funcionales

### Seguridad

- Aislamiento estricto entre clientes.
- Mínimo privilegio.
- MFA.
- Cifrado en tránsito y reposo.
- Registro de accesos, descargas, firmas, cambios y pagos.
- Expiración y revocación de invitaciones.
- Gestión de sesiones.
- Escaneo de cargas.
- Respaldo y recuperación.
- Evaluación legal, privacidad y ciberseguridad antes de producción.

### Experiencia

- Responsive desde 360 px.
- Navegación por teclado.
- Contraste accesible.
- Etiquetas además del color para estados.
- Lenguaje ejecutivo y claro.
- Máximo una acción principal por tarjeta.
- Estados de carga, vacío, error y acceso denegado.

### Confiabilidad

- Indicar datos preliminares, cerrados o desactualizados.
- No duplicar registros ante reintentos.
- Mantener historial de versiones y eventos.
- Conservar funcionamiento de consulta cuando una integración no responda, usando la última sincronización válida y una advertencia.

## 24. Métricas

### Adopción

- Invitaciones activadas.
- Usuarios activos mensuales.
- Empresas con actividad.
- Uso por módulo y servicio.

### Eficiencia

- Documentos intercambiados por Portal.
- Tiempo de onboarding.
- Tiempo de respuesta.
- Solicitudes completadas a tiempo.
- Correcciones documentales.
- Reducción de correo y WhatsApp.

### Servicio

- Entregables consultados.
- Insights abiertos.
- Conversaciones iniciadas desde resultados.
- Acciones derivadas de insights.
- Satisfacción del cliente.

### Comercial y cobranza

- Tiempo de firma.
- Propuestas aceptadas.
- Facturas consultadas.
- Aclaraciones y tiempo de resolución.
- Pagos iniciados desde el Portal.
- Días entre emisión y aplicación.

Las metas numéricas se fijarán después de obtener una línea base.

## 25. Prototipo navegable

### Caso ficticio

**Grupo:** EcoPack Norte, fabricante de productos desechables sostenibles.  
**Empresas:** EcoPack Manufactura, EcoPack Comercial, EcoPack Logística, EcoPack Inmuebles y EcoPack Servicios.  
**Servicios:** Contabilidad mensual para cinco empresas, Impuestos, Auditoría anual y proyecto legal/financiero.

### Recorridos obligatorios

1. Activar invitación y MFA.
2. Completar onboarding.
3. Firmar propuesta mediante DocuSign simulado.
4. Cambiar entre grupo y empresas.
5. Consultar inicio ejecutivo.
6. Cargar y reemplazar un documento.
7. Consultar calendario y completar una acción.
8. Revisar información financiera e insight.
9. Consultar Auditoría anual.
10. Abrir conversación contextual.
11. Aclarar factura y simular pago.
12. Invitar usuario con acceso a una empresa.
13. Leer novedad fiscal personalizada.
14. Recorrer las vistas críticas en móvil.

## 26. Inventario de pantallas

### Acceso y onboarding

- Invitación.
- Activación.
- MFA.
- Bienvenida.
- Checklist.
- Paso documental.
- Paso de firma.
- Datos fiscales.
- Usuarios.
- Finalización.

### Aplicación

- Inicio grupo.
- Inicio empresa.
- Pendientes.
- Calendario.
- Servicios.
- Detalle de Contabilidad.
- Detalle de Impuestos.
- Detalle de Auditoría.
- Detalle de proyecto.
- Documentos.
- Detalle/versiones.
- Propuestas y contratos.
- Firma simulada.
- Facturación.
- Detalle/aclaración.
- Pago simulado.
- Mensajes.
- Insight.
- Simulador.
- Novedades.
- Equipo GS.
- Usuarios y permisos.
- Notificaciones.

## 27. Roadmap

### Fase 0 — Investigación y definición

- Benchmark público.
- Recorrido de herramientas GS.
- Mapa de datos y procesos.
- Validación del Product Spec.
- Inventario de pantallas y estados.

### Fase 1 — Prototipo: fundación

- Shell responsive.
- Grupo y empresas.
- Roles simulados.
- Inicio.
- Pendientes y calendario.
- Documentos.
- Mensajes, notificaciones y equipo GS.

### Fase 2 — Prototipo: servicios y valor

- Contabilidad.
- Impuestos.
- Auditoría.
- Proyecto legal/financiero.
- Dashboards.
- Insights.
- Simulador conceptual.
- Novedades.

### Fase 3 — Prototipo: relación administrativa

- Invitación y onboarding.
- Propuestas y contratos.
- Firma simulada.
- Facturación, aclaraciones y pagos simulados.
- Administración de usuarios.

### Fase 4 — Validación

- Dirección y Planeación.
- BI y seguridad.
- Contraloría.
- Líderes de servicio.
- Clientes representativos.
- Ajustes y backlog del MVP real.

### Producto real

1. Identidad, grupos, permisos, inicio, pendientes, documentos, calendario, notificaciones, mensajes y auditoría.
2. Contabilidad e Impuestos.
3. Propuestas, contratos, onboarding y DocuSign.
4. Facturación y pagos con Odoo.
5. Auditoría, Precios de Transferencia, Legal y Consultoría Financiera.
6. Analítica avanzada, simuladores e IA.
7. Aplicación móvil nativa.

## 28. Validación y pruebas

### Pruebas de tarea

- Un ejecutivo identifica lo urgente y abre la acción correcta.
- Un responsable carga un documento y entiende su estado.
- Un firmante completa una propuesta.
- Un usuario cambia de grupo a empresa sin confundir cifras.
- Un responsable de pagos abre una aclaración y entiende el seguimiento.
- Un administrador invita a un usuario limitado a una razón social.

### Pruebas de permisos

- Ningún usuario accede a empresas no asignadas.
- Firmar, pagar y administrar requieren permiso explícito.
- Los enlaces directos respetan el alcance.
- Revocar acceso invalida sesiones activas según política.

### Pruebas de estados

- Vacío, carga, error, sin conexión, desactualizado y acceso denegado.
- Documento con corrección y nueva versión.
- Firma parcial, rechazada y vencida.
- Factura en aclaración, pago por validar y pago fallido.
- Integración temporalmente no disponible.

### Pruebas responsive y accesibilidad

- 360, 768, 1024 y 1440 px.
- Teclado completo.
- Orden de foco y modales.
- Lectura de estado sin depender del color.
- Texto y controles con contraste adecuado.

## 29. Criterios de aceptación del prototipo

- Los 14 recorridos obligatorios son navegables.
- Siempre se reconoce grupo, empresa, servicio y periodo activos.
- Los permisos simulados cambian información y acciones.
- Todo pendiente responde qué, quién y cuándo.
- Servicios muestran estado, hitos, entregables y contacto.
- Documentos muestran versiones y revisiones.
- Conversaciones preservan contexto.
- Firma, onboarding, facturación y pago tienen estados completos.
- Insights separan dato, interpretación y recomendación.
- Vistas críticas funcionan en escritorio y móvil.
- No se utiliza información real de clientes.

## 30. Decisiones confirmadas y pendientes

### Confirmadas

- Prototipo integral de alta fidelidad.
- Invitación exclusiva de GS y MFA.
- Administrador del cliente con permisos delegados.
- Usuario primario ejecutivo.
- Comunicación contextual.
- DocuSign integrado.
- Pagos simulados en el prototipo.
- Odoo como fuente de facturación y cobranza.
- Insights revisados por GS.
- Noticias curadas y personalizadas.
- Calendario con suscripción externa de solo lectura.
- Visibilidad mediante hitos, no tareas internas.
- Web responsive antes de app nativa.
- Integrar sistemas actuales antes de reemplazarlos.

### Pendientes de validación operativa

- Datos, APIs y límites reales de cada sistema fuente.
- Procesos de Contraloría para aclaraciones y aplicación de pagos.
- Plantillas de onboarding por servicio.
- Firmantes y poderes requeridos por tipo de documento.
- Política de pagos parciales y anticipos.
- Reglas de conservación documental.
- Objetivos cuantitativos de adopción y servicio.
