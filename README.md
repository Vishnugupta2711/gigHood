<table align="center">
<tr>
<td align="center">
<img src="https://github.com/user-attachments/assets/e2710db6-0137-4137-931f-adbdcdd13e15" width="420"/>
</td>
<td align="center">
<img src="https://github.com/user-attachments/assets/93d89b74-910b-4f0a-b47f-9b99ad389bdc" width="180"/>
</td>
</tr>
</table>

# GigHood — AI-Powered Parametric Income Insurance for Gig Workers

> **Guidewire DEVTrails Hackathon 2026**  
> *Protecting gig worker income from external disruptions using AI-driven parametric insurance.*

---

## 💬 What Riders Say

</div>

---

<table>
<tr>
<td width="100" align="center" valign="top">
<br>
<img src="https://api.dicebear.com/7.x/personas/svg?seed=rider1" width="68" height="68" />
<br><br>
<b>⭐⭐⭐⭐⭐</b>
</td>
<td valign="top">
<br>

> *❝ When heavy rain hits the city, deliveries slow down or stop completely. That means losing an entire day's earnings. A safety net for days like this would make a huge difference for workers like us. ❞*

**Ravi Kumar**
<br>
🛵 Food Delivery Partner

</td>
</tr>
</table>

---

<table>
<tr>
<td width="100" align="center" valign="top">
<br>
<img src="https://api.dicebear.com/7.x/personas/svg?seed=rider2" width="68" height="68" />
<br><br>
<b>⭐⭐⭐⭐⭐</b>
</td>
<td valign="top">
<br>

> *❝ Some days the heat or pollution becomes unbearable. We cannot ride for long hours, but the bills don't stop. Income protection during such days would change everything. ❞*

**Arjun Singh**
<br>
🛒 Grocery Delivery Rider

</td>
</tr>
</table>

---

<table>
<tr>
<td width="100" align="center" valign="top">
<br>
<img src="https://api.dicebear.com/7.x/personas/svg?seed=rider3" width="68" height="68" />
<br><br>
<b>⭐⭐⭐⭐⭐</b>
</td>
<td valign="top">
<br>

> *❝ When sudden curfews or local shutdowns happen, deliveries stop and we lose the entire day's income. Having an automated insurance system for these disruptions would provide real peace of mind. ❞*

**Imran Shaikh**
<br>
📦 E-commerce Delivery Partner

</td>
</tr>
</table>

---

