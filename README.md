# Pruebas de Rendimiento – K6
## Automatizador de Siniestros · InsurTech MVP v1.0

Repositorio de scripts de carga y rendimiento desarrollados con [k6](https://k6.io/) para el sistema de evaluación automatizada de siniestros de autos.

---

## Tabla de Contenidos

1. [Prerrequisitos](#1-prerrequisitos)
2. [Estructura del repositorio](#2-estructura-del-repositorio)
3. [Configuración inicial](#3-configuración-inicial)
4. [Preparar el entorno de pruebas](#4-preparar-el-entorno-de-pruebas)
5. [Ejecutar los tests](#5-ejecutar-los-tests)
6. [Qué valida cada script](#6-qué-valida-cada-script)
7. [Umbrales y criterios de aprobación](#7-umbrales-y-criterios-de-aprobación)
8. [Generar reportes](#8-generar-reportes)
9. [Datos de prueba](#9-datos-de-prueba)
10. [Variables de entorno](#10-variables-de-entorno)
11. [Solución de problemas frecuentes](#11-solución-de-problemas-frecuentes)

---

## 1. Prerrequisitos

| Herramienta | Versión mínima | Instalación |
|-------------|:--------------:|-------------|
| **k6** | v1.0.0+ | `brew install k6` (macOS) · [k6.io/docs/getting-started/installation](https://k6.io/docs/getting-started/installation/) |
| **Docker Desktop** | 4.x | Necesario para levantar la aplicación bajo prueba |
| **docker-compose** | 2.x | Incluido en Docker Desktop |
| **bash** | 3.x+ | Incluido en macOS/Linux |

Verificar instalación:
```bash
k6 version
docker --version
docker compose version
```

---

## 2. Estructura del repositorio

```
K6/
├── .env                        # Credenciales y URL (NO subir al repo)
├── .env.example                # Plantilla de variables sin valores
├── .gitignore                  # Excluye .env y reports/
├── run.sh                      # Script de ejecución (carga .env automáticamente)
│
├── config/
│   └── options.js              # Opciones de carga compartidas (VUs, stages, thresholds)
│
├── utils/
│   └── api-helpers.js          # login(), authParams(), BASE_URL
│
├── tests/
│   ├── main-test.js            # Suite completa — todas las HUs en un solo run
│   ├── hu002-asegurados.js     # HU-002: GET /asegurados
│   ├── hu004-vehiculos.js      # HU-004: GET /vehiculos
│   ├── hu006-polizas.js        # HU-006: GET /polizas
│   └── hu013-reclamos-estado.js # HU-013: GET /reclamos/{num}/estado
│
├── data/
│   └── seed.sql                # Script SQL para poblar la BD antes de los tests
│
├── reports/                    # Reportes generados (excluidos del repo)
│
├── TEST_PLAN.md                # Plan de pruebas del ciclo
├── TEST_CASES.md               # Matriz de casos de prueba
└── Informe.md                  # Informe de ejecución del ciclo actual
```

---

## 3. Configuración inicial

### 3.1 Clonar/obtener el repositorio

```bash
cd /ruta/donde/quieras/trabajar
# si usas git:
git clone <url-del-repo> K6
cd K6
```

### 3.2 Configurar variables de entorno

Copia la plantilla y completa los valores:

```bash
cp .env.example .env
```

Edita `.env` con los valores correctos para tu entorno:

```env
BASE_URL=http://localhost:8080

GESTOR_USERNAME=
GESTOR_PASSWORD=

ASEGURADO_USERNAME=
ASEGURADO_PASSWORD=
```

> **Importante:** el archivo `.env` está en `.gitignore`. Nunca lo subas al repositorio.

### 3.3 Dar permisos de ejecución al script

```bash
chmod +x run.sh
```

---

## 4. Preparar el entorno de pruebas

Los tests requieren que la aplicación esté corriendo y la base de datos tenga datos semilla. Sigue estos pasos en orden.

### Paso 1 — Levantar la aplicación

Desde el directorio del proyecto Spring Boot:

```bash
cd /ruta/al/proyecto/Taller_Semana7
docker compose up -d
```

Esperar a que todos los contenedores estén `healthy`:

```bash
docker ps
```

Deberías ver estos contenedores activos:

| Contenedor | Puerto | Estado esperado |
|------------|--------|-----------------|
| `ms-apigateway` | 8080 | Up (healthy) |
| `ms-authservice` | 8081 | Up |
| `ms-coreservice` | 8082 | Up |
| `ms-evaluacion` | 8083 | Up |
| `postgres-seguros` | 5433 | Up (healthy) |

### Paso 2 — Verificar que la API responde

```bash
curl -s http://localhost:8080/api/v1/asegurados | head -c 100
# Esperado: [] o una lista JSON (puede ser vacío si la BD no tiene datos)
```

### Paso 3 — Cargar los datos semilla

Este paso es **obligatorio**. Sin datos en la BD, todos los GET devolverán 404 y los tests fallarán.

```bash
docker exec -i postgres-seguros psql -U postgres -d seguros_db \
  < data/seed.sql
```

Salida esperada:

```
TRUNCATE TABLE
INSERT 0 2   ← asegurados
INSERT 0 2   ← vehiculos
INSERT 0 2   ← polizas
INSERT 0 2   ← reclamos
 setval      ← ajuste de secuencias (x4)
```

Verificar que los datos quedaron cargados:

```bash
docker exec postgres-seguros psql -U postgres -d seguros_db \
  -c "SELECT 'asegurados' t, count(*) FROM asegurados
      UNION ALL SELECT 'vehiculos', count(*) FROM vehiculos
      UNION ALL SELECT 'polizas', count(*) FROM polizas
      UNION ALL SELECT 'reclamos', count(*) FROM reclamos;"
```

Resultado esperado: **2 filas por tabla**.

### Paso 4 — Registrar el usuario asegurado

> Solo necesario la **primera vez** o si se ejecutó un TRUNCATE en la BD de auth.

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"<ASEGURADO_USERNAME>","password":"<ASEGURADO_PASSWORD>","rol":"ASEGURADO","aseguradoId":1}'
```

Respuesta esperada:
```json
{"message": "Usuario 'asegurado01' registrado correctamente"}
```

> El usuario `gestor01` ya está cargado por el inicializador de la aplicación (`DataInitializer.java`). Solo el asegurado necesita registro manual hasta que se actualice el `seed.sql`.

### Paso 5 — Smoke test rápido

Antes de lanzar la carga completa, valida que el login funciona:

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<GESTOR_USERNAME>","password":"<GESTOR_PASSWORD>"}' | python3 -m json.tool
```

Debe retornar un JSON con el campo `token`. Si ves `401`, los datos de usuario no están correctos.

---

## 5. Ejecutar los tests

Todos los comandos se ejecutan desde la raíz del repositorio K6 usando `run.sh`, que carga el `.env` automáticamente.

### Suite completa (recomendado)

Ejecuta todas las HUs en un solo run:

```bash
./run.sh
# equivalente a: ./run.sh main
```

### Por Historia de Usuario individual

```bash
./run.sh hu002    # HU-002: Consultar Asegurados
./run.sh hu004    # HU-004: Consultar Vehículos
./run.sh hu006    # HU-006: Consultar Pólizas
./run.sh hu013    # HU-013: Estado de reclamo
```

### Con reporte JSON

```bash
mkdir -p reports
./run.sh main --out json=reports/result.json
```

### Ejecutar directamente con k6 (sin run.sh)

Si prefieres pasar las variables manualmente:

```bash
k6 run \
  -e BASE_URL=http://localhost:8080 \
  -e GESTOR_USERNAME=<valor> \
  -e GESTOR_PASSWORD=<valor> \
  -e ASEGURADO_USERNAME=<valor> \
  -e ASEGURADO_PASSWORD=<valor> \
  tests/main-test.js
```

---

## 6. Qué valida cada script

### `tests/main-test.js` — Suite completa

Ejecuta las 4 HUs de forma secuencial en cada iteración de VU. Un VU realiza 12 requests por iteración con pauses de ~1.9 s.

### `tests/hu002-asegurados.js` — HU-002

| Caso | Endpoint | Validaciones |
|------|----------|-------------|
| CP001 | `GET /api/v1/asegurados` | status 200, array, ≥2 registros, campos nombre/apellido/numeroIdentificacion |
| CP002 | `GET /api/v1/asegurados/1` | status 200, nombre=Juan, apellido=Perez |
| CP003 | `GET /api/v1/asegurados/9999` | status 404 |

### `tests/hu004-vehiculos.js` — HU-004

| Caso | Endpoint | Validaciones |
|------|----------|-------------|
| CP001 | `GET /api/v1/vehiculos` | status 200, array, ≥2 registros, campos marca/modelo/placa/anio |
| CP002 | `GET /api/v1/vehiculos/1` | status 200, marca=Chevrolet, modelo=Aveo, placa=PBA-1234, anio=2022 |
| CP003 | `GET /api/v1/vehiculos/9999` | status 404 |

### `tests/hu006-polizas.js` — HU-006

| Caso | Endpoint | Validaciones |
|------|----------|-------------|
| CP001 | `GET /api/v1/polizas` | status 200, array, ≥2 registros, campos numero/estado/vigenciaInicio/vigenciaFin |
| CP002 | `GET /api/v1/polizas/1` | status 200, numero=POL-2026-001, estado=ACTIVA, valorAsegurado presente |
| CP003 | `GET /api/v1/polizas/9999` | status 404 |

### `tests/hu013-reclamos-estado.js` — HU-013

| Caso | Endpoint | Validaciones |
|------|----------|-------------|
| CP001 | `GET /api/v1/reclamos/REC-2026-005/estado` | status 200, estado=APROBADO, montoAprobado y deducibleCalculado presentes |
| CP003 | `GET /api/v1/reclamos/REC-2026-008/estado` | status 200, estado=DESCARTADO, mensajeEstado presente |
| CP004 | `GET /api/v1/reclamos/REC-0000-000/estado` | status 404 |

> **Nota de autenticación:** HU-002, HU-004 y HU-006 usan token de rol `GESTOR`. HU-013 usa token de rol `ASEGURADO`.

---

## 7. Umbrales y criterios de aprobación

Un run pasa si **todos** los thresholds se cumplen:

| Threshold | Criterio | Descripción |
|-----------|:--------:|-------------|
| `http_req_duration p(95)` | < 500 ms | El 95% de los requests debe responder en menos de 500ms |
| `http_req_duration{hu:HU-002} p(95)` | < 500 ms | Idem, segmentado por HU |
| `http_req_duration{hu:HU-004} p(95)` | < 500 ms | Idem |
| `http_req_duration{hu:HU-006} p(95)` | < 500 ms | Idem |
| `http_req_duration{hu:HU-013} p(95)` | < 500 ms | Idem |
| `http_req_failed` | < 5% | Menos del 5% de requests con error |

> Los casos CP003/CP004 que esperan un `404` usan `responseCallback: http.expectedStatuses(200, 404)` y no cuentan como fallos en `http_req_failed`.

**Resultado de referencia (baseline — 2026-04-04, 10 VUs, entorno local):**

| Métrica | Valor |
|---------|-------|
| p(95) global | 14.95 ms |
| p(95) HU-002 | 15.57 ms |
| p(95) HU-004 | 13.94 ms |
| p(95) HU-006 | 15.53 ms |
| p(95) HU-013 | 14.26 ms |
| http_req_failed | 0.00 % |
| Checks pasados | 7 704 / 7 704 (100 %) |

---

## 8. Generar reportes

### Reporte JSON (k6 nativo)

```bash
mkdir -p reports
./run.sh main --out json=reports/result.json
```

El archivo `reports/result.json` contiene todas las métricas en formato nativo de k6 y puede importarse en Grafana o procesarse con herramientas externas.

### Reporte de resumen en consola (por defecto)

K6 imprime automáticamente el resumen al finalizar. Para guardarlo:

```bash
./run.sh main 2>&1 | tee reports/summary.txt
```

### Ver el historial de ejecuciones

Consulta [Informe.md](Informe.md) para el análisis completo del ciclo actual con métricas, incidencias y recomendaciones.

---

## 9. Datos de prueba

Los tests dependen de los siguientes registros en la BD. Todos están incluidos en `data/seed.sql`.

### Asegurados

| id | numeroIdentificacion | nombre | apellido |
|----|---------------------|--------|---------|
| 1 | 1712345678 | Juan | Perez |
| 2 | 1798765432 | Maria | Lopez |

### Vehículos

| id | placa | marca | modelo | año |
|----|-------|-------|--------|-----|
| 1 | PBA-1234 | Chevrolet | Aveo | 2022 |
| 2 | PBC-5678 | Kia | Rio | 2023 |

### Pólizas

| id | numero | estado | asegurado | vehículo |
|----|--------|--------|-----------|---------|
| 1 | POL-2026-001 | ACTIVA | Juan Perez | PBA-1234 |
| 2 | POL-2026-010 | ACTIVA | Maria Lopez | PBC-5678 |

### Reclamos

| numeroSeguimiento | estado | monto estimado | deducible | monto aprobado |
|-------------------|--------|:--------------:|:---------:|:--------------:|
| REC-2026-005 | APROBADO | $3,500 | $350 | $3,150 |
| REC-2026-008 | DESCARTADO | $150 | $200 | $0 |

### Usuarios de autenticación

| username | rol | aseguradoId |
|----------|-----|:-----------:|
| ver `.env` | GESTOR | — |
| ver `.env` | ASEGURADO | 1 |

> `gestor01` es creado por el `DataInitializer.java` al arrancar la app.
> `asegurado01` debe registrarse manualmente (ver Paso 4 de la sección de preparación).

---

## 10. Variables de entorno

Todos los valores sensibles se gestionan mediante el archivo `.env`. El script `run.sh` lo carga automáticamente antes de invocar k6.

| Variable | Descripción |
|----------|-------------|
| `BASE_URL` | URL base del API Gateway |
| `GESTOR_USERNAME` | Usuario con rol GESTOR |
| `GESTOR_PASSWORD` | Contraseña del gestor |
| `ASEGURADO_USERNAME` | Usuario con rol ASEGURADO |
| `ASEGURADO_PASSWORD` | Contraseña del asegurado |

Para crear tu `.env`:

```bash
cp .env.example .env
# editar .env con los valores reales
```

> Si alguna variable no está definida en `.env`, los scripts usan el valor por defecto hardcodeado como fallback. En entornos CI/CD se recomienda exportar las variables en el pipeline y no depender del fallback.

---

## 11. Solución de problemas frecuentes

### `Login fallido (401): Credenciales inválidas`

El usuario no existe o la contraseña es incorrecta.

1. Verifica que el contenedor de la app esté corriendo: `docker ps`
2. Verifica que el `gestor01` existe: `docker exec postgres-seguros psql -U postgres -d seguros_db -c "SELECT username FROM auth_schema.usuarios;"`
3. Si no existe `asegurado01`, ejecuta el Paso 4 de la sección de preparación.
4. Verifica que `.env` tiene las credenciales correctas.

---

### `Error: connection refused` o `502 Bad Gateway`

La aplicación no está levantada o no está accesible en el puerto 8080.

```bash
docker ps                          # verificar que todos los contenedores están Up
docker compose logs ms-apigateway  # ver logs del gateway
curl http://localhost:8080/api/v1/asegurados  # probar conectividad
```

---

### Todos los checks fallan con `status 404` en listas

La base de datos no tiene datos. Ejecutar el Paso 3 (cargar seed):

```bash
docker exec -i postgres-seguros psql -U postgres -d seguros_db < data/seed.sql
```

---

### `http_req_failed rate` supera el 5%

Posibles causas:
- La BD no tiene datos (ver arriba).
- La app está bajo presión excesiva. Reducir los VUs en `config/options.js`.
- El token JWT expiró mid-test (expiración de 24h, no debería ocurrir en pruebas cortas).

---

### `Permission denied: ./run.sh`

```bash
chmod +x run.sh
```

---

## Documentación relacionada

| Documento | Descripción |
|-----------|-------------|
| [TEST_PLAN.md](TEST_PLAN.md) | Plan de pruebas completo del ciclo, estrategia y cronograma |
| [TEST_CASES.md](TEST_CASES.md) | Matriz de casos de prueba por HU con criterios de aceptación |
| [Informe.md](Informe.md) | Informe de ejecución del ciclo actual con métricas y recomendaciones |

---

*QA: Jean Pierre Villacis · Proyecto: InsurTech MVP v1.0 · k6 v1.7.0*
