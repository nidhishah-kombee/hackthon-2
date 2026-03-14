import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 200 }, // Spike to 200 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
};

export default function () {
  const BASE_URL = 'http://host.docker.internal:8000';

  // 1. Visit Home Page
  const res1 = http.get(`${BASE_URL}/`);
  check(res1, { 'homepage status was 200': (r) => r.status === 200 });
  sleep(1);

  // 2. Visit Products API (assuming we can hit it directly, or simulate user)
  // For Inertia, endpoints return JSON if X-Inertia header is present
  const params = {
    headers: {
      'X-Inertia': 'true',
      'X-Inertia-Version': '1',
      'Accept': 'application/json, text/plain, */*',
    },
  };
  
  // To avoid auth redirect for simple tests or test an open endpoint
  // Let's create an anomaly endpoint
  const res3 = http.get(`${BASE_URL}/api/anomaly`);
  check(res3, { 'anomaly status was 200': (r) => r.status === 200 });

  sleep(Math.random() * 2);
}
