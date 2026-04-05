import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { options as loadOptions } from '../config/options.js';
import { login, authParams, BASE_URL } from '../utils/api-helpers.js';

export const options = {
  ...loadOptions,
  thresholds: {
    ...loadOptions.thresholds,
    'http_req_duration{endpoint:GET_asegurados}':   ['p(95)<500'],
    'http_req_duration{endpoint:GET_asegurado_id}': ['p(95)<500'],
  },
};

export function setup() {
  const token = login(
    __ENV.GESTOR_USERNAME || 'gestor01',
    __ENV.GESTOR_PASSWORD || 'gestor123'
  );
  return { token };
}

export default function (data) {
  const params    = authParams(data.token);
  const params404 = { ...params, responseCallback: http.expectedStatuses(200, 201, 404) };

  group('CP001 – GET /asegurados (lista)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/asegurados`,
      { ...params, tags: { endpoint: 'GET_asegurados' } }
    );
    check(res, {
      'status 200':                        (r) => r.status === 200,
      'respuesta es array':                (r) => Array.isArray(r.json()),
      'contiene al menos 2 asegurados':    (r) => r.json().length >= 2,
      'campo nombre presente':             (r) => r.json()[0].nombre !== undefined,
      'campo apellido presente':           (r) => r.json()[0].apellido !== undefined,
      'campo numeroIdentificacion presente':(r) => r.json()[0].numeroIdentificacion !== undefined,
    });
  });

  sleep(0.5);

  group('CP002 – GET /asegurados/1 (detalle existente)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/asegurados/1`,
      { ...params, tags: { endpoint: 'GET_asegurado_id' } }
    );
    check(res, {
      'status 200':            (r) => r.status === 200,
      'nombre correcto':       (r) => r.json('nombre') === 'Juan',
      'apellido correcto':     (r) => r.json('apellido') === 'Perez',
      'identificacion presente':(r) => r.json('numeroIdentificacion') !== undefined,
    });
  });

  sleep(0.5);

  group('CP003 – GET /asegurados/9999 (no existe)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/asegurados/9999`,
      { ...params404, tags: { endpoint: 'GET_asegurado_id' } }
    );
    check(res, {
      'status 404': (r) => r.status === 404,
    });
  });

  sleep(1);
}
