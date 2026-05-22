import json
import os

locales_dir = "frontend/src/locales"

translations = {
    "en": {
        "home_radar_demand": "Demand",
        "home_live_zone_overlay": "Live zone overlay"
    },
    "hi": {
        "home_radar_demand": "डिमांड",
        "home_live_zone_overlay": "लाइव ज़ोन ओवरले"
    },
    "ta": {
        "home_radar_demand": "தேவை",
        "home_live_zone_overlay": "நேரலை மண்டல மேலடுக்கு"
    },
    "te": {
        "home_radar_demand": "డిమాండ్",
        "home_live_zone_overlay": "లైవ్ జోన్ ఓవర్లే"
    },
    "kn": {
        "home_radar_demand": "ಬೇಡಿಕೆ",
        "home_live_zone_overlay": "ಲೈವ್ ಜೋನ್ ಓವರ್ಲೇ"
    },
    "as": {
        "home_radar_demand": "চাহিদা",
        "home_live_zone_overlay": "লাইভ জ'ন অভাৰলে"
    },
    "bn": {
        "home_radar_demand": "চাহিদা",
        "home_live_zone_overlay": "লাইভ জোন ওভারলে"
    }
}

for lang, new_keys in translations.items():
    file_path = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        data.update(new_keys)
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {lang}.json")