</div>
## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Persona & Scenario](#3-persona--scenario)
4. [Parametric Insurance Model](#4-parametric-insurance-model)
5. [Weekly Premium Model](#5-weekly-premium-model)
6. [Parametric Triggers](#6-parametric-triggers)
7. [AI/ML Integration](#7-aiml-integration)
8. [Application Workflow](#8-application-workflow)
9. [Tech Stack & Architecture](#9-tech-stack--architecture)
10. [Development Plan](#10-development-plan)
11. [Business Viability](#11-business-viability)
12. [Team](#12-team)

---


## 🔍 Problem Overview

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=22&pause=1000&color=38BDF8&center=true&vCenter=true&width=700&lines=India's+gig+workers+deliver+everything...;...except+financial+safety.;Millions+work+without+a+safety+net.;One+disruption.+Zero+income." alt="Typing SVG"/>

</div>

<br/>

India's gig economy is the invisible engine behind on-demand urban life. Millions of delivery partners working with **Zomato**, **Swiggy**, **Amazon**, **Flipkart**, **Zepto**, and **Dunzo** ensure fast, reliable fulfillment — yet they operate entirely **without a stable financial safety net**.

Unlike salaried employees, gig workers are compensated **strictly per delivery or per hour worked.** When the environment turns hostile — weather, pollution, civil unrest — they simply **stop earning.**

<div align="center">

> ### 📉 External disruptions reduce a delivery partner's earnings by **20–30% of monthly income**
> *Studies and platform reports consistently confirm this figure across Indian metros.*

</div>

---

## 🧱 Barriers Gig Workers Face

A structural analysis of the compounding vulnerabilities that leave delivery partners financially exposed during operational disruptions.

<table>
<tr>
<td width="50%" valign="top">

### 👷 Worker-Level Barriers

| # | Issue |
|:--|:------|
| 01 | No compensation during forced work stoppages |
| 02 | Daily-earning dependency — **zero financial buffer** |
| 03 | Forced to choose between **safety** and **survival** |
| 04 | No short-term income loss insurance product exists |
| 05 | Even a few-hour disruption causes immediate strain |

</td>
<td width="50%" valign="top">

### 🏗️ Systemic Barriers

| # | Issue |
|:--|:------|
| 01 | Traditional insurance is **slow, complex, dispute-prone** |
| 02 | No product aligned to **weekly earning cycles** |
| 03 | Fraudulent claims risk without smart verification |
| 04 | No dynamic pricing based on real-time risk |
| 05 | No automated disruption detection pipeline |

</td>
</tr>
</table>

---

## ⚡ Disruption Types

GigShield identifies and responds to **two primary classes of disruptions** that halt delivery operations and eliminate gig worker income:

### 🌧️ Environmental Disruptions

| Disruption | Mechanism | Impact |
|:-----------|:----------|:-------|
| 🌧️ &nbsp;Extreme rainfall & flooding | Roads become impassable | Delivery routes blocked entirely |
| 🌡️ &nbsp;Severe heatwaves | Outdoor temps exceed safety thresholds | Platform suspends operations |
| 🌫️ &nbsp;Hazardous AQI spikes | Air quality crosses danger limits | Workers stop to avoid health risk |
| 🌀 &nbsp;Cyclones & storms | High-wind unsafe for two-wheelers | All outdoor operations halted |
| 🚧 &nbsp;Waterlogged routes | Key corridors flooded | GPS routes unusable |

<br/>

### 🚦 Social & Administrative Disruptions

| Disruption | Mechanism | Impact |
|:-----------|:----------|:-------|
| 🚫 &nbsp;Government-imposed curfews | Movement legally restricted | Zero pickups or drop-offs possible |
| ✊ &nbsp;Local strikes & bandhs | Coordinated shutdowns | Vendor hubs and drop points closed |
| 📣 &nbsp;Political protests | Blocked roads, unsafe conditions | Routing impossible in affected zones |
| 🏪 &nbsp;Sudden market closures | Vendor hubs shut without notice | Fulfillment chain broken |
| 🛑 &nbsp;Mobility restriction orders | Vehicle bans in key areas | Last-mile delivery impossible |

---

### 📋 How Every Disruption Leads to the Same Outcome

```
+------------------------------------------------------------------------+
|                                                                        |
|  Heavy Rain  ->  Roads unsafe        ->  Deliveries halted   ->  Rs.0  |
|  High AQI    ->  Outdoor work risky  ->  Platform suspends   ->  Rs.0  |
|  Heatwave    ->  Safety hazard       ->  Operations paused   ->  Rs.0  |
|  Curfew      ->  Movement blocked    ->  No pickups/drops    ->  Rs.0  |
|  Bandh       ->  Hubs closed         ->  No fulfillment      ->  Rs.0  |
|                                                                        |
|    Every disruption type  ->  Same outcome for gig workers             |
|               ZERO earnings.    ZERO protection.                       |
|                                                                        |
+------------------------------------------------------------------------+
```

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=16&pause=2000&color=EF4444&center=true&vCenter=true&width=600&lines=This+is+the+problem+GigShield+solves.;Automated.+Instant.+AI-powered+protection." alt="CTA Typing SVG"/>

</div>

---
---

## 🚀 Proposed Solution — AEGIS

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=800&size=28&pause=1500&color=38BDF8&center=true&vCenter=true&width=700&lines=Introducing+AEGIS;AI-Powered+Income+Protection;Predict.+Automate.+Protect.;Built+for+India's+Gig+Workers." alt="AEGIS Typing SVG"/>

</div>

<br/>

> **AEGIS** is a comprehensive, AI-driven financial protection platform designed exclusively for gig workers. It transforms traditional insurance into a **real-time, predictive, and automated income protection system** — combining AI risk intelligence, micro-insurance, real-time data integration, and automated payouts.

<div align="center">

| ₹25 | 10 | 0 | 4-Layer |
|:---:|:---:|:---:|:---:|
| Starting weekly premium | Intelligent pillars | Manual claims needed | Fraud detection |

</div>

---

## 🧱 Platform Architecture — 10 Core Pillars

### 01 · 🔍 AI-Powered Risk Intelligence Layer

The brain of AEGIS — continuously ingesting and analysing real-world data to predict income risks before they strike.

| Data Input | Purpose |
|:-----------|:--------|
| Weather forecasts (rainfall, temperature) | Predict delivery-halting conditions |
| Traffic congestion data | Identify route disruptions |
| Pollution / AQI levels | Flag outdoor safety thresholds |
| Historical delivery demand | Estimate earning potential |
| Worker activity patterns | Personalise risk profiles |

**Capabilities:** Next-day & weekly income prediction · Disruption probability scoring · Income loss estimation · Optimal plan recommendation

---

### 02 · 🛡️ Flexible Micro-Insurance (Weekly Protection Plans)

Affordable, short-term policies designed around the weekly earning rhythm of gig workers — no long-term commitment required.

<div align="center">

| Plan | Weekly Premium | Coverage |
|:-----|:--------------:|:---------|
| 🥉 Starter | **₹25/week** | Rain, flood, basic disruption alerts |
| 🥈 Pro ⭐ | **₹49/week** | + Heat, AQI, AI forecast, auto-protection |
| 🥇 Elite | **₹79/week** | + Full event coverage, health score, govt schemes |

</div>

---

### 03 · ⚡ Automated Claim Triggering & Instant Payouts

AEGIS eliminates manual claim processes entirely through smart trigger-based automation.

```
Trigger Conditions:
  ├── Rainfall exceeds threshold    (e.g., > 30mm)
  ├── AI risk score crosses limit   (e.g., > 80%)
  └── Verified disruption event detected

Automated Lifecycle:
  [Disruption Detected]
         |
         v
  [Policy Verified]
         |
         v
  [Claim Auto-Triggered]
         |
         v
  [Fraud Check Passed]
         |
         v
  [INSTANT PAYOUT -> Worker Wallet]
```

✅ Zero paperwork &nbsp;&nbsp; ✅ No claim filing &nbsp;&nbsp; ✅ Near real-time compensation

---

### 04 · 📱 Worker-Centric Smart Application

A mobile-first app designed for simplicity, accessibility, and real impact.

| Feature | Description |
|:--------|:-----------|
| Risk Dashboard | Real-time disruption risk by location & time |
| Safety Radar | Zone-based risk map + demand heatmap |
| AI Earnings Forecast | Predicted income for next day / week |
| Financial Health Score | 0–100 score tracking stability & resilience |
| Voice AI Assistant | Hands-free guidance for active workers |
| Govt Scheme Discovery | Curated welfare schemes with eligibility check |

**User Flow:** `Login → Dashboard → Risk Prediction → Recommendation → Policy Activation → Auto Protection`

---

### 05 · 🤖 Smart Protection Mode (Auto Policy Activation)

Always-on financial security — AEGIS monitors risk continuously and activates coverage automatically.

```
Monitors real-time risk 24/7
        |
        ├── Risk > 70%?  ──────────────► Auto-activate policy
        |
        └── Expected loss > threshold?  ► Auto-activate policy
```

Workers remain protected **without any manual intervention** — eliminating human error and missed coverage windows.

---

### 06 · 📊 Financial Health Intelligence

AEGIS goes beyond protection — it helps workers build long-term financial resilience.

- **Financial Health Score (0–100)** — composite metric of income stability, savings, and risk exposure
- **Personalised insights** — actionable recommendations based on earnings pattern
- **Trend tracking** — month-over-month resilience benchmarks

---

### 07 · 🗺️ Real-Time Safety & Opportunity Radar

A dynamic map interface guiding workers to smarter decisions in real time.

```
Green zones  ──►  Safe working areas (low disruption risk)
Amber zones  ──►  Caution areas (moderate risk, monitor)
Red zones    ──►  Avoid (active disruption, high risk)
Gold zones   ──►  High-demand areas (better earning opportunity)
```

---

### 08 · 🏛️ Government Scheme Integration

Bridging the gap between gig workers and India's welfare ecosystem.

| Scheme | Coverage |
|:-------|:---------|
| e-Shram | Unorganised worker registration & benefits |
| PM-SYM | Pension scheme for informal workers |
| PMJDY | Financial inclusion & banking access |
| PMJJBY / PMSBY | Life & accident insurance at minimal cost |

---

### 09 · 🔐 AI-Powered Fraud Detection System

A 4-layer fraud detection architecture ensuring platform integrity and claim reliability.

```
Layer 1  ──  Identity Verification       (KYC & document checks)
Layer 2  ──  Location Validation         (GPS spoofing detection)
Layer 3  ──  Behavioral Analysis         (activity pattern anomalies)
Layer 4  ──  Trust Graph                 (collusion & network detection)
                     |
                     v
           Fraud Risk Score (FRS)
                     |
          ┌──────────┼──────────┐
          v          v          v
      Auto-Approve  Review   Reject
```

---

### 10 · 🧠 Unified Intelligent Architecture

All 10 pillars integrated into a single, modular, scalable ecosystem.

```
+--------------------------------------------------+
|              WORKER APP (Frontend)               |
|        React Native · Voice AI · Dashboard       |
+----------------------+---------------------------+
                       |
                       v
+--------------------------------------------------+
|           BACKEND APIs (Node.js / Express)       |
|     Policy Engine · Auth · Payout Orchestration  |
+----------------------+---------------------------+
                       |
                       v
+--------------------------------------------------+
|    AI RISK ENGINE + FRAUD DETECTION (FastAPI)    |
|   ML Models · Risk Scoring · Fraud Risk Score    |
+----------------------+---------------------------+
                       |
                       v
+--------------------------------------------------+
|              EXTERNAL DATA SOURCES               |
|    Weather · Traffic · AQI · Govt Alert APIs     |
+--------------------------------------------------+
```

---

## 📊 Impact Summary

<div align="center">

| Worker Benefit | Without AEGIS | With AEGIS |
|:---------------|:-------------:|:----------:|
| Income loss during disruption | 20–30% of monthly | **Compensated** |
| Claim processing time | Days / weeks | **Minutes** |
| Manual paperwork | Extensive | **Zero** |
| Pricing cycle alignment | Monthly / Annual | **Weekly** |
| Fraud protection | None | **4-Layer AI** |
| Financial planning support | None | **AI-guided** |

</div>

---

## 💬 One-Line Solution Statement

<div align="center">

> ### *"AEGIS is an AI-powered, real-time income protection platform that predicts risks, automates insurance, and ensures instant payouts for gig workers."*

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=15&pause=2000&color=38BDF8&center=true&vCenter=true&width=700&lines=Predict.+Protect.+Pay.+Instantly.;Built+for+the+backbone+of+India's+economy." alt="Tagline SVG"/>

</div>

---

## 3. Persona & Scenario

### Ravi Kumar — Primary Persona

| Attribute | Detail |
|---|---|
| Age | 26 |
| City | Bengaluru |
| Platforms | Swiggy & Zomato |
| Weekly Income | ₹4,500 (average) |
| Best Week | ₹6,200 |
| Worst Monsoon Week | ₹1,800 |
| Vehicle | 2-wheeler |
| Device | Android smartphone |
| Payment Method | UPI |

> *"If rain stops orders for two days, I cannot pay rent."*

### Ravi's Workflow with GigHood

```
Monday Morning
└── Ravi opens GigHood app
└── AI engine displays his weekly risk score based on weather forecast
└── Ravi selects "Pro Plan" — ₹129/week, max payout ₹2,000
└── Payment deducted via UPI
└── Policy activates instantly

Wednesday — Sudden Heavy Rain
└── OpenWeatherMap detects rainfall >35mm/hr in Ravi's zone
└── AI Trigger Engine confirms threshold breach
└── Fraud engine validates Ravi's GPS location and work history
└── Fraud Risk Score: 18 → Auto-approved
└── ₹800 payout dispatched to Ravi's UPI ID

Wednesday Evening
└── Ravi receives WhatsApp notification: "₹800 credited — stay safe"
└── Zero action required from Ravi
```

### Additional Persona — Priya Devi (Chennai)

| Attribute | Detail |
|---|---|
| Age | 31 | 
| City | Chennai |
| Platform | Amazon Flex |
| Key Risk | Cyclone season + coastal flooding |

GigHood automatically recommends **Rain + Cyclone coverage** for Priya based on her city's regional risk profile, without requiring her to understand policy terms.

---

## 4. Parametric Insurance Model

### Traditional vs. Parametric

| Dimension | Traditional Insurance | Parametric Insurance (GigHood) |
|---|---|---|
| Trigger | Individual loss verified | External event threshold |
| Claim filing | Manual, documented | None required |
| Settlement time | Weeks to months | Minutes |
| Proof required | Extensive documentation | Zero |
| Fraud surface | High (self-reported loss) | Low (objective data) |
| Suitable for gig workers | No | Yes |

### How It Works

```
External event detected (e.g., heavy rain in Bengaluru)
         │
         ▼
AI engine validates threshold (rainfall > 35mm/hr confirmed)
         │
         ▼
Policy eligibility checked (active policy in affected zone)
         │
         ▼
Fraud Risk Score computed (GPS, history, behavior)
         │
         ▼
Payout amount calculated (tier × disruption severity)
         │
         ▼
UPI transfer executed automatically
         │
         ▼
Worker notified via WhatsApp + push notification
```

**No claim. No form. No delay.**

---

## 5. Weekly Premium Model

Gig workers earn weekly, face weekly expenses, and budget weekly. Monthly premiums create a structural mismatch. GigHood aligns with how gig workers actually manage money.

### Protection Tiers

| Tier | Weekly Premium | Max Weekly Payout | Coverage Ratio |
|---|---|---|---|
| Basic | ₹49 | ₹800 | 16.3x |
| Pro | ₹129 | ₹2,000 | 15.5x |
| Max | ₹249 | ₹4,000 | 16.1x |

### Dynamic Premium Pricing

Premiums are not fixed — they are recalculated each week based on multiple signals:

| Factor | Impact on Premium |
|---|---|
| City risk level | Higher disruption cities → higher base premium |
| Season | Monsoon, winter pollution season → surge pricing |
| Worker history | Low-claim history → loyalty discount |
| Predicted disruption probability | AI forecast → real-time adjustment |
| Platform activity | Active workers eligible; inactive accounts paused |

**Example:** Ravi in Bengaluru during peak monsoon (July) may see Pro plan at ₹149 instead of ₹129, reflecting elevated flood risk. Conversely, in dry season, the same plan may drop to ₹109.

### Weather-Adaptive Regional Recommendations

| Region | Primary Risk | Recommended Coverage |
|---|---|---|
| Delhi (Oct–Feb) | AQI spikes | AQI protection add-on |
| Mumbai (Jun–Sep) | Monsoon + flooding | Flood coverage |
| Chennai (Nov–Dec) | Cyclone + rain | Rain + cyclone bundle |
| Rajasthan (Apr–Jun) | Extreme heat | Heatwave protection |
| Bengaluru (Jun–Sep) | Monsoon disruption | Rain + traffic bundle |

The app surfaces these recommendations contextually — workers are never asked to interpret weather risk themselves.

---

## 6. Parametric Triggers

GigHood monitors multiple real-world signals continuously. Payouts activate automatically when thresholds are crossed.

| Trigger | Threshold | Data Source | Payout Condition |
|---|---|---|---|
| Heavy Rain | Rainfall > 35mm/hr | OpenWeatherMap API | Worker in active zone |
| Flood Alert | Disaster warning issued | NDMA API | Zone matches worker location |
| Extreme Heat | Heat index > 44°C | IMD API | Active policy + shift hours |
| Hazardous AQI | AQI > 400 | CPCB API | Worker in affected city |
| Curfew / Bandh | Government restriction | News APIs + NLP | Zone lockdown confirmed |
| Major Traffic Shutdown | Critical road closure | Google Maps API | Worker zone impacted |
| Platform Outage | Delivery app unavailable | Platform health check | Worker's primary platform |
| Cyclone Warning | Cyclone within 100km | IMD Cyclone API | Worker in impact radius |

### Multi-Trigger Events

When multiple triggers activate simultaneously (e.g., cyclone + flood + platform outage), payouts are additive up to the weekly maximum for the worker's tier. The AI engine applies a **disruption severity multiplier** to scale payouts proportionally.

---

## 7. AI/ML Integration

AI is not a feature layer in Equix — it is the operational core. Every key decision is model-driven.

### ML Modules

| Module | Model | Purpose |
|---|---|---|
| Risk Prediction | XGBoost | Predict weekly disruption probability per zone |
| Weather Forecasting | LSTM (time-series) | 7-day rainfall, AQI, temperature forecasting |
| Premium Pricing | Regression + XGBoost | Dynamic weekly premium computation |
| Fraud Detection | Isolation Forest | Anomaly detection on claims and location data |
| Worker Segmentation | K-Means Clustering | Behavior-based risk profiling |
| Payout Optimization | Reinforcement Learning | Maximize coverage fairness within loss limits |

### ML Pipeline

```
External APIs (Weather, NDMA, CPCB, Maps)
              │
              ▼
       Data Ingestion Layer
              │
              ▼
      Feature Engineering
   (zone, weather, time, history)
              │
              ▼
      Risk Prediction Model
       (XGBoost — per zone)
              │
              ▼
       Trigger Detection
   (threshold validation engine)
              │
              ▼
       Fraud Scoring Engine
     (Isolation Forest + rules)
              │
              ▼
     Automatic Payout Decision
              │
              ▼
    Payment Service (Razorpay/UPI)
```

### Premium Calculation — AI Workflow

1. Worker's city, zone, and season are extracted
2. LSTM model generates 7-day weather forecast for the zone
3. Historical disruption data for that zone is retrieved
4. XGBoost model scores disruption probability (0.0–1.0)
5. Actuarial model maps probability to expected loss
6. Premium is set as: `base_premium × city_risk_factor × season_multiplier × worker_loyalty_discount`
7. Premium is shown to worker before payment

### Fraud Detection — Detail

Each potential payout is scored using a **Fraud Risk Score (FRS)** from 0 to 100.

| Score Range | Action |
|---|---|
| 0–30 | Auto-approve |
| 31–55 | Approve + passive monitoring |
| 56–70 | Additional verification (OTP / selfie) |
| 71–85 | Manual review queue |
| 86–100 | Auto-reject, flag for investigation |

**Fraud signals detected:**

| Signal | Detection Method |
|---|---|
| GPS spoofing | Trajectory velocity analysis |
| Duplicate accounts | Device fingerprinting + Aadhaar hash |
| Zone hopping | Location history cross-validation |
| Claim surge anomalies | Isolation Forest on cluster behavior |
| Platform activity mismatch | Cross-reference with platform API data |

Models retrain continuously on new labeled data, improving accuracy over time.

### Voice AI Assistant

Many gig workers prefer voice interaction over reading policy text. Equix includes a **GenAI-powered voice assistant**:

- Worker speaks naturally: *"What happens if it rains tomorrow?"*
- Speech-to-text converts audio to query
- LLM (Claude / GPT-4) generates a plain-language response
- Text-to-speech delivers the answer in the worker's language

Supported languages: Hindi, Kannada, Tamil, Telugu, English

### Government Scheme Discovery

Equix integrates a live scheme discovery module that surfaces relevant benefits:

- **e-Shram** accident and disability coverage
- State-level gig worker welfare funds
- PM Suraksha Bima Yojana eligibility
- Platform-specific insurance partnerships

Workers receive personalized, actionable scheme suggestions based on their profile.

---

## 8. Application Workflow

### Worker Onboarding Flow

```
1. Download Equix app
2. Register with mobile number + Aadhaar OTP
3. Select delivery platform(s)
4. AI generates personalized risk profile
5. Recommended plan displayed with regional risk reasoning
6. Worker selects plan + pays via UPI (auto-debit enabled)
7. Policy active — worker protected
```

### Weekly Policy Cycle

```
Monday: Premium deducted automatically (auto-debit or UPI mandate)
         └── Policy active for 7 days

During week: AI monitors all trigger conditions in real-time
              └── Any threshold breach → payout initiated automatically

Sunday: Policy summary sent (disruptions covered, payouts made, next week preview)
         └── Option to upgrade / downgrade plan
```

### Payout Flow (End-to-End)

```
Trigger event detected (e.g., rain alert)
└── Zone mapping: worker's current GPS zone matched
└── Policy check: active policy confirmed
└── Fraud score computed: < 30 → auto-approve
└── Payout amount: tier × severity multiplier
└── Payment: Razorpay UPI transfer initiated
└── Confirmation: WhatsApp + push notification
Total time: < 90 seconds from trigger detection to payout
```

---

## 9. Tech Stack & Architecture

### Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Mobile App | React Native | Cross-platform (Android + iOS), single codebase |
| Admin Dashboard | React + Tailwind CSS | Fast, component-driven UI for operations team |
| API Gateway | Kong / AWS API Gateway | Rate limiting, auth, routing |
| Backend Services | FastAPI (Python) + Node.js | FastAPI for ML-heavy services; Node.js for real-time |
| ML Models | XGBoost, PyTorch (LSTM) | Industry-standard for tabular + time-series ML |
| Database | PostgreSQL + TimescaleDB | Relational + time-series data (weather, claims) |
| Cache | Redis | Sub-millisecond trigger detection |
| Payments | Razorpay | UPI, auto-debit mandate, instant settlement |
| Notifications | WhatsApp Business API + FCM | Reach workers on familiar channels |
| Cloud | AWS (ECS, RDS, S3, Lambda) | Managed, scalable, India region |
| CI/CD | GitHub Actions + Docker | Automated testing and container deployment |

### System Architecture

```
┌─────────────────────────────────────────────────┐
│               Gig Worker (Mobile App)            │
│                  React Native                    │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────┐
│                  API Gateway                     │
│         (Auth, Rate Limiting, Routing)           │
└───┬──────────┬──────────┬──────────┬────────────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
┌───────┐ ┌───────┐ ┌─────────┐ ┌────────┐
│Policy │ │AI Risk│ │Trigger  │ │Payment │
│Engine │ │Engine │ │Monitor  │ │Service │
└───────┘ └───────┘ └────┬────┘ └────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ Weather  │ │ NDMA   │ │ CPCB/IMD │
        │   API    │ │  API   │ │   API    │
        └──────────┘ └────────┘ └──────────┘

┌─────────────────────────────────────────────────┐
│              Data Layer                         │
│   PostgreSQL  │  TimescaleDB  │  Redis Cache    │
└─────────────────────────────────────────────────┘
```

### Microservices Breakdown

| Service | Responsibility |
|---|---|
| **Policy Engine** | Plan management, activation, renewal |
| **AI Risk Engine** | Risk scoring, premium calculation, ML inference |
| **Trigger Monitor** | Real-time API polling, threshold evaluation |
| **Claim Engine** | Payout orchestration, amount calculation |
| **Fraud Detection** | FRS computation, anomaly flagging |
| **Payment Service** | Razorpay UPI integration, settlement |
| **Notification Service** | WhatsApp + FCM push delivery |
| **Auth Service** | Aadhaar OTP, JWT, device fingerprinting |

---

## 10. Development Plan

### Phase 1 — Ideation & Foundation (Weeks 1–2) ✅ *Current*

- [x] Problem research and persona development
- [x] Parametric trigger design and threshold definition
- [x] Weekly premium model and tier structure
- [x] Platform architecture decisions (mobile-first)
- [x] AI/ML module design
- [x] README and repository setup

### Phase 2 — Core Development (Weeks 3–5)

- [ ] Backend API scaffolding (FastAPI + Node.js)
- [ ] Database schema design (PostgreSQL + TimescaleDB)
- [ ] ML pipeline setup (data ingestion + feature store)
- [ ] External API integrations (OpenWeatherMap, NDMA, CPCB, IMD)
- [ ] Trigger detection engine (real-time polling + threshold logic)
- [ ] Basic mobile app screens (onboarding, policy, dashboard)

### Phase 3 — AI/ML Integration (Weeks 6–8)

- [ ] XGBoost risk prediction model (training + deployment)
- [ ] LSTM weather forecasting model
- [ ] Dynamic premium pricing engine
- [ ] Isolation Forest fraud detection model
- [ ] K-Means worker segmentation
- [ ] Fraud Risk Score (FRS) pipeline

### Phase 4 — Payment & Automation (Weeks 9–10)

- [ ] Razorpay UPI integration (one-time + auto-debit mandate)
- [ ] End-to-end claim automation (trigger → fraud score → payout)
- [ ] WhatsApp notification integration
- [ ] Admin dashboard (real-time analytics + manual review queue)

### Phase 5 — Testing & Demo Preparation (Weeks 11–12)

- [ ] End-to-end integration testing
- [ ] Load testing (simulate 10,000 concurrent trigger events)
- [ ] Demo scenario scripting and data seeding
- [ ] Voice AI assistant integration
- [ ] Government scheme discovery module
- [ ] Final submission preparation

---

## 11. Business Viability

### Market Opportunity

| Metric | Value |
|---|---|
| Current gig workforce (India) | 15M+ |
| Projected workforce by 2030 | 23.5M |
| Addressable workers (digital UPI) | 8M |
| Estimated annual market size | ₹6,000+ crore |

### Revenue Streams

| Stream | Model |
|---|---|
| Weekly premiums | Primary — B2C subscription |
| Platform partnerships | B2B — Swiggy, Zomato white-label |
| Insurance APIs | B2B — Sell trigger engine to other insurers |
| Analytics insights | SaaS — Disruption data to urban planners |

### Unit Economics (Pro Tier Example)

```
Weekly premium:       ₹129
Expected payout:      ₹129 × loss ratio (target 65%) = ₹83.85
Operating cost/user:  ₹15
Gross margin:         ₹30.15 per worker per week

At 100,000 active workers: ₹3 crore+ gross margin per week
```

---

## 12. Repository Structure

```
gighood/
├── README.md
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   ├── mobile/              # React Native app
│   └── dashboard/           # React admin dashboard
├── services/
│   ├── api-gateway/
│   ├── policy-engine/
│   ├── ai-risk-engine/
│   ├── trigger-monitor/
│   ├── claim-engine/
│   ├── fraud-detection/
│   └── payment-service/
├── ml/
│   ├── models/
│   │   ├── risk_prediction/
│   │   ├── weather_forecast/
│   │   ├── fraud_detection/
│   │   └── premium_pricing/
│   ├── pipelines/
│   └── notebooks/
└── infra/
    ├── terraform/
    └── kubernetes/
```

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-repo/gighood

# Navigate to project root
cd gighood

# Start all services
docker-compose up

# Backend API
http://localhost:8000

# Admin Dashboard
http://localhost:3000

# API Documentation
http://localhost:8000/docs
```

---

## 13. Team

**GigHood Team — Guidewire DEVTrails Hackathon 2026**

Building the future of financial protection for gig workers in India through AI-powered parametric income insurance.

| Name | Role |
|---|---|
| Vishnu Gupta |  Team Leader |
| Abhay Kumar | Team Member |
| Ananya Agarwal | Team Member |
| Krishna Somani | Team Member |
| Praveen Kumar | Team Member |

---



<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:060f1e,40:0a2040,100:0f3060&height=220&section=header&text=GigHood&fontSize=90&fontColor=38BDF8&fontAlignY=38&desc=AI-Powered%20Parametric%20Income%20Insurance%20for%20Gig%20Workers&descColor=94a3b8&descAlignY=58&animation=fadeIn" width="100%"/>

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=18&pause=1200&color=38BDF8&center=true&vCenter=true&width=700&lines=Predict+disruptions+before+they+strike.;Automate+insurance.+Eliminate+paperwork.;Instant+payouts+when+gig+workers+need+it+most.;Built+for+India's+15M%2B+delivery+partners." alt="Typing SVG"/>

<br/>

![Hackathon](https://img.shields.io/badge/Guidewire-DEVTrails%20Hackathon%202026-0f4c81?style=for-the-badge&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active%20Development-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)

<br/>

![Zomato](https://img.shields.io/badge/Zomato-E23744?style=flat-square&logoColor=white)
![Swiggy](https://img.shields.io/badge/Swiggy-FC8019?style=flat-square&logoColor=white)
![Amazon](https://img.shields.io/badge/Amazon-FF9900?style=flat-square&logo=amazon&logoColor=white)
![Flipkart](https://img.shields.io/badge/Flipkart-2874F0?style=flat-square&logoColor=white)
![Zepto](https://img.shields.io/badge/Zepto-9B59B6?style=flat-square&logoColor=white)
![Dunzo](https://img.shields.io/badge/Dunzo-00B386?style=flat-square&logoColor=white)

</div>

---

## 💬 What Riders Say

<table>
<tr>
<td width="88" align="center" valign="top">
<img src="https://api.dicebear.com/7.x/personas/svg?seed=rider1" width="68" height="68"/>
<br/><b>⭐⭐⭐⭐⭐</b>
</td>
<td valign="top">

> *❝ When heavy rain hits the city, deliveries slow down or stop completely. That means losing an entire day's earnings. A safety net for days like this would make a huge difference for workers like us. ❞*

**Ravi Kumar** &nbsp;·&nbsp; 🛵 Food Delivery Partner, Bengaluru

</td>
</tr>
</table>

<table>
<tr>
<td width="88" align="center" valign="top">
<img src="https://api.dicebear.com/7.x/personas/svg?seed=rider2" width="68" height="68"/>
<br/><b>⭐⭐⭐⭐⭐</b>
</td>
<td valign="top">

> *❝ Some days the heat or pollution becomes unbearable. We cannot ride for long hours, but the bills don't stop. Income protection during such days would change everything. ❞*

**Arjun Singh** &nbsp;·&nbsp; 🛒 Grocery Delivery Rider, Delhi

</td>
</tr>
</table>

<table>
<tr>
<td width="88" align="center" valign="top">
<img src="https://api.dicebear.com/7.x/personas/svg?seed=rider3" width="68" height="68"/>
<br/><b>⭐⭐⭐⭐⭐</b>
</td>
<td valign="top">

> *❝ When sudden curfews or local shutdowns happen, deliveries stop and we lose the entire day's income. Having an automated insurance system for these disruptions would provide real peace of mind. ❞*

**Imran Shaikh** &nbsp;·&nbsp; 📦 E-commerce Delivery Partner, Mumbai

</td>
</tr>
</table>

---

## 📑 Table of Contents

| # | Section |
|:-:|:--------|
| 1 | [Problem Overview](#-problem-overview) |
| 2 | [Barriers Gig Workers Face](#-barriers-gig-workers-face) |
| 3 | [Disruption Types](#-disruption-types) |
| 4 | [Proposed Solution — AEGIS](#-proposed-solution--aegis) |
| 5 | [Persona & Scenario](#-persona--scenario) |
| 6 | [Parametric Insurance Model](#-parametric-insurance-model) |
| 7 | [Weekly Premium Model](#-weekly-premium-model) |
| 8 | [Parametric Triggers](#-parametric-triggers) |
| 9 | [AI/ML Integration](#-aiml-integration) |
| 10 | [Application Workflow](#-application-workflow) |
| 11 | [Tech Stack & Architecture](#-tech-stack--architecture) |
| 12 | [Development Plan](#-development-plan) |
| 13 | [Business Viability](#-business-viability) |
| 14 | [Repository Structure](#-repository-structure) |
| 15 | [Team](#-team) |

---

## 🔍 Problem Overview

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=20&pause=1000&color=38BDF8&center=true&vCenter=true&width=700&lines=India's+gig+workers+deliver+everything...;...except+financial+safety.;Millions+work+without+a+safety+net.;One+disruption.+Zero+income." alt="Typing SVG"/>

</div>

<br/>

India's gig economy is the invisible engine behind on-demand urban life. Millions of delivery partners working with **Zomato**, **Swiggy**, **Amazon**, **Flipkart**, **Zepto**, and **Dunzo** ensure fast, reliable fulfillment — yet they operate entirely **without a stable financial safety net**.

Unlike salaried employees, gig workers are compensated **strictly per delivery or per hour worked.** When the environment turns hostile — weather, pollution, civil unrest — they simply **stop earning.**

<div align="center">

> ### 📉 External disruptions reduce a delivery partner's earnings by **20–30% of monthly income**
> *Studies and platform reports consistently confirm this figure across Indian metros.*

</div>

---

## 🧱 Barriers Gig Workers Face

A structural analysis of the compounding vulnerabilities that leave delivery partners financially exposed during operational disruptions.

<table>
<tr>
<td width="50%" valign="top">

### 👷 Worker-Level Barriers

| # | Issue |
|:--|:------|
| 01 | No compensation during forced work stoppages |
| 02 | Daily-earning dependency — **zero financial buffer** |
| 03 | Forced to choose between **safety** and **survival** |
| 04 | No short-term income loss insurance product exists |
| 05 | Even a few-hour disruption causes immediate strain |

</td>
<td width="50%" valign="top">

### 🏗️ Systemic Barriers

| # | Issue |
|:--|:------|
| 01 | Traditional insurance is **slow, complex, dispute-prone** |
| 02 | No product aligned to **weekly earning cycles** |
| 03 | Fraudulent claims risk without smart verification |
| 04 | No dynamic pricing based on real-time risk |
| 05 | No automated disruption detection pipeline |

</td>
</tr>
</table>

---

## ⚡ Disruption Types

GigHood identifies and responds to **two primary classes of disruptions** that halt delivery operations and eliminate gig worker income:

### 🌧️ Environmental Disruptions

| Disruption | Mechanism | Impact |
|:-----------|:----------|:-------|
| 🌧️ &nbsp;Extreme rainfall & flooding | Roads become impassable | Delivery routes blocked entirely |
| 🌡️ &nbsp;Severe heatwaves | Outdoor temps exceed safety thresholds | Platform suspends operations |
| 🌫️ &nbsp;Hazardous AQI spikes | Air quality crosses danger limits | Workers stop to avoid health risk |
| 🌀 &nbsp;Cyclones & storms | High-wind unsafe for two-wheelers | All outdoor operations halted |
| 🚧 &nbsp;Waterlogged routes | Key corridors flooded | GPS routes unusable |

<br/>

### 🚦 Social & Administrative Disruptions

| Disruption | Mechanism | Impact |
|:-----------|:----------|:-------|
| 🚫 &nbsp;Government-imposed curfews | Movement legally restricted | Zero pickups or drop-offs possible |
| ✊ &nbsp;Local strikes & bandhs | Coordinated shutdowns | Vendor hubs and drop points closed |
| 📣 &nbsp;Political protests | Blocked roads, unsafe conditions | Routing impossible in affected zones |
| 🏪 &nbsp;Sudden market closures | Vendor hubs shut without notice | Fulfillment chain broken |
| 🛑 &nbsp;Mobility restriction orders | Vehicle bans in key areas | Last-mile delivery impossible |

---

### 📋 How Every Disruption Leads to the Same Outcome

```
+------------------------------------------------------------------------+
|                                                                        |
|  Heavy Rain  ->  Roads unsafe        ->  Deliveries halted   ->  Rs.0  |
|  High AQI    ->  Outdoor work risky  ->  Platform suspends   ->  Rs.0  |
|  Heatwave    ->  Safety hazard       ->  Operations paused   ->  Rs.0  |
|  Curfew      ->  Movement blocked    ->  No pickups/drops    ->  Rs.0  |
|  Bandh       ->  Hubs closed         ->  No fulfillment      ->  Rs.0  |
|                                                                        |
|    Every disruption type  ->  Same outcome for gig workers             |
|               ZERO earnings.    ZERO protection.                       |
|                                                                        |
+------------------------------------------------------------------------+
```

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=15&pause=2000&color=EF4444&center=true&vCenter=true&width=600&lines=This+is+the+problem+GigHood+solves.;Automated.+Instant.+AI-powered+protection." alt="CTA Typing SVG"/>

</div>

---

## 🚀 Proposed Solution — AEGIS

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=800&size=26&pause=1500&color=38BDF8&center=true&vCenter=true&width=700&lines=Introducing+AEGIS;AI-Powered+Income+Protection;Predict.+Automate.+Protect.;Zero+paperwork.+Instant+payouts." alt="AEGIS Typing SVG"/>

</div>

<br/>

> **AEGIS** is a comprehensive, AI-driven financial protection platform designed exclusively for gig workers. It transforms traditional insurance into a **real-time, predictive, and automated income protection system** — combining AI risk intelligence, micro-insurance, real-time data integration, and automated payouts.

<div align="center">

| ₹25 | 10 | 0 | 4-Layer | < 90s |
|:---:|:---:|:---:|:---:|:---:|
| Starting weekly premium | Core pillars | Manual claims needed | Fraud detection | Trigger to payout |

</div>

---

### 01 · 🔍 AI-Powered Risk Intelligence Layer

The brain of AEGIS — continuously ingesting and analysing real-world data to predict income risks before they strike.

| Data Input | Purpose |
|:-----------|:--------|
| Weather forecasts (rainfall, temperature) | Predict delivery-halting conditions |
| Traffic congestion data | Identify route disruptions |
| Pollution / AQI levels | Flag outdoor safety thresholds |
| Historical delivery demand | Estimate earning potential |
| Worker activity patterns | Personalise risk profiles |

**Capabilities:** Next-day & weekly income prediction · Disruption probability scoring · Income loss estimation · Optimal plan recommendation

---

### 02 · 🛡️ Flexible Micro-Insurance — Weekly Protection Plans

Affordable, short-term policies designed around the weekly earning rhythm of gig workers.

<div align="center">

| Plan | Weekly Premium | Max Payout | Coverage Ratio | Coverage |
|:-----|:--------------:|:----------:|:--------------:|:---------|
| 🥉 Basic | **₹49/week** | ₹800 | 16.3x | Rain, flood, basic alerts |
| 🥈 Pro ⭐ | **₹129/week** | ₹2,000 | 15.5x | + Heat, AQI, AI forecast, auto-protection |
| 🥇 Max | **₹249/week** | ₹4,000 | 16.1x | + Full event coverage, health score, govt schemes |

</div>

---

### 03 · ⚡ Automated Claim Triggering & Instant Payouts

AEGIS eliminates manual claim processes entirely. Disruption detected to payout delivered in **under 90 seconds.**

```
Trigger Conditions
  ├── Rainfall exceeds threshold     (e.g., > 35mm/hr)
  ├── AI risk score crosses limit    (e.g., > 80%)
  └── Verified disruption event confirmed by external API

Automated Lifecycle
  [Disruption Detected]
         |
         v
  [Worker Zone + Policy Verified]
         |
         v
  [Fraud Risk Score Computed]
         |
    ┌────┴────┐
   FRS<30    FRS>70
    |           |
    v           v
 [Auto-      [Manual
  Approve]    Review]
    |
    v
  [Payout Amount Calculated]
         |
         v
  [UPI Transfer Executed — < 90s]
         |
         v
  [WhatsApp + Push Notification Sent]
```

✅ &nbsp;Zero paperwork &nbsp;&nbsp; ✅ &nbsp;No claim filing &nbsp;&nbsp; ✅ &nbsp;Near real-time compensation

---

### 04 · 📱 Worker-Centric Smart Application

A mobile-first app designed for simplicity, accessibility, and real impact.

| Feature | Description |
|:--------|:------------|
| Risk Dashboard | Real-time disruption risk by location & time |
| Safety Radar | Zone-based risk map + demand heatmap |
| AI Earnings Forecast | Predicted income for next day / week |
| Financial Health Score | 0–100 score tracking stability & resilience |
| Voice AI Assistant | Hindi, Tamil, Telugu, Kannada, English support |
| Govt Scheme Discovery | Curated welfare schemes with eligibility check |

**User Flow:** `Login → Dashboard → Risk Prediction → Recommendation → Policy Activation → Auto Protection`

---

### 05 · 🤖 Smart Protection Mode

Always-on financial security — AEGIS monitors risk continuously and activates coverage automatically.

```
Continuous risk monitoring (24/7)
        |
        ├── Risk score > 70%?          ──► Auto-activate policy
        └── Expected loss > threshold? ──► Auto-activate policy
```

Workers remain protected **without any manual intervention** — eliminating missed coverage windows.

---

### 06–10 · Additional Platform Pillars

| Pillar | Feature | Description |
|:------:|:--------|:------------|
| 06 | 📊 Financial Health Intelligence | Health score (0–100), savings insights, resilience tracking |
| 07 | 🗺️ Real-Time Safety Radar | Green / amber / red / gold zone map for smart routing |
| 08 | 🏛️ Govt Scheme Integration | e-Shram, PM-SYM, PMJDY, PMJJBY/PMSBY with eligibility |
| 09 | 🔐 AI Fraud Detection | 4-layer: identity → GPS → behavioral → trust graph |
| 10 | 🧠 Unified Architecture | Worker App → Backend APIs → AI Engine → External Data |

---

## 👤 Persona & Scenario

### Ravi Kumar — Primary Persona

| Attribute | Detail |
|:----------|:-------|
| Age | 26 |
| City | Bengaluru |
| Platforms | Swiggy & Zomato |
| Average weekly income | ₹4,500 |
| Best week | ₹6,200 |
| Worst monsoon week | ₹1,800 |
| Vehicle | 2-wheeler |
| Device | Android smartphone |
| Payment method | UPI |

> *"If rain stops orders for two days, I cannot pay rent."*

### Ravi's Week with GigHood

```
Monday Morning
  └── Opens GigHood app → AI displays weekly risk score
  └── Selects Pro Plan — Rs.129/week, max payout Rs.2,000
  └── Payment deducted via UPI → Policy activates instantly

Wednesday — Sudden Heavy Rain
  └── OpenWeatherMap detects rainfall > 35mm/hr in Ravi's zone
  └── AI Trigger Engine confirms threshold breach
  └── Fraud engine validates GPS + work history
  └── Fraud Risk Score: 18  →  Auto-approved
  └── Rs.800 payout dispatched to Ravi's UPI ID

Wednesday Evening
  └── WhatsApp notification: "Rs.800 credited — stay safe"
  └── Zero action required from Ravi
```

### Secondary Persona — Priya Devi (Chennai)

| Attribute | Detail |
|:----------|:-------|
| Age | 31 |
| City | Chennai |
| Platform | Amazon Flex |
| Key risk | Cyclone season + coastal flooding |

GigHood automatically recommends **Rain + Cyclone coverage** for Priya based on her city's regional risk profile — without requiring her to understand policy terms.

---

## 📐 Parametric Insurance Model

### Traditional vs. Parametric

| Dimension | Traditional Insurance | Parametric (GigHood) |
|:----------|:---------------------:|:--------------------:|
| Trigger | Individual loss verified | External event threshold |
| Claim filing | Manual, documented | **None required** |
| Settlement time | Weeks to months | **Minutes** |
| Proof required | Extensive documentation | **Zero** |
| Fraud surface | High (self-reported) | **Low (objective data)** |
| Suitable for gig workers | ❌ | ✅ |

### End-to-End Parametric Flow

```
External event detected (e.g., heavy rain in Bengaluru)
         |
         v
AI engine validates threshold (rainfall > 35mm/hr confirmed)
         |
         v
Policy eligibility checked (active policy in affected zone)
         |
         v
Fraud Risk Score computed (GPS, history, behavior)
         |
         v
Payout calculated (tier x disruption severity multiplier)
         |
         v
UPI transfer executed automatically via Razorpay
         |
         v
Worker notified via WhatsApp + push notification
```

**No claim. No form. No delay.**

---

## 💰 Weekly Premium Model

### Protection Tiers

<div align="center">

| Tier | Weekly Premium | Max Weekly Payout | Coverage Ratio |
|:-----|:--------------:|:-----------------:|:--------------:|
| Basic | ₹49 | ₹800 | 16.3x |
| Pro ⭐ | ₹129 | ₹2,000 | 15.5x |
| Max | ₹249 | ₹4,000 | 16.1x |

</div>

### Dynamic Premium Pricing

Premiums recalculate every week based on live signals:

| Factor | Premium Impact |
|:-------|:--------------|
| City risk level | Higher disruption cities → higher base |
| Season (monsoon / pollution) | Surge pricing during high-risk months |
| Worker claim history | Low-claim loyalty → discount applied |
| AI disruption forecast | Real-time probability adjustment |
| Platform activity | Inactive accounts auto-paused |

**Example:** Ravi in Bengaluru during peak monsoon (July) — Pro plan: ₹149 vs. dry season: ₹109.

### Regional Risk Recommendations

| Region | Peak Risk Period | Primary Risk | Recommended Coverage |
|:-------|:----------------:|:------------:|:---------------------|
| Delhi | Oct – Feb | AQI spikes | AQI protection add-on |
| Mumbai | Jun – Sep | Monsoon + flooding | Flood coverage |
| Chennai | Nov – Dec | Cyclone + rain | Rain + cyclone bundle |
| Rajasthan | Apr – Jun | Extreme heat | Heatwave protection |
| Bengaluru | Jun – Sep | Monsoon disruption | Rain + traffic bundle |

---

## 🎯 Parametric Triggers

GigHood monitors multiple real-world signals continuously. Payouts activate automatically when thresholds are crossed.

| Trigger | Threshold | Data Source | Payout Condition |
|:--------|:---------:|:-----------:|:-----------------|
| Heavy Rain | > 35mm/hr | OpenWeatherMap API | Worker in active zone |
| Flood Alert | Warning issued | NDMA API | Zone matches worker location |
| Extreme Heat | Heat index > 44°C | IMD API | Active policy + shift hours |
| Hazardous AQI | AQI > 400 | CPCB API | Worker in affected city |
| Curfew / Bandh | Govt restriction | News APIs + NLP | Zone lockdown confirmed |
| Traffic Shutdown | Critical road closure | Google Maps API | Worker zone impacted |
| Platform Outage | App unavailable | Platform health API | Worker's primary platform |
| Cyclone Warning | Within 100km radius | IMD Cyclone API | Worker in impact radius |

> When multiple triggers activate simultaneously, payouts are **additive up to the weekly maximum**, scaled by a disruption severity multiplier.

---

## 🤖 AI/ML Integration

AI is the operational core of GigHood — every key decision is model-driven.

### ML Module Registry

| Module | Model | Purpose |
|:-------|:-----:|:--------|
| Risk Prediction | XGBoost | Weekly disruption probability per zone |
| Weather Forecasting | LSTM (time-series) | 7-day rainfall, AQI, temperature |
| Premium Pricing | Regression + XGBoost | Dynamic weekly premium computation |
| Fraud Detection | Isolation Forest | Anomaly detection on claims + location |
| Worker Segmentation | K-Means Clustering | Behavior-based risk profiling |
| Payout Optimisation | Reinforcement Learning | Maximise coverage fairness within limits |

### ML Pipeline

```
External APIs (Weather, NDMA, CPCB, Maps)
              |
              v
       Data Ingestion Layer
              |
              v
      Feature Engineering
   (zone · weather · time · history)
              |
              v
      Risk Prediction Model
       (XGBoost — per zone)
              |
              v
       Trigger Detection Engine
   (threshold validation + Redis cache)
              |
              v
       Fraud Scoring Engine
     (Isolation Forest + rule layer)
              |
              v
     Automatic Payout Decision
              |
              v
    Razorpay UPI Settlement
```

### Premium Calculation — AI Workflow

```
1. Extract  →  Worker city, zone, season, platform
2. Forecast →  LSTM generates 7-day weather forecast for zone
3. Retrieve →  Historical disruption data for that zone
4. Score    →  XGBoost disruption probability (0.0 – 1.0)
5. Actuarial→  Map probability to expected payout loss
6. Price    →  base_premium x city_risk x season_multiplier x loyalty_discount
7. Display  →  Final premium shown to worker before payment
```

### Fraud Risk Score (FRS)

| FRS Range | Action |
|:---------:|:-------|
| 0 – 30 | Auto-approve |
| 31 – 55 | Approve + passive monitoring |
| 56 – 70 | Additional verification (OTP / selfie) |
| 71 – 85 | Manual review queue |
| 86 – 100 | Auto-reject, flag for investigation |

### Fraud Signals Detected

| Signal | Detection Method |
|:-------|:----------------|
| GPS spoofing | Trajectory velocity analysis |
| Duplicate accounts | Device fingerprinting + Aadhaar hash |
| Zone hopping | Location history cross-validation |
| Claim surge anomalies | Isolation Forest on cluster behaviour |
| Platform activity mismatch | Cross-reference with platform API data |

### Voice AI Assistant

Workers interact naturally — no reading required.

```
Worker speaks  →  "What happens if it rains tomorrow?"
                         |
                         v
              Speech-to-text transcription
                         |
                         v
          LLM generates plain-language response
          (Claude / GPT-4 + worker profile context)
                         |
                         v
       Text-to-speech in worker's preferred language
```

**Supported languages:** Hindi · Kannada · Tamil · Telugu · English

---

## 📱 Application Workflow

### Worker Onboarding

```
1. Download GigHood app
2. Register: mobile number + Aadhaar OTP
3. Select delivery platform(s)
4. AI generates personalised risk profile
5. Recommended plan shown with regional risk reasoning
6. Worker selects plan + pays via UPI (auto-debit enabled)
7. Policy active — worker protected immediately
```

### Weekly Policy Cycle

```
Monday     →  Premium auto-deducted (UPI mandate)
               Policy active for 7 days

During week →  AI monitors all trigger conditions in real-time
               Threshold breach detected  →  Payout initiated automatically

Sunday     →  Weekly summary sent:
               disruptions covered · payouts made · next week preview
               Option to upgrade / downgrade plan
```

### End-to-End Payout Flow (< 90 seconds)

```
Trigger event detected
  └── Zone mapping: worker GPS matched to disruption zone
  └── Policy check: active policy confirmed
  └── FRS computed: < 30 → auto-approve
  └── Payout = tier amount x severity multiplier
  └── Razorpay UPI transfer initiated
  └── WhatsApp + push notification sent
  └── Total time: < 90 seconds
```

---

## 🏗️ Tech Stack & Architecture

### Technology Stack

| Layer | Technology | Rationale |
|:------|:----------:|:----------|
| Mobile App | React Native | Cross-platform (Android + iOS), single codebase |
| Admin Dashboard | React + Tailwind CSS | Fast, component-driven ops interface |
| API Gateway | Kong / AWS API Gateway | Rate limiting, auth, routing |
| Backend Services | FastAPI (Python) + Node.js | FastAPI for ML; Node.js for real-time events |
| ML Models | XGBoost + PyTorch LSTM | Industry-standard tabular + time-series |
| Database | PostgreSQL + TimescaleDB | Relational + time-series (weather, claims) |
| Cache | Redis | Sub-millisecond trigger detection |
| Payments | Razorpay | UPI, auto-debit mandate, instant settlement |
| Notifications | WhatsApp Business API + FCM | Workers on familiar channels |
| Cloud | AWS (ECS, RDS, S3, Lambda) | Managed, scalable, India region |
| CI/CD | GitHub Actions + Docker | Automated testing + container deployment |

### System Architecture

```
+------------------------------------------------+
|           Gig Worker — Mobile App              |
|              React Native                      |
+--------------------+---------------------------+
                     | HTTPS
                     v
+------------------------------------------------+
|              API Gateway                       |
|      Auth · Rate Limiting · Routing            |
+------+----------+----------+------------------+
       |          |          |          |
       v          v          v          v
 +---------+ +--------+ +--------+ +----------+
 | Policy  | |AI Risk | |Trigger | | Payment  |
 | Engine  | | Engine | |Monitor | | Service  |
 +---------+ +--------+ +---+----+ +----------+
                             |
             +---------------+---------------+
             v               v               v
       +---------+     +----------+    +----------+
       | Weather |     |   NDMA   |    | CPCB/IMD |
       |   API   |     |   API    |    |   API    |
       +---------+     +----------+    +----------+

+------------------------------------------------+
|                 Data Layer                     |
|   PostgreSQL  |  TimescaleDB  |  Redis Cache   |
+------------------------------------------------+
```

### Microservices

| Service | Responsibility |
|:--------|:--------------|
| Policy Engine | Plan management, activation, renewal |
| AI Risk Engine | Risk scoring, premium calculation, ML inference |
| Trigger Monitor | Real-time API polling, threshold evaluation |
| Claim Engine | Payout orchestration, amount calculation |
| Fraud Detection | FRS computation, anomaly flagging |
| Payment Service | Razorpay UPI integration, settlement |
| Notification Service | WhatsApp + FCM push delivery |
| Auth Service | Aadhaar OTP, JWT, device fingerprinting |

---

## 🗓️ Development Plan

### Phase 1 — Ideation & Foundation (Weeks 1–2) ✅ Complete

- [x] Problem research and persona development
- [x] Parametric trigger design and threshold definition
- [x] Weekly premium model and tier structure
- [x] Platform architecture decisions (mobile-first)
- [x] AI/ML module design
- [x] README and repository setup

### Phase 2 — Core Development (Weeks 3–5)

- [ ] Backend API scaffolding (FastAPI + Node.js)
- [ ] Database schema design (PostgreSQL + TimescaleDB)
- [ ] ML pipeline setup (data ingestion + feature store)
- [ ] External API integrations (OpenWeatherMap, NDMA, CPCB, IMD)
- [ ] Trigger detection engine (real-time polling + threshold logic)
- [ ] Basic mobile app screens (onboarding, policy, dashboard)

### Phase 3 — AI/ML Integration (Weeks 6–8)

- [ ] XGBoost risk prediction model (training + deployment)
- [ ] LSTM weather forecasting model
- [ ] Dynamic premium pricing engine
- [ ] Isolation Forest fraud detection model
- [ ] K-Means worker segmentation
- [ ] Fraud Risk Score (FRS) pipeline

### Phase 4 — Payment & Automation (Weeks 9–10)

- [ ] Razorpay UPI integration (one-time + auto-debit mandate)
- [ ] End-to-end claim automation (trigger → fraud score → payout)
- [ ] WhatsApp notification integration
- [ ] Admin dashboard (real-time analytics + manual review queue)

### Phase 5 — Testing & Demo Preparation (Weeks 11–12)

- [ ] End-to-end integration testing
- [ ] Load testing (simulate 10,000 concurrent trigger events)
- [ ] Demo scenario scripting and data seeding
- [ ] Voice AI assistant integration
- [ ] Government scheme discovery module
- [ ] Final submission preparation

---

## 📈 Business Viability

### Market Opportunity

| Metric | Value |
|:-------|:-----:|
| Current gig workforce (India) | 15M+ |
| Projected workforce by 2030 | 23.5M |
| Addressable workers (digital UPI) | 8M |
| Estimated annual market size | ₹6,000+ crore |

### Revenue Streams

| Stream | Model | Description |
|:-------|:-----:|:------------|
| Weekly premiums | B2C subscription | Primary revenue from enrolled workers |
| Platform partnerships | B2B | Swiggy, Zomato white-label integration |
| Insurance APIs | B2B | License trigger engine to other insurers |
| Analytics insights | SaaS | Disruption data sold to urban planners |

### Unit Economics (Pro Tier)

```
Weekly premium:        Rs.129
Expected payout:       Rs.129 x 65% loss ratio  =  Rs.83.85
Operating cost/user:   Rs.15
Gross margin/worker:   Rs.30.15 per week

At 100,000 active workers  →  Rs.3 crore+ gross margin per week
```

---

## 📁 Repository Structure

```
gighood/
├── README.md
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   ├── mobile/              # React Native app
│   └── dashboard/           # React admin dashboard
├── services/
│   ├── api-gateway/
│   ├── policy-engine/
│   ├── ai-risk-engine/
│   ├── trigger-monitor/
│   ├── claim-engine/
│   ├── fraud-detection/
│   └── payment-service/
├── ml/
│   ├── models/
│   │   ├── risk_prediction/
│   │   ├── weather_forecast/
│   │   ├── fraud_detection/
│   │   └── premium_pricing/
│   ├── pipelines/
│   └── notebooks/
└── infra/
    ├── terraform/
    └── kubernetes/
```

## ⚡ Getting Started

```bash
# Clone the repository
git clone https://github.com/your-repo/gighood

# Navigate to project root
cd gighood

# Start all services via Docker
docker-compose up

# Endpoints
# Backend API         →  http://localhost:8000
# Admin Dashboard     →  http://localhost:3000
# API Documentation   →  http://localhost:8000/docs
```

---

## 👥 Team

<div align="center">

**GigHood — Guidewire DEVTrails Hackathon 2026**

*Building the future of financial protection for India's gig workers through AI-powered parametric income insurance.*

</div>

<br/>

<table align="center">
<tr>
<td align="center" width="160">
<img src="https://api.dicebear.com/7.x/initials/svg?seed=VG&backgroundColor=0f4c81&textColor=ffffff" width="64" height="64" style="border-radius:50%"/>
<br/><b>Vishnu Gupta</b>
<br/><sub>Team Leader</sub>
</td>
<td align="center" width="160">
<img src="https://api.dicebear.com/7.x/initials/svg?seed=AK&backgroundColor=0f6e56&textColor=ffffff" width="64" height="64" style="border-radius:50%"/>
<br/><b>Abhay Kumar</b>
<br/><sub>Team Member</sub>
</td>
<td align="center" width="160">
<img src="https://api.dicebear.com/7.x/initials/svg?seed=AA&backgroundColor=534ab7&textColor=ffffff" width="64" height="64" style="border-radius:50%"/>
<br/><b>Ananya Agarwal</b>
<br/><sub>Team Member</sub>
</td>
<td align="center" width="160">
<img src="https://api.dicebear.com/7.x/initials/svg?seed=KS&backgroundColor=993c1d&textColor=ffffff" width="64" height="64" style="border-radius:50%"/>
<br/><b>Krishna Somani</b>
<br/><sub>Team Member</sub>
</td>
<td align="center" width="160">
<img src="https://api.dicebear.com/7.x/initials/svg?seed=PK&backgroundColor=854f0b&textColor=ffffff" width="64" height="64" style="border-radius:50%"/>
<br/><b>Praveen Kumar</b>
<br/><sub>Team Member</sub>
</td>
</tr>
</table>

---

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=15&pause=2000&color=38BDF8&center=true&vCenter=true&width=700&lines=Predict.+Protect.+Pay.+Instantly.;Built+for+the+backbone+of+India's+economy.;GigHood+%E2%80%94+Because+every+delivery+matters." alt="Footer Typing SVG"/>

<br/>

![Made in India](https://img.shields.io/badge/Made%20with%20%E2%9D%A4%EF%B8%8F%20in-India-ff9933?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-22c55e?style=for-the-badge)
![MIT License](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f3060,50:0a2040,100:060f1e&height=120&section=footer" width="100%"/>

</div>
