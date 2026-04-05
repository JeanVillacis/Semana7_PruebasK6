import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { options as loadOptions } from '../config/options.js';
import { login, authParams, BASE_URL } from '../utils/api-helpers.js';

export const options = {
  ...loadOptions,
  thresholds: {
    ...loadOptions.thresholds,
    'http_req_duration{endpoint:GET_polizas}':   ['p(95)<500'],
    'http_req_duration{endpoint:GET_poliza_id}': ['p(95)<500'],
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

  group('CP001 – GET /polizas (lista)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/polizas`,
      { ...params, tags: { endpoint: 'GET_polizas' } }
    );
    check(res, {
      'status 200':                    (r) => r.status === 200,
      'respuesta es array':            (r) => Array.isArray(r.json()),
      'contiene al menos 2 polizas':   (r) => r.json().length >= 2,
      'campo numero presente':         (r) => r.json()[0].numero !== undefined,
      'campo estado presente':         (r) => r.json()[0].estado !== undefined,
      'campo vigenciaInicio presente': (r) => r.json()[0].vigenciaInicio !== undefined,
      'campo vigenciaFin presente':    (r) => r.json()[0].vigenciaFin !== undefined,
    });
  });

  sleep(0.5);

  group('CP002 – GET /polizas/1 (detalle existente)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/polizas/1`,
      { ...params, tags: { endpoint: 'GET_poliza_id' } }
    );
    check(res, {
      'status 200':              (r) => r.status === 200,
      'numero correcto':         (r) => r.json('numero') === 'POL-2026-001',
      'estado ACTIVA':           (r) => r.json('estado') === 'ACTIVA',
      'valorAsegurado presente': (r) => r.json('valorAsegurado') !== undefined,
      'vigenciaInicio presente': (r) => r.json('vigenciaInicio') !== undefined,
      'vigenciaFin presente':    (r) => r.json('vigenciaFin') !== undefined,
    });
  });

  sleep(0.5);

  group('CP003 – GET /polizas/9999 (no existe)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/polizas/9999`,
      { ...params404, tags: { endpoint: 'GET_poliza_id' } }
    );
    check(res, {
      'status 404': (r) => r.status === 404,
    });
  });

  sleep(1);
}
