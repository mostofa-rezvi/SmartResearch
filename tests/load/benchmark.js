import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 2000 }, // Ramp up to 2k
    { duration: '3m', target: 10000 }, // Scale to 10k concurrent users
    { duration: '1m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% failure rate
  },
};

export default function () {
  const url = 'https://api.smartresearch.ai/v1/discovery/search';
  const payload = JSON.stringify({
    query: 'advanced machine learning optimization',
    top_k: 5
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency is acceptable': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
