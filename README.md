# Wholesale Banking Customer Onboarding & Loan Origination System
## Action Plan Tracker & Executive Follow-up System (Commercial Bank of Ethiopia)

A high-performance, enterprise-grade project management dashboard and automated executive follow-up platform tailored for tracking 44 master deliverables, team workloads, risk escalations, and steering committee briefings across wholesale banking workstreams.

---

## 🌟 Key Features

- **44 Master Deliverables Tracking**: Real-time Gantt, list, and high-density mobile card views with dynamic progress calculation against the August 18, 2026 baseline.
- **AI Executive Intelligence (Gemini 2.5 / 3.7)**:
  - Automated SteerCo briefing generation & RAG assessment.
  - Hidden risk scanner detecting early friction points and technical debt before delays occur.
  - Multi-tier escalation email & WhatsApp reminder generator.
  - Natural-language Q&A assistant for instant deliverable inquiries.
- **Enterprise Reports & Exports**: 1-click export to Excel (.xlsx), PDF with executive styling, and PowerPoint (.pptx).
- **Mobile & iOS Responsive**:
  - Full mobile-first layout with smooth horizontal workstream navigation, quick action drawer, and 1-tap status selector.
  - Native iOS Capacitor container ready for Xcode (`ios/App`).
- **Cloud & Cloud SQL Sync**: Integrated PostgreSQL / Cloud SQL database sync with automatic fallback and remote endpoint replication.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
DATABASE_URL="postgresql://user:password@host:5432/cbe_action_tracker" # Optional for Postgres
PORT=3000
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Mobile & iOS Deployment

### Running in Mobile Safari / Android Chrome
Access your computer's local IP address displayed in the terminal (e.g. `http://192.168.1.6:3000`) over Wi-Fi.

### Native iOS App (Capacitor)
To build and sync the native iOS project:
```bash
npm run build:ios
```
Open `ios/App/App.xcworkspace` in Xcode on macOS to run on iOS Simulator or deploy to physical iPhone/iPad.

---

## ☁️ 24/7 Cloud Deployment (Render.com)

1. Connect this GitHub repository on **[render.com](https://render.com)**.
2. Select **Web Service**:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Environment Variables**: `GEMINI_API_KEY`
3. Click **Deploy Web Service** to get a permanent live HTTPS URL worldwide.
