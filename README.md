# 🏢 Career Citadel — 3D Multi-Agent World

An immersive 3D virtual office world powered by **Three.js (React Three Fiber)** and a team of **5 specialized AI agents** dedicated to end-to-end career intelligence.

---

## 👥 The 5 Specialized Agents

| Room / Zone | Agent | Role | Specialization |
| :--- | :--- | :--- | :--- |
| **1. The Mirror Atrium** | 🌟 **Veena** | Concierge & Navigator | Profile configuration, telemetry, and room routing. |
| **2. The Diagnostic Vault** | 🔍 **Babu** | Forensic ATS Auditor | Real client-side PDF stream text extraction & ATS scoring. |
| **3. The War Room (Tech)** | 💻 **Ravi** | Staff Technical Architect | Progressive technical interview questions & architecture critique. |
| **4. The War Room (HR)** | 🧠 **Radha** | Behavioral & Leadership Lead | STAR situational questions, conflict management, and empathy. |
| **5. The Quantum HoloDeck**| 🧭 **Radha** | Timeline Strategist | "What-If" career pivots & salary/fit score forecasting. |
| **6. The Corner Office** | ⚡ **Harsha** | Brutal Executive Partner | Uncompromising, high-standards reality check & 90-day action plan. |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Configure Free Groq API Key
* Click **API Key** in the top navigation bar.
* Paste your free key from [console.groq.com/keys](https://console.groq.com/keys).

---

## 🛠️ Tech Stack
* **3D Engine**: Three.js, React Three Fiber, Drei, Smooth Camera Lerping
* **UI & HUD**: React 18, Tailwind CSS, Lucide Icons, Glassmorphism
* **Resume Engine**: `pdfjs-dist` (Real client-side PDF text extraction)
* **Agent Intelligence**: Groq Cloud (`llama-3.3-70b-versatile` with JSON schema enforcement)
* **Voice Engine**: Browser Web Speech API with custom persona pitch & speech rates
