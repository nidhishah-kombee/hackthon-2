import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // warm up
    { duration: '1m', target: 100 },  // ramp to 100 users
    { duration: '1m', target: 200 },  // spike to 200 users
    { duration: '30s', target: 200 },  // hold spike
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = 'http://host.docker.internal:8000';

const INERTIA_HEADERS = {
  'X-Inertia': 'true',
  'X-Inertia-Version': '1',
  'Accept': 'application/json, text/plain, */*',
};

export default function () {
  group('Homepage', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, { 'homepage 200': (r) => r.status === 200 });
    sleep(0.5);
  });

  group('Anomaly - Random Latency', () => {
    const res = http.get(`${BASE_URL}/api/anomaly`);
    check(res, { 'anomaly ok': (r) => r.status === 200 || r.status === 500 });
    sleep(0.2);
  });

  group('Anomaly - Slow Endpoint', () => {
    const res = http.get(`${BASE_URL}/api/anomaly/slow?ms=300`);
    check(res, { 'slow ok': (r) => r.status === 200 });
    sleep(0.2);
  });

  group('Anomaly - N+1 Query', () => {
    const res = http.get(`${BASE_URL}/api/anomaly/n-plus-one`);
    check(res, { 'n+1 ok': (r) => r.status === 200 });
    sleep(0.3);
  });

  group('Anomaly - Error Injection', () => {
    const res = http.get(`${BASE_URL}/api/anomaly/errors?rate=40`);
    check(res, { 'error endpoint reached': (r) => r.status === 200 || r.status === 500 });
    sleep(0.2);
  });

  group('Products Page (Inertia)', () => {
    const res = http.get(`${BASE_URL}/products`, { headers: INERTIA_HEADERS });
    check(res, { 'products reachable': (r) => r.status === 200 || r.status === 302 });
    sleep(0.5);
  });

  group('Categories Page (Inertia)', () => {
    const res = http.get(`${BASE_URL}/categories`, { headers: INERTIA_HEADERS });
    check(res, { 'categories reachable': (r) => r.status === 200 || r.status === 302 });
    sleep(0.5);
  });

  group('Orders Page (Inertia)', () => {
    const res = http.get(`${BASE_URL}/orders`, { headers: INERTIA_HEADERS });
    check(res, { 'orders reachable': (r) => r.status === 200 || r.status === 302 });
    sleep(0.5);
  });

  sleep(Math.random() * 1.5);
}
