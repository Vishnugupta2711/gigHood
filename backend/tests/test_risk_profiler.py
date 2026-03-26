import os
import pytest
import numpy as np
from backend.services.risk_profiler import predict_tier, MODEL_PATH, train_and_save_model

def test_train_and_save_generates_pkl():
    """Verify that training securely serializes the .pkl state"""
    if os.path.exists(MODEL_PATH):
        os.remove(MODEL_PATH)
        
    assert not os.path.exists(MODEL_PATH)
    train_and_save_model()
    assert os.path.exists(MODEL_PATH)

def test_predict_tier_A_low_risk_zone():
    """Verify that a safe zone accurately lands in Tier A (lowest risk)"""
    history = [0.10, 0.15, 0.20, 0.15, 0.10, 0.12]
    seasonal = False # Dry season
    flood_proximity = 4800 # Far away from rivers (in meters)
    claim_frequency = 0.05 # Rarely any claims
    
    tier = predict_tier(history, seasonal, flood_proximity, claim_frequency)
    assert tier == 'A'
    
def test_predict_tier_C_high_risk_zone():
    """Verify that predicting a dangerous zone lands in Tier C (highest risk)"""
    history = [0.85, 0.90, 0.95, 0.88, 0.90, 0.92]
    seasonal = True # Monsoon season
    flood_proximity = 120 # Almost directly on a historical flood point (in meters)
    claim_frequency = 0.95 # Highly frequent historical claims
    
    tier = predict_tier(history, seasonal, flood_proximity, claim_frequency)
    assert tier == 'C'

def test_predict_tier_empty_history_graceful_fallback():
    """If a zone has absolutely no history, the prediction should gracefully default to an average"""
    # Just checking it doesn't crash on an empty list
    tier = predict_tier([], False, 4500, 0.1)
    
    assert tier in ['A', 'B', 'C']
