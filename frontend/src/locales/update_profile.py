import json
import os

locales_dir = "frontend/src/locales"

translations = {
    "en": {
        "profile.protection_plan": "Protection Plan",
        "profile.active_protection": "Active Protection",
        "profile.policy_week": "Policy Week",
        "profile.how_it_works_desc": "Automatic payouts based on zone disruptions.",
        "profile.zero_click_payout": "Zero-click payout to {{upi}}",
        "profile.zone_risk": "Zone Risk",
        "profile.claim_history": "Claim History",
        "profile.account_details": "Account Details"
    },
    "hi": {
        "profile.protection_plan": "सुरक्षा योजना",
        "profile.active_protection": "सक्रिय सुरक्षा",
        "profile.policy_week": "पॉलिसी सप्ताह",
        "profile.how_it_works_desc": "ज़ोन में बाधाओं के आधार पर स्वचालित भुगतान।",
        "profile.zero_click_payout": "{{upi}} पर स्वचालित भुगतान",
        "profile.zone_risk": "ज़ोन जोखिम",
        "profile.claim_history": "क्लेम इतिहास",
        "profile.account_details": "खाता विवरण"
    },
    "ta": {
        "profile.protection_plan": "பாதுகாப்பு திட்டம்",
        "profile.active_protection": "செயலில் உள்ள பாதுகாப்பு",
        "profile.policy_week": "கொள்கை வாரம்",
        "profile.how_it_works_desc": "மண்டல இடையூறுகளின் அடிப்படையில் தானியங்கி பணம் பெறுதல்.",
        "profile.zero_click_payout": "{{upi}} க்கு தானியங்கி பணம்",
        "profile.zone_risk": "மண்டல ஆபத்து",
        "profile.claim_history": "கோரல் வரலாறு",
        "profile.account_details": "கணக்கு விவரங்கள்"
    },
    "te": {
        "profile.protection_plan": "రక్షణ ప్రణాళిక",
        "profile.active_protection": "సక్రియ రక్షణ",
        "profile.policy_week": "పాలసీ వారం",
        "profile.how_it_works_desc": "జోన్ అంతరాయాల ఆధారంగా స్వయంచాలక చెల్లింపులు.",
        "profile.zero_click_payout": "{{upi}} కి స్వయంచాలక చెల్లింపు",
        "profile.zone_risk": "జోన్ ప్రమాదం",
        "profile.claim_history": "క్లెయిమ్ చరిత్ర",
        "profile.account_details": "ఖాతా వివరాలు"
    },
    "kn": {
        "profile.protection_plan": "ರಕ್ಷಣಾ ಯೋಜನೆ",
        "profile.active_protection": "ಸಕ್ರಿಯ ರಕ್ಷಣೆ",
        "profile.policy_week": "ಪಾಲಿಸಿ ವಾರ",
        "profile.how_it_works_desc": "ವಲಯ ಅಡಚಣೆಗಳ ಆಧಾರದ ಮೇಲೆ ಸ್ವಯಂಚಾಲಿತ ಪಾವತಿಗಳು.",
        "profile.zero_click_payout": "{{upi}} ಗೆ ಸ್ವಯಂಚಾಲಿತ ಪಾವತಿ",
        "profile.zone_risk": "ವಲಯ ಅಪಾಯ",
        "profile.claim_history": "ಕ್ಲೇಮ್ ಇತಿಹಾಸ",
        "profile.account_details": "ಖಾತೆ ವಿವರಗಳು"
    },
    "as": {
        "profile.protection_plan": "সুৰক্ষা পৰিকল্পনা",
        "profile.active_protection": "সক্ৰিয় সুৰক্ষা",
        "profile.policy_week": "পলিচি সপ্তাহ",
        "profile.how_it_works_desc": "জ'নৰ বাধাৰ আধাৰত স্বয়ংক্ৰিয় পেমেন্ট।",
        "profile.zero_click_payout": "{{upi}} লৈ স্বয়ংক্ৰিয় পেমেন্ট",
        "profile.zone_risk": "জ'নৰ বিপদাশংকা",
        "profile.claim_history": "ক্লেইমৰ ইতিহাস",
        "profile.account_details": "একাউণ্টৰ বিৱৰণ"
    },
    "bn": {
        "profile.protection_plan": "সুরক্ষা পরিকল্পনা",
        "profile.active_protection": "সক্রিয় সুরক্ষা",
        "profile.policy_week": "পলিসি সপ্তাহ",
        "profile.how_it_works_desc": "জোন বাধার ভিত্তিতে স্বয়ংক্রিয় পেআউট।",
        "profile.zero_click_payout": "{{upi}} তে স্বয়ংক্রিয় পেআউট",
        "profile.zone_risk": "জোন ঝুঁকি",
        "profile.claim_history": "ক্লেম ইতিহাস",
        "profile.account_details": "অ্যাকাউন্টের বিবরণ"
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
