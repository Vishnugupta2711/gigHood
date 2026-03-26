import hashlib
from datetime import date
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from backend.db.client import supabase
from backend.services.auth_service import create_jwt, get_current_worker
from backend.services.spatial import lat_lng_to_hex

router = APIRouter()

# --- Schemas ---
class WorkerRegisterRequest(BaseModel):
    phone: str = Field(..., max_length=15)
    name: str = Field(..., max_length=100)
    city: str = Field(..., max_length=50)
    dark_store_zone: str = Field(..., max_length=100)
    avg_daily_earnings: float
    upi_id: str = Field(..., max_length=100)
    device_model: str = Field(..., max_length=100)
    device_os_version: str = Field(..., max_length=20)
    sim_carrier: str = Field(..., max_length=50)
    sim_registration_date: date

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

def hash_dark_store_to_coords(dark_store_name: str) -> tuple[float, float]:
    """
    Deterministically hash a dark store string into valid coords within Bengaluru.
    Bengaluru bounds: Lat roughly 12.8 to 13.1, Lng roughly 77.5 to 77.8
    """
    hs = hashlib.sha256(dark_store_name.encode('utf-8')).hexdigest()
    # Take first 8 chars for lat, next 8 for lng
    lat_val = int(hs[:8], 16) / 0xFFFFFFFF
    lng_val = int(hs[8:16], 16) / 0xFFFFFFFF
    
    lat = 12.8 + (lat_val * (13.1 - 12.8))
    lng = 77.5 + (lng_val * (77.8 - 77.5))
    return lat, lng

# --- Endpoints ---
@router.post("/auth/otp/send")
def send_otp(req: OTPRequest):
    # Mocking OTP sent via fake SMS gateway
    # Using deterministic mock for testing simplicity: "123456" for demo.
    print(f"--- MOCK SMS ---")
    print(f"To: {req.phone}")
    print(f"OTP: 123456")
    print(f"----------------")
    return {"message": "OTP sent successfully."}

@router.post("/auth/otp/verify")
def verify_otp(req: OTPVerify):
    # Verify mock OTP
    if req.otp != "123456":
         raise HTTPException(status_code=400, detail="Invalid OTP")
         
    # Check if user exists
    try:
        res = supabase.table('workers').select('id').eq('phone', req.phone).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Worker not found against this phone number. Please register.")
        worker_id = res.data[0]['id']
        token = create_jwt(worker_id)
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/register")
def register_worker(req: WorkerRegisterRequest):
    # Map abstract dark store string to physical PostGIS H3 index geometrically 
    lat, lng = hash_dark_store_to_coords(req.dark_store_zone)
    hex_id = lat_lng_to_hex(lat, lng)
    
    try:
        # Prevent duplicates
        existing = supabase.table('workers').select('id').eq('phone', req.phone).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Phone number already registered")
            
        insert_res = supabase.table('workers').insert({
            "phone": req.phone,
            "name": req.name,
            "city": req.city,
            "dark_store_zone": req.dark_store_zone,
            "hex_id": hex_id,
            "avg_daily_earnings": req.avg_daily_earnings,
            "upi_id": req.upi_id,
            "device_model": req.device_model,
            "device_os_version": req.device_os_version,
            "sim_carrier": req.sim_carrier,
            "sim_registration_date": req.sim_registration_date.isoformat(),
            "trust_score": 50,
            "status": "active"
        }).execute()
        
        if not insert_res.data:
            raise HTTPException(status_code=500, detail="Failed to insert worker record.")
            
        worker_id = insert_res.data[0]['id']
        token = create_jwt(worker_id)
        return {"access_token": token, "token_type": "bearer", "hex_id": hex_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
def get_me(worker: dict = Depends(get_current_worker)):
    return worker

@router.get("/me/policy")
def get_my_policy(worker: dict = Depends(get_current_worker)):
    worker_id = worker.get("id")
    try:
        res = supabase.table('policies').select('*').eq('worker_id', worker_id).eq('status', 'active').execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="No active policy found. Please onboard your risk profile.")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
