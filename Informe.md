# Informe de Pruebas de Rendimiento – K6
## Automatizador de Siniestros · InsurTech MVP v1.0

---

| Campo | Detalle |
|---|---|
| **Proyecto** | Automatizador de Siniestros – InsurTech |
| **Ciclo** | Microsprint 1, 2 y 3 (consolidado) |
| **Tipo de prueba** | Rendimiento y carga (k6) |
| **Fecha de ejecución** | 2026-04-04 |
| **QA responsable** | Jean Pierre Villacis |
| **Entorno** | Docker local – API Gateway :8080 / PostgreSQL :5433 |
| **Herramienta** | k6 (Grafana) – ejecución local |
| **Script principal** | `tests/main-test.js` |

---

## 1. Alcance de las Pruebas

Las pruebas de rendimiento cubrieron los cuatro endpoints de consulta identificados en el TEST_PLAN.md con cobertura de rendimiento explícita:

| HU | Nombre | Endpoints evaluados |
|----|--------|---------------------|
| HU-002 | Consultar Asegurados | `GET /api/v1/asegurados` · `GET /api/v1/asegurados/{id}` |
| HU-004 | Consultar Vehículos | `GET /api/v1/vehiculos` · `GET /api/v1/vehiculos/{id}` |
| HU-006 | Consultar Pólizas | `GET /api/v1/polizas` · `GET /api/v1/polizas/{id}` |
| HU-013 | Consulta estado de reclamo | `GET /api/v1/reclamos/{num}/estado` |

Adicionalmente se validaron en cada HU los casos de recurso inexistente (respuesta `404 Not Found` esperada), cubriendo así los casos CP003 de HU-002, HU-004, HU-006 y CP004 de HU-013.

**Fuera de alcance en este ciclo de rendimiento:** endpoints POST/PUT (HU-001, HU-003, HU-005, HU-007, HU-009) y endpoints del panel gestor (HU-011, HU-012).

---

## 2. Configuración del Escenario de Carga

```
Escenario:   ramp-up → carga sostenida → ramp-down
VUs máximos: 10
Duración total: 1m 50s

Etapas:
  0  →  30s  → 10 VUs  (rampa de entrada)
  30s → 1m30s → 10 VUs  (carga sostenida)
  1m30s → 1m50s → 0 VUs  (rampa de salida)
```

**Umbrales (thresholds) definidos:**

| Métrica | Threshold | Justificación |
|---------|-----------|---------------|
| `http_req_duration p(95)` | < 500 ms | SLA de respuesta aceptable para operaciones de consulta |
| `http_req_duration p(95)` por HU | < 500 ms | Trazabilidad de degradación por servicio |
| `http_req_failed` | < 5% | Tolerancia máxima de errores en producción |

---

## 3. Resultados de Ejecución

### 3.1 Resumen general

| Métrica | Valor |
|---------|-------|
| **Total de iteraciones completadas** | 175 |
| **Total de requests HTTP** | 2 102 |
| **Throughput (req/s)** | 19.02 req/s |
| **Checks evaluados** | 7 704 |
| **Checks pasados** | 7 704 (100 %) |
| **Checks fallidos** | 0 (0 %) |
| **http_req_failed** | 0.00 % |
| **Duración de iteración (avg)** | 5.01 s |
| **Duración de iteración (min/max)** | 4.98 s / 5.09 s |
| **Datos recibidos** | 1.2 MB (11 kB/s) |
| **Datos enviados** | 652 kB (5.9 kB/s) |

### 3.2 Métricas de tiempo de respuesta (global)

| Estadístico | Valor |
|-------------|-------|
| Promedio (avg) | 8.97 ms |
| Mínimo (min) | 1.54 ms |
| Mediana (med) | 8.36 ms |
| Percentil 90 (p90) | 12.30 ms |
| **Percentil 95 (p95)** | **14.95 ms** |
| Máximo (max) | 125.92 ms |

### 3.3 Métricas de tiempo de respuesta por Historia de Usuario

| HU | p(95) medido | Threshold | Estado | Requests |
|----|:------------:|:---------:|:------:|:--------:|
| HU-002 – Asegurados | 15.57 ms | 500 ms | ✅ PASS | ~525 |
| HU-004 – Vehículos | 13.94 ms | 500 ms | ✅ PASS | ~525 |
| HU-006 – Pólizas | 15.53 ms | 500 ms | ✅ PASS | ~525 |
| HU-013 – Estado reclamo | 14.26 ms | 500 ms | ✅ PASS | ~525 |

### 3.4 Resultado de Thresholds

