from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import httpx
import logging
from backend.config import settings

router = APIRouter()
logger = logging.getLogger("stt")

@router.post("")
async def transcribe_audio(file: UploadFile = File(...), language: str = Form("en")):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        
    try:
        content = await file.read()
        files = {"file": (file.filename, content, file.content_type)}
        data = {"model": "whisper-large-v3", "response_format": "json"}
        
        # Add language if it's one of the supported whisper languages. 
        # Groq supports ISO-639-1 language codes.
        iso_lang = language.split('-')[0]
        if iso_lang in ['en', 'hi', 'ta', 'te', 'kn', 'mr', 'bn', 'as']:
            data["language"] = iso_lang
            
        headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                files=files,
                data=data,
                headers=headers,
                timeout=30.0
            )
            
        if resp.status_code != 200:
            logger.error(f"Groq API error: {resp.text}")
            raise HTTPException(status_code=resp.status_code, detail="Failed to transcribe audio")
            
        result = resp.json()
        return {"transcript": result.get("text", "")}
        
    except Exception as e:
        logger.error(f"STT error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
