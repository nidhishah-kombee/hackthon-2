/**
 * Hackathon 2.0 — k6 Load Test
 * Covers: 5000+ requests, concurrent users, spike test, CRUD, anomaly injection
 * Run: docker run --rm --network hackthon-20_default -v "${PWD}/loadtest.js:/loadtest.js" grafana/k6 run /loadtest.js
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const loginSuccess = new Counter('login_success_total');
const loginFail = new Counter('login_fail_total');
const crudErrors = new Counter('crud_errors_total');
const anomalyLatency = new Trend('anomaly_latency_ms');
const errorRate = new Rate('error_rate');

export const options = {
  scenarios: {
    // Normal ramp-up load — PHP_CLI_SERVER_WORKERS=4 so keep VUs reasonable
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'normalLoad',
    },
    // Spike test — sudden burst proves latency spike in dashboard
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 0 },
        { duration: '10s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
      startTime: '2m',
      exec: 'spikeLoad',
    },
    // Anomaly injection — constant 3 VUs hitting anomaly endpoints
    anomaly: {
      executor: 'constant-vus',
      vus: 3,
      duration: '3m',
      exec: 'anomalyLoad',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<60000'],
    // Spike scenario intentionally overwhelms the 4-worker PHP server — allow high failure rate
    http_req_failed: ['rate<0.65'],
    login_success_total: ['count>5'],
    error_rate: ['rate<0.5'],
  },
};

const BASE_URL = 'http://app:8000';

const INERTIA_HEADERS = {
  'X-Inertia': 'true',
  'X-Inertia-Version': '1',
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
};

/**
 * Login using Laravel Sanctum CSRF cookie flow.
 * Returns the cookie jar (with session) on success, null on failure.
 * 409 = already authenticated — treated as success.
 */
function loginWithJar(email, password) {
  const jar = http.cookieJar();

  // 1. Fetch XSRF-TOKEN cookie
  http.get(`${BASE_URL}/sanctum/csrf-cookie`, { jar });

  // 2. Read token from jar
  const cookies = jar.cookiesForURL(`${BASE_URL}/`);
  const xsrfArr = cookies['XSRF-TOKEN'];
  const xsrf = xsrfArr && xsrfArr.length > 0 ? decodeURIComponent(xsrfArr[0]) : '';

  // 3. POST /login with X-XSRF-TOKEN header
  const res = http.post(
    `${BASE_URL}/login`,
    JSON.stringify({ email, password }),
    {
      jar,
      redirects: 5,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'X-Inertia': 'true',
        'X-XSRF-TOKEN': xsrf,
      },
    }
  );

  // 200/302/204 = login ok; 409 = already authenticated (also ok)
  const ok = res.status === 200 || res.status === 302 || res.status === 204 || res.status === 409;
  if (ok) { loginSuccess.add(1); return jar; }
  loginFail.add(1);
  return null;
}

// ── Scenario 1: Normal load ───────────────────────────────────────────────────
export function normalLoad() {
  let jar = null;

  group('Auth — Login', () => {
    jar = loginWithJar('admin@kombee.com', 'password');
    errorRate.add(jar === null ? 1 : 0);
    sleep(0.5);
  });

  if (!jar) {
    http.get(`${BASE_URL}/`);
    sleep(1);
    return;
  }

  const authParams = { jar, headers: INERTIA_HEADERS, redirects: 5 };

  group('Dashboard', () => {
    const res = http.get(`${BASE_URL}/dashboard`, authParams);
    check(res, { 'dashboard ok': (r) => r.status === 200 || r.status === 302 });
    errorRate.add(res.status >= 500 ? 1 : 0);
    sleep(0.3);
  });

  group('Categories — List', () => {
    const res = http.get(`${BASE_URL}/categories`, authParams);
    check(res, { 'categories ok': (r) => r.status === 200 || r.status === 302 });
    errorRate.add(res.status >= 500 ? 1 : 0);
    sleep(0.3);
  });

  group('Products — List', () => {
    const res = http.get(`${BASE_URL}/products`, authParams);
    check(res, { 'products ok': (r) => r.status === 200 || r.status === 302 });
    errorRate.add(res.status >= 500 ? 1 : 0);
    sleep(0.3);
  });

  group('Orders — List', () => {
    const res = http.get(`${BASE_URL}/orders`, authParams);
    check(res, { 'orders ok': (r) => r.status === 200 || r.status === 302 });
    errorRate.add(res.status >= 500 ? 1 : 0);
    sleep(0.3);
  });

  group('Homepage', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, { 'homepage 200': (r) => r.status === 200 });
    sleep(0.2);
  });

  sleep(Math.random() * 1.0 + 0.5);
}

// ── Scenario 2: Spike load ────────────────────────────────────────────────────
export function spikeLoad() {
  group('Spike — Homepage', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, { 'spike homepage': (r) => r.status === 200 });
    errorRate.add(res.status >= 500 ? 1 : 0);
  });

  group('Spike — Products', () => {
    const res = http.get(`${BASE_URL}/products`, { headers: INERTIA_HEADERS });
    check(res, { 'spike products': (r) => r.status === 200 || r.status === 302 });
    errorRate.add(res.status >= 500 ? 1 : 0);
  });

  group('Spike — Categories', () => {
    const res = http.get(`${BASE_URL}/categories`, { headers: INERTIA_HEADERS });
    check(res, { 'spike categories': (r) => r.status === 200 || r.status === 302 });
    errorRate.add(res.status >= 500 ? 1 : 0);
  });

  group('Spike — Orders', () => {
    const res = http.get(`${BASE_URL}/orders`, { headers: INERTIA_HEADERS });
    check(res, { 'spike orders': (r) => r.status === 200 || r.status === 302 });
    errorRate.add(res.status >= 500 ? 1 : 0);
  });

  group('Spike — Metrics', () => {
    const res = http.get(`${BASE_URL}/metrics`);
    check(res, { 'metrics ok': (r) => r.status === 200 });
  });

  sleep(0.1);
}

// ── Scenario 3: Anomaly injection ─────────────────────────────────────────────
export function anomalyLoad() {
  // Artificial delay — proves latency spike in dashboard
  group('Anomaly — Slow (500ms)', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/anomaly/slow?ms=500`);
    anomalyLatency.add(Date.now() - start);
    check(res, { 'slow ok': (r) => r.status === 200 });
    sleep(0.5);
  });

  // N+1 query — proves DB bottleneck in traces
  group('Anomaly — N+1 Query', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/anomaly/n-plus-one`);
    anomalyLatency.add(Date.now() - start);
    check(res, { 'n+1 ok': (r) => r.status === 200 });
    errorRate.add(res.status >= 500 ? 1 : 0);
    sleep(0.5);
  });

  // Random 500 errors — proves error spike in dashboard
  group('Anomaly — Error Injection (40% rate)', () => {
    const res = http.get(`${BASE_URL}/api/anomaly/errors?rate=40`);
    check(res, { 'error endpoint reached': (r) => r.status === 200 || r.status === 500 });
    errorRate.add(res.status >= 500 ? 1 : 0);
    crudErrors.add(res.status >= 500 ? 1 : 0);
    sleep(0.3);
  });

  // Random latency anomaly
  group('Anomaly — Random Latency', () => {
    const res = http.get(`${BASE_URL}/api/anomaly`);
    check(res, { 'random anomaly': (r) => r.status === 200 || r.status === 500 });
    errorRate.add(res.status >= 500 ? 1 : 0);
    sleep(0.3);
  });

  sleep(Math.random() * 0.5);
}
