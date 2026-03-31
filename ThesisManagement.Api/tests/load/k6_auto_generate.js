import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    auto_generate_spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '60s', target: 20 },
        { duration: '30s', target: 0 }
      ],
      gracefulRampDown: '10s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.03']
  }
};

const baseUrl = __ENV.BASE_URL || 'https://localhost:7188';
const token = __ENV.BEARER_TOKEN || '';
const periodId = __ENV.PERIOD_ID || '1';

function buildHeaders(idempotencyKey) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey
  };
}

export default function () {
  const body = JSON.stringify({
    selectedRooms: ['A101', 'A102'],
    tags: [],
    strategy: {
      heuristicWeights: {
        tag: 0.4,
        workload: 0.2,
        availability: 0.3,
        experience: 0.1
      }
    }
  });

  const idempotencyKey = `k6-${__VU}-${__ITER}`;
  const res = http.post(
    `${baseUrl}/api/v1/defense-periods/${periodId}/auto-generate/simulate`,
    body,
    { headers: buildHeaders(idempotencyKey), timeout: '120s' }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has trace id header': (r) => !!r.headers['X-Trace-Id']
  });

  sleep(0.3);
}
