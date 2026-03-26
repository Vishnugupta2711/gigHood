import os
import pickle
import numpy as np
import pandas as pd
import xgboost as xgb
import logging

logger = logging.getLogger("api")

ML_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml")
MODEL_PATH = os.path.join(ML_DIR, "risk_profiler.pkl")

# Global in-memory cache for the loaded model to prevent I/O blocking
_model = None

def _generate_synthetic_data(num_samples: int = 2000) -> pd.DataFrame:
    """
    Generates deterministic synthetic training data mapping historical DCI attributes to Risk Tiers.
    Features:
    - 12_week_dci_avg: float
    - seasonal_flag: int (1 = monsoon, 0 = dry)
    - flood_proximity_m: float (meters to historically flooded point)
    - claim_frequency: float (normalized frequency)
    
    Target:
    - tier: 0 (A), 1 (B), 2 (C)
    """
    np.random.seed(42)  # Ensure perfectly deterministic output across runs
    
    # Generate feature arrays
    dci_avg = np.random.uniform(0.1, 0.95, num_samples)
    seasonal_flag = np.random.choice([0, 1], num_samples, p=[0.7, 0.3])
    flood_proximity_m = np.random.uniform(0, 5000, num_samples)
    claim_freq = np.random.uniform(0, 1, num_samples)
    
    # Calculate a synthetic core logic score
    # Higher score = higher risk
    risk_score = (dci_avg * 40) + (seasonal_flag * 20) + ((5000 - flood_proximity_m) / 5000 * 30) + (claim_freq * 10)
    
    # Add noise to make it realistic for ML
    noise = np.random.normal(0, 5, num_samples)
    final_score = risk_score + noise
    
    # Map boundaries to Tiers
    # 0 = A (Safe), 1 = B (Elevated), 2 = C (High Risk)
    tiers = np.where(final_score > 65, 2, np.where(final_score > 40, 1, 0))
    
    df = pd.DataFrame({
        "dci_avg": dci_avg,
        "seasonal_flag": seasonal_flag,
        "flood_proximity_m": flood_proximity_m,
        "claim_frequency": claim_freq,
        "tier": tiers
    })
    return df

def train_and_save_model():
    """
    Trains the XGBoost classifier on synthetic data and saves weights to the local filesystem.
    """
    logger.info("Generating synthetic risk profiling dataset...")
    df = _generate_synthetic_data()
    
    X = df[["dci_avg", "seasonal_flag", "flood_proximity_m", "claim_frequency"]]
    y = df["tier"]
    
    logger.info("Training XGBoost Classifier...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        eval_metric='mlogloss',
        random_state=42
    )
    
    model.fit(X, y)
    
    # Serialize model securely
    os.makedirs(ML_DIR, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
        
    logger.info(f"Successfully trained and serialized XGBoost model to {MODEL_PATH}")

def load_model():
    """
    Loads and caches the XGBoost model. If the file is missing, automatically train it.
    """
    global _model
    if _model is not None:
        return _model
        
    if not os.path.exists(MODEL_PATH):
        logger.warning(f"XGBoost model file {MODEL_PATH} missing. Automatically triggering training cycle...")
        train_and_save_model()
        
    with open(MODEL_PATH, "rb") as f:
        _model = pickle.load(f)
        
    return _model

def predict_tier(worker_hex_history: list[float], seasonal_flag: bool, flood_proximity: float, claim_frequency: float) -> str:
    """
    Computes the insurance risk Tier ('A', 'B', or 'C') based on physical properties of the assigned Hex zone.
    """
    model = load_model()
    
    # Extract the average of the 12-week history array, fallback to 0.0 if empty
    dci_avg = float(np.mean(worker_hex_history)) if worker_hex_history else 0.0
    season_int = 1 if seasonal_flag else 0
    
    # Construct singleton DataFrame explicitly mirroring training schema
    df_inf = pd.DataFrame([{
        "dci_avg": dci_avg,
        "seasonal_flag": season_int,
        "flood_proximity_m": flood_proximity,
        "claim_frequency": claim_frequency
    }])
    
    # Predict deterministic class
    pred = model.predict(df_inf)[0]
    
    # Safely route the predicted integer back to String Tier definitions
    mapping = {0: 'A', 1: 'B', 2: 'C'}
    return mapping.get(int(pred), 'B') # Fallback safely to B if corrupted prediction occurs
