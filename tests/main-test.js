import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { login, authParams, BASE_URL } from '../utils/api-helpers.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 10 },
    { duration: '20s', target: 0  },
  ],
  thresholds: {
    http_req_duration:               ['p(95)<500'],
    http_req_failed:                 ['rate<0.05'],
    'http_req_duration{hu:HU-002}':  ['p(95)<500'],
    'http_req_duration{hu:HU-004}':  ['p(95)<500'],
    'http_req_duration{hu:HU-006}':  ['p(95)<500'],
    'http_req_duration{hu:HU-013}':  ['p(95)<500'],
  },
};

export function setup() {
  const gestorToken = login(
    __ENV.GESTOR_USERNAME    || 'gestor01',
    __ENV.GESTOR_PASSWORD    || 'gestor123'
  );
  const aseguradoToken = login(
    __ENV.ASEGURADO_USERNAME || 'asegurado01',
    __ENV.ASEGURADO_PASSWORD || 'aseg123'
  );
  return { gestorToken, aseguradoToken };
}

export default function (data) {
  const gestorParams    = authParams(data.gestorToken);
  const aseguradoParams = authParams(data.aseguradoToken);
  const gestor404Params    = { ...gestorParams,    responseCallback: http.expectedStatuses(200, 201, 404) };
  const asegurado404Params = { ...aseguradoParams, responseCallback: http.expectedStatuses(200, 201, 404) };

  group('HU-002 – Consultar Asegurados', () => {
    group('CP001 – GET /asegurados (lista)', () => {
      const res = http.get(`${BASE_URL}/api/v1/asegurados`, { ...gestorParams, tags: { hu: 'HU-002' } });
      check(res, {
        '[HU-002] status 200':                  (r) => r.status === 200,
        '[HU-002] respuesta es array':           (r) => Array.isArray(r.json()),
        '[HU-002] contiene >= 2 asegurados':     (r) => r.json().length >= 2,
        '[HU-002] campo nombre presente':        (r) => r.json()[0].nombre !== undefined,
        '[HU-002] campo apellido presente':      (r) => r.json()[0].apellido !== undefined,
        '[HU-002] campo numeroIdentificacion':   (r) => r.json()[0].numeroIdentificacion !== undefined,
      });
    });

    sleep(0.3);

    group('CP002 – GET /asegurados/1 (detalle existente)', () => {
      const res = http.get(`${BASE_URL}/api/v1/asegurados/1`, { ...gestorParams, tags: { hu: 'HU-002' } });
      check(res, {
        '[HU-002] status 200':        (r) => r.status === 200,
        '[HU-002] nombre: Juan':      (r) => r.json('nombre') === 'Juan',
        '[HU-002] apellido: Perez':   (r) => r.json('apellido') === 'Perez',
        '[HU-002] identificacion ok': (r) => r.json('numeroIdentificacion') !== undefined,
      });
    });

    sleep(0.3);

    group('CP003 – GET /asegurados/9999 (no existe)', () => {
      const res = http.get(`${BASE_URL}/api/v1/asegurados/9999`, { ...gestor404Params, tags: { hu: 'HU-002' } });
      check(res, { '[HU-002] status 404': (r) => r.status === 404 });
    });
  });

  sleep(0.5);

  group('HU-004 – Consultar Vehículos', () => {
    group('CP001 – GET /vehiculos (lista)', () => {
      const res = http.get(`${BASE_URL}/api/v1/vehiculos`, { ...gestorParams, tags: { hu: 'HU-004' } });
      check(res, {
        '[HU-004] status 200':               (r) => r.status === 200,
        '[HU-004] respuesta es array':       (r) => Array.isArray(r.json()),
        '[HU-004] contiene >= 2 vehiculos':  (r) => r.json().length >= 2,
        '[HU-004] campo marca presente':     (r) => r.json()[0].marca !== undefined,
        '[HU-004] campo modelo presente':    (r) => r.json()[0].modelo !== undefined,
        '[HU-004] campo placa presente':     (r) => r.json()[0].placa !== undefined,
        '[HU-004] campo anio presente':      (r) => r.json()[0].anio !== undefined,
      });
    });

    sleep(0.3);

    group('CP002 – GET /vehiculos/1 (detalle existente)', () => {
      const res = http.get(`${BASE_URL}/api/v1/vehiculos/1`, { ...gestorParams, tags: { hu: 'HU-004' } });
      check(res, {
        '[HU-004] status 200':       (r) => r.status === 200,
        '[HU-004] marca: Chevrolet': (r) => r.json('marca') === 'Chevrolet',
        '[HU-004] modelo: Aveo':     (r) => r.json('modelo') === 'Aveo',
        '[HU-004] placa: PBA-1234':  (r) => r.json('placa') === 'PBA-1234',
        '[HU-004] anio: 2022':       (r) => r.json('anio') === 2022,
      });
    });

    sleep(0.3);

    group('CP003 – GET /vehiculos/9999 (no existe)', () => {
      const res = http.get(`${BASE_URL}/api/v1/vehiculos/9999`, { ...gestor404Params, tags: { hu: 'HU-004' } });
      check(res, { '[HU-004] status 404': (r) => r.status === 404 });
    });
  });

  sleep(0.5);

  group('HU-006 – Consultar Pólizas', () => {
    group('CP001 – GET /polizas (lista)', () => {
      const res = http.get(`${BASE_URL}/api/v1/polizas`, { ...gestorParams, tags: { hu: 'HU-006' } });
      check(res, {
        '[HU-006] status 200':               (r) => r.status === 200,
        '[HU-006] respuesta es array':       (r) => Array.isArray(r.json()),
        '[HU-006] contiene >= 2 polizas':    (r) => r.json().length >= 2,
        '[HU-006] campo numero presente':    (r) => r.json()[0].numero !== undefined,
        '[HU-006] campo estado presente':    (r) => r.json()[0].estado !== undefined,
        '[HU-006] vigenciaInicio presente':  (r) => r.json()[0].vigenciaInicio !== undefined,
        '[HU-006] vigenciaFin presente':     (r) => r.json()[0].vigenciaFin !== undefined,
      });
    });

    sleep(0.3);

    group('CP002 – GET /polizas/1 (detalle existente)', () => {
      const res = http.get(`${BASE_URL}/api/v1/polizas/1`, { ...gestorParams, tags: { hu: 'HU-006' } });
      check(res, {
        '[HU-006] status 200':              (r) => r.status === 200,
        '[HU-006] numero: POL-2026-001':    (r) => r.json('numero') === 'POL-2026-001',
        '[HU-006] estado: ACTIVA':          (r) => r.json('estado') === 'ACTIVA',
        '[HU-006] valorAsegurado presente': (r) => r.json('valorAsegurado') !== undefined,
      });
    });

    sleep(0.3);

    group('CP003 – GET /polizas/9999 (no existe)', () => {
      const res = http.get(`${BASE_URL}/api/v1/polizas/9999`, { ...gestor404Params, tags: { hu: 'HU-006' } });
      check(res, { '[HU-006] status 404': (r) => r.status === 404 });
    });
  });

  sleep(0.5);

  group('HU-013 – Consulta estado de reclamo', () => {
    group('CP001 – GET /reclamos/REC-2026-005/estado (APROBADO)', () => {
      const res = http.get(`${BASE_URL}/api/v1/reclamos/REC-2026-005/estado`, { ...aseguradoParams, tags: { hu: 'HU-013' } });
      check(res, {
        '[HU-013] status 200':                  (r) => r.status === 200,
        '[HU-013] estado: APROBADO':            (r) => r.json('estado') === 'APROBADO',
        '[HU-013] montoAprobado presente':      (r) => r.json('montoAprobado') !== undefined,
        '[HU-013] deducibleCalculado presente': (r) => r.json('deducibleCalculado') !== undefined,
      });
    });

    sleep(0.3);

    group('CP003 – GET /reclamos/REC-2026-008/estado (DESCARTADO)', () => {
      const res = http.get(`${BASE_URL}/api/v1/reclamos/REC-2026-008/estado`, { ...aseguradoParams, tags: { hu: 'HU-013' } });
      check(res, {
        '[HU-013] status 200':             (r) => r.status === 200,
        '[HU-013] estado: DESCARTADO':     (r) => r.json('estado') === 'DESCARTADO',
        '[HU-013] mensajeEstado presente': (r) => r.json('mensajeEstado') !== undefined,
      });
    });

    sleep(0.3);

    group('CP004 – GET /reclamos/REC-0000-000/estado (no existe)', () => {
      const res = http.get(`${BASE_URL}/api/v1/reclamos/REC-0000-000/estado`, { ...asegurado404Params, tags: { hu: 'HU-013' } });
      check(res, { '[HU-013] status 404': (r) => r.status === 404 });
    });
  });

  sleep(1);
}
