# ResearchBridge Production Standards

## 1. Quality & Architecture
- **Service Orientation**: Follow Domain-Driven Design (DDD). Group logic by domain (Auth, Discovery, Community, Library).
- **Type Safety**: Use TypeScript for both Frontend and Backend. Interfaces must be shared/aligned.
- **Async Pattern**: Use `try/catch` with a global error middleware. No unhandled promise rejections.

## 2. API Design
- **Versioning**: All APIs must be versioned (e.g., `/api/v1/search`).
- **Enveloping**: Every response must follow the standard envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "timestamp": "...", "requestId": "..." }
  }
  ```
- **Documentation**: Swagger/OpenAPI 3.0 specs are mandatory for all public and internal service routes.

## 3. Security & Trust
- **Auth Gates**: OTP is mandatory for login. Onboarding is mandatory for dashboard access.
- **RBAC**: Every route must be protected by a role check middleware.
- **Encryption**: HTTPS only. Use TLS 1.3.

## 4. Frontend & UX
- **Performance**: P95 load time < 1.5s. Use Next.js Image optimization and dynamic imports.
- **Accessibility**: WCAG 2.1 Level AA compliance is a requirement.
- **Design System**: Strict adherence to the ResearchBridge typography and color palette. No ad-hoc styling.

## 5. Deployment & Ops
- **Containerization**: Use Docker + Docker Compose for local dev; Kubernetes for production.
- **Observability**: Centralized logging (ELK) and monitoring (Prometheus/Grafana).
- **CI/CD**: No deployment without passing unit, integration, and security scans (SAST).