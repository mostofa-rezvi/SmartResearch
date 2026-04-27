# Production Deployment Checklist — SmartResearch

## 1. Pre-Deployment (Verification)
- [ ] **Secrets Audit**: All API keys (OpenAI, Cloudflare, DB) stored in K8s Secrets/Vault.
- [ ] **DB Migrations**: Test migrations on staging; verify rollback script.
- [ ] **E2E Success**: Playwright `auth.spec.ts` and `discovery.spec.ts` pass 100%.
- [ ] **Load Test**: `benchmark.js` passes with < 1% error rate at 10k VUs.

## 2. Deployment (Execution)
- [ ] **Canary/Blue-Green**: Deploy `ml-service` first; verify HPA scaling.
- [ ] **Traffic Shift**: Gradual shift via Cloudflare Load Balancer (if applicable).
- [ ] **Logs Monitor**: Tail `kubectl logs` for `backend` and `ml-service` during shift.

## 3. Post-Deployment (Validation)
- [ ] **Smoke Tests**: Manual verification of Login -> Search -> Graph view.
- [ ] **Metrics Check**: Prometheus/Grafana show stable latency and 0% errors.
- [ ] **Cloudflare WAF**: Verify traffic is being routed and filtered correctly.

## 4. Rollback Plan
- [ ] **Git Revert**: Command: `git revert HEAD && git push`.
- [ ] **K8s Rollout**: Command: `kubectl rollout undo deployment/backend`.