| Threshold | Valor obtenido | Resultado |
|-----------|:--------------:|:---------:|
| `http_req_duration p(95) < 500ms` (global) | 14.95 ms | ✅ PASS |
| `{hu:HU-002} p(95) < 500ms` | 15.57 ms | ✅ PASS |
| `{hu:HU-004} p(95) < 500ms` | 13.94 ms | ✅ PASS |
| `{hu:HU-006} p(95) < 500ms` | 15.53 ms | ✅ PASS |
| `{hu:HU-013} p(95) < 500ms` | 14.26 ms | ✅ PASS |
| `http_req_failed < 5%` | 0.00 % | ✅ PASS |

### 3.5 Resultado de Checks por Historia de Usuario

#### HU-002 – Consultar Asegurados

| Check | Resultado |
|-------|:---------:|
| login: status 200 | ✅ |
| login: token presente | ✅ |
| [HU-002] status 200 (lista) | ✅ |
| [HU-002] respuesta es array | ✅ |
| [HU-002] contiene >= 2 asegurados | ✅ |
| [HU-002] campo `nombre` presente | ✅ |
| [HU-002] campo `apellido` presente | ✅ |
| [HU-002] campo `numeroIdentificacion` presente | ✅ |
| [HU-002] nombre correcto: "Juan" | ✅ |
| [HU-002] apellido correcto: "Perez" | ✅ |
| [HU-002] identificación presente en detalle | ✅ |
| [HU-002] status 404 para recurso inexistente | ✅ |

#### HU-004 – Consultar Vehículos

| Check | Resultado |
|-------|:---------:|
| [HU-004] status 200 (lista) | ✅ |
| [HU-004] respuesta es array | ✅ |
| [HU-004] contiene >= 2 vehículos | ✅ |
| [HU-004] campo `marca` presente | ✅ |
| [HU-004] campo `modelo` presente | ✅ |
| [HU-004] campo `placa` presente | ✅ |
| [HU-004] campo `anio` presente | ✅ |
| [HU-004] marca: "Chevrolet" | ✅ |
| [HU-004] modelo: "Aveo" | ✅ |
| [HU-004] placa: "PBA-1234" | ✅ |
| [HU-004] año: 2022 | ✅ |
| [HU-004] status 404 para recurso inexistente | ✅ |

#### HU-006 – Consultar Pólizas

| Check | Resultado |
|-------|:---------:|
| [HU-006] status 200 (lista) | ✅ |
| [HU-006] respuesta es array | ✅ |
| [HU-006] contiene >= 2 pólizas | ✅ |
| [HU-006] campo `numero` presente | ✅ |
| [HU-006] campo `estado` presente | ✅ |
| [HU-006] campo `vigenciaInicio` presente | ✅ |
| [HU-006] campo `vigenciaFin` presente | ✅ |
| [HU-006] numero: "POL-2026-001" | ✅ |
| [HU-006] estado: "ACTIVA" | ✅ |
| [HU-006] valorAsegurado presente | ✅ |
| [HU-006] status 404 para recurso inexistente | ✅ |

#### HU-013 – Consulta Estado de Reclamo

| Check | Resultado |
|-------|:---------:|
| [HU-013] status 200 (reclamo APROBADO) | ✅ |
| [HU-013] estado: "APROBADO" | ✅ |
| [HU-013] campo `montoAprobado` presente | ✅ |
| [HU-013] campo `deducibleCalculado` presente | ✅ |
| [HU-013] status 200 (reclamo DESCARTADO) | ✅ |
| [HU-013] estado: "DESCARTADO" | ✅ |
| [HU-013] campo `mensajeEstado` presente | ✅ |
| [HU-013] status 404 para reclamo inexistente | ✅ |

---

## 4. Análisis de Rendimiento

### 4.1 Comportamiento bajo carga

El sistema demostró un rendimiento **excepcional** bajo el escenario de 10 VUs concurrentes:

- El tiempo de respuesta promedio fue de **8.97 ms**, muy por debajo del umbral de 500 ms.
- El percentil p(95) global fue de **14.95 ms**, lo que indica que el 95% de las peticiones se resolvió en menos de 15 ms.
- El máximo observado fue de **125.92 ms**, registrado durante los primeros instantes de la rampa de entrada (cold start del JVM/Spring Boot), sin recurrencia posterior.
- La duración de iteración fue extremadamente estable: avg **5.01 s** con una desviación de apenas **110 ms** entre mínimo y máximo. Esto indica ausencia de degradación acumulada ni saturación del sistema.

### 4.2 Comparativa entre endpoints

