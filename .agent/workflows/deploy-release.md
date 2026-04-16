# Deployment Workflow

1. **Pre‑deploy checks**: All tests pass, migrations ready.
2. **Build**:
   - Frontend: `npm run build`
   - Backend: `docker build`
3. **Deploy**:
   - Run database migrations.
   - Rolling update of backend services.
   - Deploy frontend to Cloudflare Pages / Vercel.
4. **Verify**: Smoke test critical endpoints.
5. **Rollback plan**: Keep previous Docker image tagged.