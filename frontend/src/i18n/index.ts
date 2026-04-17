"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import kn from '../locales/kn.json';
import bn from '../locales/bn.json';
import as from '../locales/as.json';

type FlatLocale = Record<string, string>;

function buildLocale(base: FlatLocale, overrides: FlatLocale = {}) {
  const merged: FlatLocale = { ...base, ...overrides };
  const homeScoped = Object.entries(merged).reduce<FlatLocale>((acc, [key, value]) => {
    acc[key] = value;
    if (key.startsWith('home_')) {
      acc[key.slice(5)] = value;
    }
    return acc;
  }, {});

  return {
    ...merged,
    nav: {
      home: merged.nav_home || 'Home',
      payouts: merged.nav_payouts || 'Payouts',
      copilot: merged.nav_copilot || 'Copilot',
      govt: merged.nav_govt || 'Govt',
      policy: merged.nav_profile || 'Policy',
    },
    home: {
      ...homeScoped,
    },
  };
}

const enLocale = buildLocale(en as FlatLocale, {
  nav_govt: 'Govt',
  home_failed_load: 'Failed to load dashboard.',
  home_retry: 'Retry',
  home_status_syncing: 'Syncing',
  home_status_degraded: 'Degraded',
  home_status_safe: 'Safe',
  home_status_warning: 'Warning',
  home_status_disrupted: 'Disrupted',
  home_dci_desc_syncing: 'DCI telemetry is syncing for your zone.',
  home_dci_desc_degraded: 'Signal quality is degraded in your zone right now.',
  home_dci_desc_safe: 'Zone conditions are stable and safe.',
  home_dci_desc_warning: 'Zone risk is elevated. Stay alert.',
  home_dci_desc_disrupted: 'Disruption confirmed. Claim flow is available.',
  home_receipt_success: 'Claim approved',
  home_receipt_denied: 'Claim denied',
  home_receipt_review: 'Claim under review',
  home_receipt_success_desc: 'Payout is being processed.',
  home_receipt_denied_desc: 'No payout for this event.',
  home_receipt_review_desc: 'Verification is in progress.',
  home_claim_id: 'Claim ID',
  home_payout_amount: 'Payout Amount',
  home_fraud_score: 'Fraud Score',
  home_clean: 'Clean',
  home_review: 'Review',
  home_processing_track: 'Processing track',
  home_why_happened: 'Why this happened',
  home_tip: 'Tip: {{tip}}',
  home_payment_id: 'Payment ID',
  home_proof_of_presence: 'Proof of Presence',
  home_validated: 'Validated',
  home_failed: 'Failed',
  home_back_dashboard: 'Back to dashboard',
  home_view_all_payouts: 'View all payouts',
  home_receipt_generated: 'Receipt generated at {{time}}',
  home_evaluating_claim: 'Evaluating claim securely…',
  home_hey: 'Hey {{name}}',
  home_policy_pending: 'Policy pending',
  home_trigger_simulation: 'Trigger simulation',
  home_copilot_action: 'Copilot',
  home_radar_action: 'Radar',
  home_simulation_error: 'Simulation failed. Try again.',
  home_claim_error: 'Claim processing failed. Try again.',
});

const hiLocale = buildLocale(hi as FlatLocale, {
  nav_govt: 'सरकार',
  home_failed_load: 'डैशबोर्ड लोड नहीं हुआ।',
  home_retry: 'फिर प्रयास करें',
  home_status_syncing: 'सिंक हो रहा है',
  home_status_degraded: 'कमज़ोर',
  home_status_safe: 'सुरक्षित',
  home_status_warning: 'चेतावनी',
  home_status_disrupted: 'बाधित',
  home_dci_desc_syncing: 'आपके ज़ोन के लिए DCI टेलीमेट्री सिंक हो रही है।',
  home_dci_desc_degraded: 'अभी आपके ज़ोन में सिग्नल गुणवत्ता कम है।',
  home_dci_desc_safe: 'ज़ोन की स्थिति स्थिर और सुरक्षित है।',
  home_dci_desc_warning: 'ज़ोन का जोखिम बढ़ा हुआ है। सतर्क रहें।',
  home_dci_desc_disrupted: 'बाधा की पुष्टि हुई। क्लेम फ्लो उपलब्ध है।',
  home_receipt_success: 'क्लेम स्वीकृत',
  home_receipt_denied: 'क्लेम अस्वीकृत',
  home_receipt_review: 'क्लेम समीक्षा में',
  home_receipt_success_desc: 'भुगतान प्रोसेस हो रहा है।',
  home_receipt_denied_desc: 'इस घटना पर भुगतान नहीं है।',
  home_receipt_review_desc: 'सत्यापन जारी है।',
  home_claim_id: 'क्लेम आईडी',
  home_payout_amount: 'भुगतान राशि',
  home_fraud_score: 'फ्रॉड स्कोर',
  home_clean: 'साफ',
  home_review: 'समीक्षा',
  home_processing_track: 'प्रोसेसिंग ट्रैक',
  home_why_happened: 'ऐसा क्यों हुआ',
  home_tip: 'टिप: {{tip}}',
  home_payment_id: 'भुगतान आईडी',
  home_proof_of_presence: 'उपस्थिति प्रमाण',
  home_validated: 'सत्यापित',
  home_failed: 'असफल',
  home_back_dashboard: 'डैशबोर्ड पर वापस जाएं',
  home_view_all_payouts: 'सभी भुगतान देखें',
  home_receipt_generated: '{{time}} पर रसीद बनाई गई',
  home_evaluating_claim: 'क्लेम का सुरक्षित मूल्यांकन हो रहा है…',
  home_hey: 'नमस्ते {{name}}',
  home_policy_pending: 'पॉलिसी लंबित',
  home_trigger_simulation: 'सिमुलेशन चालू करें',
  home_copilot_action: 'कॉपायलट',
  home_radar_action: 'रडार',
  home_simulation_error: 'सिमुलेशन असफल रहा। फिर प्रयास करें।',
  home_claim_error: 'क्लेम प्रोसेसिंग असफल रही। फिर प्रयास करें।',
});

const taLocale = buildLocale(en as FlatLocale, ta as FlatLocale);

const teLocale = buildLocale(en as FlatLocale, te as FlatLocale);

const knLocale = buildLocale(en as FlatLocale, kn as FlatLocale);

const mrLocale = buildLocale(en as FlatLocale, {
  nav_home: 'मुख्यपृष्ठ',
  nav_payouts: 'पेमेंट्स',
  nav_copilot: 'कोपायलट',
  nav_profile: 'प्रोफाइल',
  nav_govt: 'सरकार',
  home_quick_actions: 'त्वरित कृती',
  home_this_week: 'या आठवड्यात',
  home_active_coverage: 'सुरक्षा सक्रिय',
  home_live: 'लाइव्ह',
  home_live_time: 'लाइव्ह · {{time}}',
});

const bnLocale = buildLocale(en as FlatLocale, bn as FlatLocale);

const asLocale = buildLocale(en as FlatLocale, as as FlatLocale);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enLocale },
      hi: { translation: hiLocale },
      ta: { translation: taLocale },
      te: { translation: teLocale },
      kn: { translation: knLocale },
      mr: { translation: mrLocale },
      bn: { translation: bnLocale },
      as: { translation: asLocale },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'ta', 'te', 'kn', 'mr', 'bn', 'as'],
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
  });

export default i18n;
