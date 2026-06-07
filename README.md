# SmartResearch

SmartResearch is an AI-powered social and collaboration platform for the academic community. It bridges the gap between research discovery, peer collaboration, and publication success through a secure, reputation-driven ecosystem.

## 🚀 Key Features

- **AI Discovery Engine:** SBERT-powered research matching and trust graph visualization.
- **Collaborative Workspaces:** Real-time document versioning and research team management.
- **Publication Assistant:** Live DOAJ journal recommendations and comprehensive submission checklists.
- **Community Forum:** Threaded discussions protected by **TrustRank** reputation gating and automated spam filtering.
- **Verified Profiles:** Institutional badge display and social citation integration.
- **Mentorship Module:** Matchmaking for junior and senior researchers, structured learning paths, and progress tracking.

## 🛠️ Technical Stack

- **Frontend:** Next.js (App Router), Zustand, Tailwind CSS, Radix UI.
- **Backend:** Node.js / Express, PostgreSQL (Primary DB), Redis (Streams/Cache).
- **AI Service:** Python FastAPI, SBERT (Matching), Neo4j (Trust Graph).
- **Ops:** Kubernetes, HPA, Cloudflare CDN/WAF.

## 🏗️ Getting Started

### Prerequisites
- Node.js v18+
- Docker & Kubernetes
- Python 3.9+ (for ML service)

### Installation
```bash
git clone https://github.com/mostofa-rezvi/SmartResearch.git
cd SmartResearch
npm install
```

### Development
```bash
npm run dev
```

### WebSocket Authentication
Real-time features via Socket.IO require JWT authentication during the handshake. Clients must provide their JWT token in the `auth` object:
```javascript
const socket = io("http://your-server-url", {
  auth: {
    token: "your_jwt_token_here"
  }
});
```

### Running Templates
To instantiate standard research templates (e.g., proposals, ethics reviews), run the built-in generator script:
```bash
npm run generate:template -- --name="My Project" --type="proposal"
```

## 📜 Documentation
- [Architecture Guide](ARCHITECTURE.md)
- [API Reference](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing](CONTRIBUTING.md)

## 🛡️ License
MIT
