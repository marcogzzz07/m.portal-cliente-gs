# Benchmark de mercado — Portal de Clientes GS

**Fecha de corte:** 12 de octubre de 2026  
**Estado:** investigación pública v1.0; pendiente recorrido operativo de ContaLink, BFiskur y AuditBrain con el equipo de GS.  
**Propósito:** convertir referencias de mercado en decisiones concretas para el Product Spec y el prototipo del Portal de Clientes GS.

## Resumen ejecutivo

No existe un referente único que reúna exactamente lo que GS quiere construir. El mercado se divide en cinco familias:

1. **Gestión integral de firmas**, como TaxDome, Canopy y Karbon: resuelven muy bien onboarding, solicitudes, documentos, firma, facturación, cobro y comunicación.
2. **Sistemas contables y fiscales**, como ContaLink, QuickBooks, Xero, Siigo e Intuit: concentran datos operativos, cálculos, reportes y cumplimiento.
3. **Plataformas de analítica para firmas**, como Silverfin: transforman datos contables estructurados en alertas, reportes e información para conversaciones consultivas.
4. **Plataformas profesionales adyacentes**, como Clio: organizan la experiencia por asunto, mantienen un hilo contextual y hacen visible el avance al cliente.
5. **Experiencias financieras digitales**, como Brex: destacan por jerarquía multiempresa, permisos, acciones rápidas, reportes configurables y claridad de estados.

La oportunidad de GS no es replicar un software contable ni construir primero otro gestor interno. Es crear una **capa de experiencia y coordinación** que conecte sistemas existentes con el criterio profesional de GS. El diferencial propuesto es:

> Una sola relación digital para varias razones sociales y varias especialidades, donde el cliente entiende su situación, atiende lo que falta, recibe el trabajo de GS y convierte información en decisiones.

## Método y límites

- Se revisaron páginas oficiales, centros de ayuda, documentación de producto y materiales de proveedores.
- Las capacidades se registran como disponibles públicamente; no se evaluó su calidad operativa mediante cuentas pagadas.
- La presencia de una función no significa que GS deba copiar su implementación.
- Las funciones de ContaLink, BFiskur y AuditBrain deben contrastarse con el uso real de GS.
- Precios, disponibilidad regional, APIs y condiciones comerciales deberán validarse antes de cualquier decisión de compra o integración.

## Matriz ejecutiva

Escala: **Alta** = capacidad central; **Media** = disponible o parcial; **Baja** = secundaria/no evidente; **N/D** = no confirmada públicamente.

| Plataforma | Foco | Portal cliente | Tareas / solicitudes | Documentos | Firma | Facturación / pagos | Dashboards / insights | Multiempresa | Aporte principal a GS |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ContaLink | Contabilidad y fiscal México | Baja | Media | Alta | N/D | Media | Alta | Alta | Fuente operativa contable, fiscal y de cumplimiento. |
| BFiskur | Riesgo y analítica fiscal | N/D | N/D | N/D | N/D | N/D | Alta | Indicadores y alertas fiscales; requiere recorrido real. |
| AuditBrain | Gestión de auditoría | Baja | Media | Alta | N/D | N/D | Media | Hitos, evidencia, hallazgos y estado del encargo. |
| TaxDome | Gestión integral de firmas | Alta | Alta | Alta | Alta | Alta | Media | Referente más completo del ciclo propuesta-a-pago. |
| Canopy | Gestión de firmas contables | Alta | Alta | Alta | Alta | Alta | Media | Excelente lista de acciones, vínculos seguros y experiencia móvil. |
| Karbon | Operación y colaboración | Alta | Alta | Alta | Alta | Media | Media | Automatización entre solicitud, aprobación y siguiente tarea. |
| Xero | Contabilidad empresarial | Media | Baja | Media | Baja | Alta | Alta | Reportes vivos, conciliación y lenguaje claro sobre métricas. |
| QuickBooks Online Accountant | Ecosistema contable | Media | Media | Media | Baja | Alta | Alta | Conexión libros-facturación-pagos y colaboración con contador. |
| Intuit ProConnect / Tax Advisor | Preparación y asesoría fiscal EE. UU. | Alta | Alta | Alta | Alta | Media | Alta | Organizers, recordatorios, escenarios y recomendaciones cuantificadas. |
| Siigo | Contabilidad LATAM | Media | Media | Media | Baja | Alta | Alta | Facturación, cartera, obligaciones y localización regional. |
| Holded | ERP pyme España | Media | Media | Media | Baja | Alta | Alta | Flujo cotización-factura-pago y asesor trabajando sobre datos vivos. |
| Silverfin | Datos y analítica para firmas | Media | Alta | Alta | Media | Baja | Alta | Datos normalizados, alertas e insights consultivos escalables. |
| Clio | Gestión legal | Alta | Alta | Alta | Media | Alta | Media | Organización por asunto, comunicación segura y transparencia. |
| DocuSign | Firma y acuerdos | Media | Media | Alta | Alta | Baja | Baja | Firma embebida, múltiples firmantes y eventos de estado. |
| Brex | Finanzas y gasto corporativo | Media | Alta | Alta | Baja | Alta | Alta | UX multi-entidad, permisos, alertas y acciones financieras rápidas. |

