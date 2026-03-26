import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.config import settings
from backend.db.client import supabase

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="workers/auth/token")

def create_jwt(worker_id: str) -> str:
    """Create a new standard JWT encoding the worker's UUID."""
    to_encode = {"sub": worker_id}
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_jwt(token: str) -> dict:
    """Decode and validate a JWT returning the payload."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_worker(token: str = Depends(oauth2_scheme)) -> dict:
    """FastAPI Dependency to retrieve the currently authenticated worker from the DB."""
    payload = decode_jwt(token)
    worker_id = payload.get("sub")
    if worker_id is None:
        raise HTTPException(status_code=401, detail="Invalid auth token format.")
        
    try:
        res = supabase.table('workers').select('*').eq('id', worker_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Worker not found.")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
