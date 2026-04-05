import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { options as loadOptions } from '../config/options.js';
import { login, authParams, BASE_URL } from '../utils/api-helpers.js';

export const options = {
  ...loadOptions,
  thresholds: {
    ...loadOptions.thresholds,
    'http_req_duration{endpoint:GET_vehiculos}':   ['p(95)<500'],
    'http_req_duration{endpoint:GET_vehiculo_id}': ['p(95)<500'],
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

  group('CP001 – GET /vehiculos (lista)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/vehiculos`,
      { ...params, tags: { endpoint: 'GET_vehiculos' } }
    );
    check(res, {
      'status 200':                     (r) => r.status === 200,
      'respuesta es array':             (r) => Array.isArray(r.json()),
      'contiene al menos 2 vehiculos':  (r) => r.json().length >= 2,
      'campo marca presente':           (r) => r.json()[0].marca !== undefined,
      'campo modelo presente':          (r) => r.json()[0].modelo !== undefined,
      'campo placa presente':           (r) => r.json()[0].placa !== undefined,
      'campo anio presente':            (r) => r.json()[0].anio !== undefined,
    });
  });

  sleep(0.5);

  group('CP002 – GET /vehiculos/1 (detalle existente)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/vehiculos/1`,
      { ...params, tags: { endpoint: 'GET_vehiculo_id' } }
    );
    check(res, {
      'status 200':     (r) => r.status === 200,
      'marca correcta': (r) => r.json('marca') === 'Chevrolet',
      'modelo correcto':(r) => r.json('modelo') === 'Aveo',
      'placa correcta': (r) => r.json('placa') === 'PBA-1234',
      'anio correcto':  (r) => r.json('anio') === 2022,
    });
  });

  sleep(0.5);

  group('CP003 – GET /vehiculos/9999 (no existe)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/vehiculos/9999`,
      { ...params404, tags: { endpoint: 'GET_vehiculo_id' } }
    );
    check(res, {
      'status 404': (r) => r.status === 404,
    });
  });

  sleep(1);
}
