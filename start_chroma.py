# start_chroma.py
import chromadb
from chromadb.config import Settings
import uvicorn
from chromadb.server.fastapi import FastAPI

# Create ChromaDB server
settings = Settings(
    chroma_server_host="0.0.0.0",
    chroma_server_http_port=8000,
    persist_directory="./chroma_data",
    allow_reset=True
)

app = FastAPI(settings)

if __name__ == "__main__":
    print("🚀 Starting ChromaDB Server on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)