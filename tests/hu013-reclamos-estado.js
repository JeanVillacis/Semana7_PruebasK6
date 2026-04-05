import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { options as loadOptions } from '../config/options.js';
import { login, authParams, BASE_URL } from '../utils/api-helpers.js';

export const options = {
  ...loadOptions,
  thresholds: {
    ...loadOptions.thresholds,
    'http_req_duration{endpoint:GET_reclamo_estado}': ['p(95)<500'],
  },
};

export function setup() {
  const token = login(
    __ENV.ASEGURADO_USERNAME || 'asegurado01',
    __ENV.ASEGURADO_PASSWORD || 'aseg123'
  );
  return { token };
}

export default function (data) {
  const params    = authParams(data.token);
  const params404 = { ...params, responseCallback: http.expectedStatuses(200, 201, 404) };

  group('CP001 – GET /reclamos/REC-2026-005/estado (APROBADO)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/reclamos/REC-2026-005/estado`,
      { ...params, tags: { endpoint: 'GET_reclamo_estado' } }
    );
    check(res, {
      'status 200':                    (r) => r.status === 200,
      'estado APROBADO':               (r) => r.json('estado') === 'APROBADO',
      'montoAprobado presente':        (r) => r.json('montoAprobado') !== undefined,
      'deducibleCalculado presente':   (r) => r.json('deducibleCalculado') !== undefined,
    });
  });

  sleep(0.5);

  group('CP003 – GET /reclamos/REC-2026-008/estado (DESCARTADO)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/reclamos/REC-2026-008/estado`,
      { ...params, tags: { endpoint: 'GET_reclamo_estado' } }
    );
    check(res, {
      'status 200':              (r) => r.status === 200,
      'estado DESCARTADO':       (r) => r.json('estado') === 'DESCARTADO',
      'mensajeEstado presente':  (r) => r.json('mensajeEstado') !== undefined,
    });
  });

  sleep(0.5);

  group('CP004 – GET /reclamos/REC-0000-000/estado (no existe)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/reclamos/REC-0000-000/estado`,
      { ...params404, tags: { endpoint: 'GET_reclamo_estado' } }
    );
    check(res, {
      'status 404': (r) => r.status === 404,
    });
  });

  sleep(1);
}