## Hallazgos por referente

### 1. ContaLink — México

**Lo relevante.** Automatiza descarga y clasificación de CFDI, conciliación, contabilidad electrónica, DIOT, documentos fiscales, facturación y nómina. Admite múltiples usuarios y RFC, y ofrece acceso móvil a información y documentos.

**Aplicación para GS.** Debe funcionar como fuente operativa para estados financieros, cumplimiento y documentos fiscales. El Portal de Clientes debe traducir la salida técnica a información entendible, mantener la fuente y periodo visibles y evitar duplicar cálculos.

**Límite.** Su foco es la producción contable/fiscal; no cubre por sí solo la relación multidisciplinaria con GS.

**Fuente:** [ContaLink — funciones](https://www.contalink.com/inicio) y [manual de uso](https://www.contalink.com/manual-de-usuario/).

### 2. BFiskur — México

**Lo relevante.** Se presenta públicamente como solución de analítica y riesgo fiscal de BITAM. La información pública encontrada es insuficiente para documentar con seguridad módulos, permisos y flujos actuales.

**Aplicación para GS.** Evaluar alertas, indicadores y análisis que puedan alimentar el módulo de Impuestos. Confirmar exportaciones, APIs, granularidad por RFC y trazabilidad de resultados.

**Siguiente validación.** Recorrido real con un usuario de GS: inicio, cartera de clientes, alertas, análisis, documentos, exportaciones y periodicidad.

**Fuente pública localizada:** [material BFiskur/BITAM](https://www.bfiskur.com/descargas/Soluciones%20Fiscales17octubre2022.pdf).

### 3. AuditBrain — Latinoamérica

**Lo relevante.** Suite cloud para auditoría externa, auditoría interna y gestión de calidad. Trabaja con metodología basada en riesgos, flujos de trabajo, documentación y personalización de la metodología.

**Aplicación para GS.** El Portal no debe exponer papeles internos. Debe extraer la capa cliente: etapa del encargo, requerimientos de evidencia, fechas, hallazgos autorizados, entregables y próximos pasos.

**Fuente:** [AuditBrain](https://auditbrain.com/).

### 4. TaxDome — internacional

**Lo relevante.** Centraliza CRM, workflows, solicitudes, documentos, mensajes, firma, propuestas, facturación y pagos. Su portal y app permiten que el cliente complete tareas, cargue documentos, firme y pague. Las propuestas pueden incluir servicios, términos, firmantes, facturas únicas o recurrentes y anticipos.

**Aplicación para GS.** Es el referente directo para el ciclo completo. Adoptar la lógica de “acción pendiente” y la continuidad propuesta → firma → anticipo → onboarding → servicio. Adaptar el modelo a grupos empresariales y servicios multidisciplinarios.

**Límite.** Su fortaleza es administración de la firma; GS necesita agregar analítica empresarial más rica y una experiencia consolidada por grupo.

**Fuentes:** [visión de producto](https://taxdome.com/company-information), [portal del cliente](https://client-help.taxdome.com/) y [propuestas](https://sv.help.taxdome.com/category/1324-proposals).

### 5. Canopy — Estados Unidos

**Lo relevante.** Portal, aplicación móvil, solicitudes, cuestionarios, documentos, firma, pagos y vínculos seguros que permiten completar acciones concretas sin fricción. Ofrece recordatorios automáticos y estados visibles.

**Aplicación para GS.** Adoptar listas de acciones muy claras, carga desde móvil y acceso profundo desde una notificación al pendiente específico. Considerar vínculos seguros para acciones acotadas, sujetos a la evaluación de seguridad.

**Fuente:** [Canopy Client Portal](https://www.getcanopy.com/accounting-client-portal/) y [guías del cliente](https://support.getcanopy.com/en/collections/9480200-guides-for-your-clients).

### 6. Karbon — internacional

**Lo relevante.** Conecta solicitudes del cliente con el workflow interno. Las firmas y aprobaciones pueden disparar automáticamente la siguiente tarea. El portal muestra solicitudes pendientes y terminadas.

**Aplicación para GS.** Separar el hito visible del cliente de las tareas internas, pero conectar sus estados: una acción del cliente debe desbloquear el siguiente paso interno sin trabajo manual.

**Fuente:** [Karbon eSignatures & Approvals](https://karbonhq.com/en-GB/feature/e-signatures/).

### 7. Xero — Oceanía / internacional

**Lo relevante.** Contabilidad conectada, facturación, pagos, conciliación, reportes, flujo de efectivo y experiencia móvil. Sus mejoras recientes incorporan explicaciones en lenguaje natural de métricas y opciones de pago desde estados de cuenta.

**Aplicación para GS.** Tomar como referencia el salto de reporte a explicación: no mostrar únicamente cifras, sino qué significan y cómo se calculan. Usar patrones móviles para revisar saldos, resultados y flujo.

**Fuentes:** [Xero mobile](https://central.xero.com/0/article/Xero-for-mobile-US) y [actualizaciones de producto](https://central.xero.com/s/article/Xero-product-releases-ROW).

### 8. QuickBooks Online Accountant — Estados Unidos / internacional

**Lo relevante.** Une libros, facturación, pagos, reportes, flujo y colaboración con el contador dentro de un ecosistema amplio.

**Aplicación para GS.** Referencia para trazabilidad entre factura, pago y contabilidad, y para conceder acceso profesional controlado. No debe definir la arquitectura del portal porque su unidad central es el libro contable, no la relación completa con una firma multidisciplinaria.

**Fuente:** [QuickBooks features](https://quickbooks.intuit.com/global/features/).

### 9. Intuit ProConnect / Tax Advisor — Estados Unidos

**Lo relevante.** Portal para solicitar documentos fiscales, organizers, recordatorios recurrentes, firma y preparación. Tax Advisor convierte datos en escenarios, estrategias, ahorro estimado, acciones y reportes presentables al cliente.

**Aplicación para GS.** Es el referente más útil para el simulador fiscal y la gobernanza de insights. Cada recomendación debe mostrar supuestos, escenario base, impacto estimado, acciones y revisión profesional.

**Fuentes:** [Intuit Link](https://accountants.intuit.com/tax-client-portal-for-accountants/), [Tax Advisor](https://accountants.intuit.com/tax-advice-planning-for-professionals/) y [comparación de funciones](https://accountants.intuit.com/support/en-us/help-article/tax-planning/intuit-tax-advisor-vs-proconnect-tax-lacerte-tax/L6ZcodrdG_US_en_US).

### 10. Siigo — Latinoamérica

**Lo relevante.** Ecosistema contable y administrativo con facturación electrónica, cartera, pagos, cotizaciones, estados financieros, múltiples empresas y acceso del contador. Tiene presencia y adaptación regulatoria en varios países de Latinoamérica.

**Aplicación para GS.** Referencia regional para obligaciones, cotización-a-factura, cartera y localización. Observar cómo simplifica conceptos técnicos y cómo presenta información desde móvil.

**Fuentes:** [Siigo México](https://www.siigo.com/mx/blog/tecnologia-e-innovacion/que-es-y-porque-activar-portal-siigo-nube/) y [ecosistema Siigo](https://www.siigo.com/home-b/).

### 11. Holded — España

**Lo relevante.** Une facturación, contabilidad, bancos, CRM, proyectos y equipo. Su portal de cliente permite consultar facturas, descargar PDF y pagar en línea; también permite que la asesoría trabaje sobre los datos actuales de la empresa.

**Aplicación para GS.** Referencia para continuidad propuesta → venta → factura → pago y para colaboración sin enviar carpetas por correo. Adoptar el principio de que todos los módulos comparten el mismo maestro de cliente.

**Fuentes:** [funcionalidades](https://www.holded.com/es/funcionalidades) y [facturación/portal](https://www.holded.com/es/programa-facturacion).

### 12. Silverfin — Europa

**Lo relevante.** Centraliza datos contables estructurados de múltiples fuentes, estandariza planes de cuentas, automatiza compliance y genera alertas e insights a nivel de cartera. Pulse extiende colaboración al cliente.

**Aplicación para GS.** Referencia para la capa de datos e inteligencia: normalización, fuente viva, alertas por umbral, comparación y “talking points” que convierten compliance en conversación consultiva.

**Límite.** La experiencia administrativa completa del cliente no es su principal diferenciador.

**Fuentes:** [Silverfin](https://silverfin.com/en-gb/), [Insights](https://silverfin.com/product/insights/) y [colaboración](https://silverfin.com/feature/collaboration/).

### 13. Clio — legal, Norteamérica / internacional

**Lo relevante.** Organiza documentos, mensajes, eventos, facturas y pagos por asunto. El cliente entra por invitación y autenticación por correo. La experiencia reduce incertidumbre al hacer visible qué ocurre y qué requiere la firma.

**Aplicación para GS.** Los proyectos legales, auditorías y consultorías deben tener una página de “asunto” con hitos, próximos pasos, documentos, conversaciones y facturación relacionada.

**Fuente:** [Clio for Clients](https://www.clio.com/clients/) y [portal legal](https://www.clio.com/ca/features/legal-client-portal-software/).

### 14. DocuSign — firma y acuerdos

**Lo relevante.** Permite firma embebida, múltiples firmantes, redirección al portal y eventos para sincronizar estados del sobre y de los participantes.

**Aplicación para GS.** Usar DocuSign como ceremonia de firma, mientras el Portal controla el contexto: propuesta, empresas, servicios, firmantes, avance, documento final y siguiente paso.

**Fuentes:** [firma embebida](https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/embedding/) y [Connect/webhooks](https://developers.docusign.com/platform/webhooks/connect/).

### 15. Brex — experiencia financiera adyacente

**Lo relevante.** Inicio configurable, acciones rápidas, reportes por entidad, usuario y categoría, alertas, permisos y operación global consolidada.

**Aplicación para GS.** Referencia de UX para grupos: contexto global claro, cambio entre entidades, resumen ejecutivo, exportación y permisos granulares.

**Fuentes:** [inicio](https://www.brex.com/support/home-page), [reportes](https://www.brex.com/support/brex-reporting) y [operación multi-entidad](https://www.brex.com/product/global).

## Patrones que GS debe adoptar

| Patrón | Referentes | Decisión para GS |
|---|---|---|
| Una lista priorizada de acciones | TaxDome, Canopy | El inicio abre con “Requiere tu atención”, con acción y vencimiento. |
| Contexto unido a la conversación | Canopy, Karbon, Clio | Cada documento, factura, insight o proyecto puede abrir un hilo. |
| Propuesta a pago sin cambio de canal | TaxDome, Canopy, Holded | Propuesta, firma, onboarding, anticipo y servicio forman un recorrido continuo. |
| Grupo y entidades claramente separados | Brex, sistemas multiempresa | El contexto activo siempre se muestra y puede cambiarse sin ambigüedad. |
| Insights con acción | Silverfin, Intuit Tax Advisor | Hallazgo + explicación + impacto + recomendación + contacto. |
| Acciones desde móvil | Canopy, Xero, Clio | Subir, firmar, responder y pagar deben funcionar en una pantalla pequeña. |
| Automatización por eventos | Karbon, DocuSign | La acción del cliente actualiza estados y desbloquea el siguiente paso. |
| Acceso por invitación | Canopy, Clio | GS crea el espacio y controla la primera identidad. |

## Patrones que GS debe adaptar

- **Bloqueo de documentos por pago:** puede ser útil en ciertos proyectos, pero no debe convertirse en regla general para servicios de cumplimiento ni comprometer obligaciones profesionales.
- **Vínculos sin cuenta:** pueden reducir fricción para acciones concretas, pero requieren política de expiración, autenticación y clasificación de información.
- **Dashboards genéricos:** cada servicio necesita indicadores con significado y narrativa; no basta replicar gráficas disponibles.
- **Chat general:** debe convertirse en conversaciones ligadas a contexto y con responsable, evitando otro canal desordenado.
- **Automatización de insights:** el cálculo puede automatizarse; el mensaje visible requiere aprobación de GS inicialmente.

## Funciones a posponer

- Aplicación móvil nativa antes de validar uso en web responsive.
- IA que publique recomendaciones sin revisión profesional.
- Sincronización bidireccional completa con calendarios externos.
- Sustitución inmediata de ContaLink, BFiskur o AuditBrain.
- Marketplace o venta de software a terceros.
- Personalización libre del dashboard por cada usuario.
- Ejecución bancaria directa desde el Portal.

## Funciones a descartar del primer alcance

- Autorregistro público de clientes.
- Exponer tareas internas, revisiones de calidad o porcentajes arbitrarios de avance.
- Feed automático de noticias sin curaduría.
- Duplicar en el Portal la fuente oficial de facturas y pagos de Odoo.
- Usar correo o WhatsApp como registro principal de solicitudes iniciadas dentro del Portal.

## Galería textual de patrones para el prototipo

### Inicio “Qué requiere tu atención”

Tarjetas compactas con acción inmediata, fecha, entidad y servicio. Máximo cinco urgentes; el resto abre la bandeja completa.

### Selector de contexto

Control persistente en el encabezado con dos niveles: “Grupo completo” o razón social. Toda métrica muestra su alcance y fecha de actualización.

### Página de servicio

Encabezado con estado, responsable GS, periodo y próximo hito; debajo: indicadores, pendientes, hitos, entregables, calendario e insights.

### Página de proyecto o asunto

Timeline de hitos para Auditoría, Legal y Consultoría; lista separada de solicitudes al cliente; documentos, conversaciones y facturación relacionadas.

### Insight consultivo

Título accionable, cifra o señal, explicación, evidencia, impacto, recomendación aprobada, responsable GS y botón “Conversar sobre esto”.

### Centro documental

Vistas Pendientes, Enviados, Recibidos, Firmados y Archivo. Estados legibles, versiones, motivo de corrección y conversación contextual.

### Factura con problema

La factura mantiene saldo e historial, pero cambia a “En aclaración”. Los recordatorios se adaptan y muestran responsable y fecha esperada de respuesta.

## Preguntas para el recorrido real de herramientas GS

### ContaLink

- ¿Qué datos y documentos consulta o exporta GS por RFC?
- ¿Qué información está disponible por API, descarga o proceso automatizado?
- ¿Cómo se identifican periodos cerrados y cifras oficiales?
- ¿Qué estados de cumplimiento son confiables para mostrar al cliente?

### BFiskur

- ¿Qué riesgo, indicador o alerta genera?
- ¿Cuál es la fuente y frecuencia de actualización?
- ¿Puede explicarse el cálculo al cliente?
- ¿Permite exportar o consultar por API?
- ¿Qué hallazgos requieren interpretación profesional antes de publicarse?

### AuditBrain

- ¿Qué etapas e hitos existen en un encargo?
- ¿Cómo se solicitan y revisan evidencias?
- ¿Qué parte del avance puede compartirse sin exponer papeles internos?
- ¿Cómo se identifican entregables y versiones aprobadas?
- ¿Existe API o exportación para automatizar estados?

## Conclusión

El benchmark respalda la tesis del producto: el Portal debe ser una capa de experiencia, coordinación y asesoría construida sobre sistemas especialistas. TaxDome y Canopy muestran el estándar administrativo; Silverfin e Intuit muestran el salto hacia insights; Clio demuestra el valor de organizar proyectos profesionales por asunto; Brex ofrece el patrón multi-entidad. GS puede diferenciarse al reunir esas ideas alrededor de una relación multidisciplinaria y humana.
