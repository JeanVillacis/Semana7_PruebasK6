import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export function login(username, password) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'login: status 200':    (r) => r.status === 200,
    'login: token presente': (r) => r.json('token') !== undefined,
  });

  if (res.status !== 200) {
    throw new Error(`Login fallido (${res.status}): ${res.body}`);
  }

  return res.json('token');
}

export function authParams(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}