| Endpoint | p(95) | Delta vs threshold | Margen disponible |
|----------|:-----:|:-----------------:|:-----------------:|
| `GET /asegurados` | ~13 ms | −487 ms | 97.4 % del presupuesto libre |
| `GET /asegurados/{id}` | ~16 ms | −484 ms | 96.8 % del presupuesto libre |
| `GET /vehiculos` | ~12 ms | −488 ms | 97.6 % del presupuesto libre |
| `GET /vehiculos/{id}` | ~14 ms | −486 ms | 97.2 % del presupuesto libre |
| `GET /polizas` | ~14 ms | −486 ms | 97.2 % del presupuesto libre |
| `GET /polizas/{id}` | ~16 ms | −484 ms | 96.8 % del presupuesto libre |
| `GET /reclamos/{num}/estado` | ~14 ms | −486 ms | 97.2 % del presupuesto libre |

Todos los endpoints tienen un margen de rendimiento superior al **96%** respecto al threshold definido.

### 4.3 Throughput

Se procesaron **19.02 req/s** de forma sostenida durante toda la prueba. Con 10 VUs y cada iteración incluyendo 12 requests + 1.9 s de sleep acumulado, el sistema nunca mostró señales de backpressure ni queue build-up.

---

## 5. Cobertura de Casos de Prueba

| HU | CP cubiertos en K6 | CPs del TEST_CASES.md | Cobertura K6 |
|----|:------------------:|:---------------------:|:------------:|
| HU-002 | CP001, CP002, CP003 | CP001, CP002, CP003 | 100 % |
| HU-004 | CP001, CP002, CP003 | CP001, CP002, CP003 | 100 % |
| HU-006 | CP001, CP002, CP003 | CP001, CP002, CP003 | 100 % |
| HU-013 | CP001, CP003, CP004* | CP001–CP005 | 60 % |


---

## 6. Hallazgos sobre la Preparación del Entorno

El proceso de preparación del entorno evidenció las siguientes brechas que impactan directamente el criterio de entrada definido en el TEST_PLAN.md (sección 5.1):


1.  Las credenciales fueron externalizadas a un archivo `.env` (excluido del repositorio vía `.gitignore`). Los scripts leen las variables mediante `__ENV.GESTOR_USERNAME`, `__ENV.GESTOR_PASSWORD`, `__ENV.ASEGURADO_USERNAME`, `__ENV.ASEGURADO_PASSWORD` y `__ENV.BASE_URL`. La ejecución se realiza mediante `run.sh`, que carga el `.env` antes de invocar k6. Se provee `.env.example` como plantilla sin valores para nuevos integrantes del equipo.

---

## 7. Conclusiones

### 7.1 Rendimiento del sistema

> **El sistema supera ampliamente los criterios de rendimiento establecidos.**

Bajo una carga de 10 usuarios concurrentes durante 1 minuto 50 segundos:

- **0 fallos** en 2 102 requests.
- **100% de checks** pasados (7 704 / 7 704).
- **Todos los thresholds** en verde.
- Tiempo de respuesta p(95) de **14.95 ms** frente al límite de 500 ms — el sistema tiene un margen de rendimiento del **97%** antes de acercarse al umbral.
- El comportamiento fue homogéneo en todas las HUs: no hay un endpoint que destaque negativamente.

La arquitectura de microservicios con API Gateway no introduce latencia significativa. Los tiempos observados sugieren que la capa de base de datos (PostgreSQL en Docker) responde eficientemente para el volumen de datos actual (2 registros por tabla).

### 7.2 Calidad del contrato de API

Los checks de estructura de respuesta (presencia de campos, tipos de dato, valores) pasaron al 100%, lo que indica que:

- El contrato entre el API Gateway y los clientes es estable.
- Los DTOs de respuesta son consistentes con los criterios de aceptación de las HUs.
- La excepción documentada (INC-002, campo `mensajeEstado`) fue un error en la especificación de los scripts de prueba, no en la implementación.

### 7.3 Madurez del proceso de pruebas

Se identificaron tres incidencias de proceso (INC-001, INC-002, INC-003), ninguna originada en la aplicación bajo prueba. Esto indica que la **aplicación es estable**, pero el **proceso de preparación y los artefactos de prueba requieren maduración**:

- El seed de datos está incompleto para el conjunto total de pruebas (pendiente).
- La gestión de credenciales fue resuelta: variables de entorno vía `.env` + `run.sh`, sin valores sensibles en el código fuente.
- No hay estandarización sobre cómo tratar respuestas de error esperadas en K6 (resuelto para este ciclo con `responseCallback`; pendiente documentarlo formalmente).

---

## 8. Recomendaciones

### 8.1 Corto plazo (próximo microsprint)

