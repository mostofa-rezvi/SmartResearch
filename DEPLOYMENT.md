# Deployment Guide — SmartResearch

## Kubernetes Setup

### Base Manifests
Deploy the core services using the provided manifests:
```bash
kubectl apply -f k8s/base/deployment.yaml
kubectl apply -f k8s/base/service.yaml
```

### Production Hardening
Apply HPA for the ML service:
```bash
kubectl apply -f k8s/overlays/prod/hpa.yaml
```

## Cloudflare Configuration
1. Set up your Zone ID in `scripts/setup-cloudflare.sh`.
2. Ensure `CLOUDFLARE_API_TOKEN` is in your environment.
3. Run the script:
```bash
chmod +x scripts/setup-cloudflare.sh
./scripts/setup-cloudflare.sh
```

## Load Testing
Benchmark the system using k6:
```bash
k6 run tests/load/benchmark.js
```
**Targets:** 10,000 concurrent VUs with < 200ms P95 latency.

## Monitoring
- **Prometheus:** Alerting rules in `monitoring/prometheus/rules.yaml`.
- **Grafana:** Dashboard JSON in `monitoring/grafana/dashboards/overview.json`.
