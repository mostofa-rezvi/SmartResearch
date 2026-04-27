# SmartResearch API Reference

All API requests require a valid `Authorization` header.

## 🏛️ Forum API
`BASE_URL: /api/forum`

### Get Threads
`GET /`
- **Description:** Returns a TrustRank-weighted feed of forum threads.
- **Response:** `200 OK` with `Thread[]`.

### Create Thread
`POST /`
- **Body:** `{ "title": string, "content": string }`
- **Auth:** Required.
- **Security:** TrustRank is calculated server-side.
- **Response:** `201 Created`.

## 🔬 Journal Recommender
`BASE_URL: /api/journals`

### Get Recommendations
`GET /?topic=quantum&domain=science`
- **Description:** Fetches live journal data from DOAJ API based on search parameters.
- **Auth:** Required.
- **Response:** `Journal[]`.

## 📝 Publication Checklist
`BASE_URL: /api/checklist`

### Get Checklist
`GET /`
- **Description:** Returns user-specific publication tasks and downloadable templates.
- **Auth:** Required.
- **Response:** `{ templates: string[], checklist: Task[] }`.

## 🔍 Discovery
`BASE_URL: /api/discovery`

### SBERT Search
`POST /search`
- **Body:** `{ "query": string }`
- **Performance:** Latency < 200ms.
- **Response:** Matched research papers with relevance scores.