| # | Recomendación | Prioridad | Responsable |
|---|---------------|:---------:|-------------|
| R-01 | **Actualizar `data/seed.sql`** para incluir la inserción de ambos usuarios en `auth_schema.usuarios` (gestor01 y asegurado01). La contraseña debe estar hasheada con BCrypt o el script debe llamar al endpoint `/auth/register` como parte del setup. | Alta | QA |
| R-03 | **Cubrir CP002 de HU-013** (reclamo EN_REVISION_MANUAL): agregar un reclamo con ese estado en el seed e implementar el check correspondiente. | Media | QA |
| R-04 | **Cubrir CP005 de HU-013** (intento de consulta de reclamo de otro asegurado): validar que el sistema retorne `403 Forbidden` para reforzar las pruebas de autorización por rol. | Media | QA |

### 8.2 Mediano plazo (antes del cierre del ciclo)

| # | Recomendación | Prioridad | Responsable |
|---|---------------|:---------:|-------------|
|Credenciales en `.env` (excluido del repo), leídas vía `__ENV` en todos los scripts. Ejecución mediante `run.sh`. Se provee `.env.example` como plantilla. | ~~Alta~~ | ✅ Cerrado |
| R-06 | **Incrementar la carga de prueba** a 50–100 VUs para validar el comportamiento real bajo carga de producción estimada. Con los tiempos actuales (p95 < 15ms con 10 VUs), el sistema probablemente escala bien, pero es necesario validarlo con datos. | Media | QA |
| R-07 | **Agregar prueba de soak test** (carga moderada durante 30–60 minutos) para detectar memory leaks o degradación progresiva, especialmente en la JVM de Spring Boot. | Media | QA |
| R-08 | **Documentar el contrato de respuesta** de cada endpoint en OpenAPI/Swagger y mantenerlo sincronizado con los checks de K6. La desviación INC-002 es una señal de que este contrato no estaba formalizado. | Media | DEV |

### 8.3 Largo plazo (infraestructura de pruebas)

| # | Recomendación | Prioridad | Responsable |
|---|---------------|:---------:|-------------|
| R-09 | **Integrar K6 en el pipeline CI/CD** (GitHub Actions o similar) para que los tests de rendimiento se ejecuten automáticamente en cada merge a la rama principal. Usar `k6 run --out json` para archivar resultados históricos. | Media | QA + DEV |
| R-10 | **Agregar pruebas de rendimiento a HU-007 (POST /reclamos)** en el siguiente ciclo. El registro de reclamos con multipart y la llamada interna al servicio de evaluación es el flujo más costoso computacionalmente y el más sensible a degradación bajo carga. | Alta | QA |
| R-11 | **Establecer un baseline de rendimiento** con los valores actuales (p95 ≈ 15ms con 10 VUs) como referencia para detectar regresiones de rendimiento en futuras versiones del sistema. | Media | QA |

---

## 9. Evidencia de Ejecución

### Ejecución final validada (2026-04-04)

```
scenarios: (100.00%) 1 scenario, 10 max VUs, 2m20s max duration
           Up to 10 looping VUs for 1m50s over 3 stages

THRESHOLDS
  http_req_duration     ✓ p(95)<500  →  p(95)=14.95ms
  {hu:HU-002}           ✓ p(95)<500  →  p(95)=15.57ms
  {hu:HU-004}           ✓ p(95)<500  →  p(95)=13.94ms
  {hu:HU-006}           ✓ p(95)<500  →  p(95)=15.53ms
  {hu:HU-013}           ✓ p(95)<500  →  p(95)=14.26ms
  http_req_failed       ✓ rate<0.05  →  rate=0.00%

TOTAL RESULTS
  checks_total.......: 7704   (100.00%)
  checks_succeeded...: 7704   (100.00%)
  checks_failed.......: 0      (0.00%)

  http_req_duration.... avg=8.97ms  min=1.54ms  med=8.36ms
                        p(90)=12.30ms  p(95)=14.95ms  max=125.92ms
  http_req_failed...... 0.00%  (0 out of 2102)
  http_reqs............ 2102   (19.02 req/s)

  iteration_duration... avg=5.01s  min=4.98s  max=5.09s
  iterations........... 175   (1.58/s)
  vus_max.............. 10

  data_received........ 1.2 MB  (11 kB/s)
  data_sent............ 652 kB  (5.9 kB/s)

default ✓ [ 100% ] 00/10 VUs  1m50s
```

---

*Redactado por: Jean Pierre Villacis — QA Engineer*  
*Herramienta: k6 v1.7.0 · Entorno: Docker local · Fecha: 2026-04-04*
