from fastapi import FastAPI

app = FastAPI(title="ResearchBridge ML Service")

@app.get("/")
async def root():
    return {"message": "Welcome to ResearchBridge ML Service"}

@app.get("/health")
async def health():
    return {"status": "ok"}
