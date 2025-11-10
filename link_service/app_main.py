from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import secrets
import time
from typing import Dict

app = FastAPI(title="Link Service", version="1.0.0")

# In-memory storage (replace with Redis/database in production)
magic_links: Dict[str, dict] = {}

class CreateLinkRequest(BaseModel):
    user_id: str
    email: str

class ConsumeLinkRequest(BaseModel):
    token: str

class CreateLinkResponse(BaseModel):
    magic_link: str
    token: str
    expires_in: int

class ConsumeLinkResponse(BaseModel):
    app_token: str
    user_id: str

@app.get("/")
def read_root():
    return {"service": "Link Service", "status": "running"}

@app.post("/mobile/link/create", response_model=CreateLinkResponse)
def create_magic_link(request: CreateLinkRequest):
    """Create a magic link for passwordless authentication"""
    token = secrets.token_urlsafe(32)
    app_token = secrets.token_urlsafe(48)
    expires_at = time.time() + 600  # 10 minutes
    
    magic_links[token] = {
        "user_id": request.user_id,
        "email": request.email,
        "app_token": app_token,
        "expires_at": expires_at,
        "consumed": False
    }
    
    magic_link = f"gearted://link/consume?token={token}"
    
    return CreateLinkResponse(
        magic_link=magic_link,
        token=token,
        expires_in=600
    )

@app.post("/mobile/link/consume", response_model=ConsumeLinkResponse)
def consume_magic_link(request: ConsumeLinkRequest):
    """Consume a magic link and return app token"""
    link_data = magic_links.get(request.token)
    
    if not link_data:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    if link_data["consumed"]:
        raise HTTPException(status_code=400, detail="Link already used")
    
    if time.time() > link_data["expires_at"]:
        del magic_links[request.token]
        raise HTTPException(status_code=410, detail="Link expired")
    
    # Mark as consumed
    link_data["consumed"] = True
    
    return ConsumeLinkResponse(
        app_token=link_data["app_token"],
        user_id=link_data["user_id"]
    )

@app.get("/health")
def health_check():
    return {"status": "healthy", "active_links": len(magic_links)}
