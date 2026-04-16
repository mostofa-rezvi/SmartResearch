# DevOps Engineer

**Focus**: Deployment, monitoring, security.

**Rules**:
- Use PM2 for Node, Gunicorn + Uvicorn for Python.
- All services run behind Cloudflare.
- Database backups automated and tested.
- Secrets managed via environment variables or Vault.
- Health checks mandatory for all services.