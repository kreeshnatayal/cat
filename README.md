# CAT OS: The High-Performance Preparation Engine

## The Core Philosophy
Most exam preparation tools are built like passive spreadsheets or generic habit trackers. They ask you what you did, and they chart the hours. 

**CAT OS is fundamentally different.** It is not a tracker; it is an active **Performance System** built specifically for a high-functioning professional (AI/PM builder) preparing for the Common Admission Test (CAT). It operates on the philosophy that **consistency, cognitive energy management, and strategic outcomes matter exponentially more than sheer hours logged.**

It enforces a specific lifestyle and preparation doctrine:
1. **Outcome-Based Execution**: You don't track "hours studied." You track Minimum Viable Days (MVDs) based on concrete outputs (e.g., 5 QA, 1 DILR, 1 RC).
2. **Cognitive Energy Management**: It strictly delineates high-energy morning work from low-energy evening work and prevents burnout spirals.
3. **Cinematic Minimalism**: The UI is designed with a dark, elite, mission-control aesthetic to evoke intense focus and a "high-performance operator" identity.

---

## Technical Architecture

The application is a fully client-side, highly responsive web application built with **Next.js (App Router)** and **React**.

### 1. Data Layer (Zustand + Local Storage)
The entire intelligence of the OS lives in the browser, ensuring absolute privacy, zero latency, and offline capability. We use `zustand` with `persist` middleware to manage state.

- **`systemStore.ts`**: The Gamification and Rules engine. It tracks the user's psychological state (`MentalState`), current progression level (Initiate → Performance), and injects the "Weekly Battle" (the primary psychological goal for the current week based on a hardcoded timeline).
- **`plannerStore.ts`**: The Execution engine. It records daily logs. Instead of tracking hours, it strictly measures whether the daily MVD constraints were met, preventing 0-day spirals.
- **`revisionStore.ts`**: The Knowledge Base. It contains the exact, hardcoded CAT 2026 syllabus across QA, DILR, and VARC. It implements a spaced-repetition logic, tracking retention levels (1-5) and flagging topics when they are due for revision.
- **`mockStore.ts`**: The Intelligence engine. It tracks full-length mock scores, computes running percentiles, and houses a decoupled `MistakeLog` to track behavioral errors (Silly, Panic, Conceptual) independently of the tests.
- **`roadmapStore.ts`**: The Strategic Blueprint. It holds the phase-by-phase chronological roadmap, dictating when the user should shift from "Concept Building" to "Mock Intensive."

### 2. UI/UX Layer (Framer Motion + Tailwind CSS + Recharts)
The visual identity is strict: "Dark Academia meets Startup OS."

- **Layout System**: A persistent Sidebar (`Shell.tsx`) navigates between the Dashboard, Planner, Knowledge Base, Mock Analytics, and Strategy Roadmap.
- **Animations**: `framer-motion` is used extensively for micro-interactions. Every card load, tab switch, and progress circle fill feels smooth, deliberate, and premium.
- **Data Visualization**: `recharts` powers the Analytics dashboard, rendering Area Charts for MVD consistency, Radar Charts for sectional accuracy, and GitHub-style heatmaps to visualize daily momentum.
- **Responsiveness**: The entire application uses fluid Tailwind CSS grids (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`), ensuring the mission-control dashboard scales perfectly from a 4K monitor down to a mobile device.

---

## The 5 Core Modules

### 1. The Dashboard (`/`)
The nerve center. It provides an immediate read on the user's momentum.
- Calculates and displays the current **Gamification Level** based on streak consistency and mock percentiles.
- Displays the **Weekly Battle** (e.g., "Geometry Visualization").
- Features an **Anti-Burnout Protocol**: If recent execution logs detect a "Burnt Out" or "Anxious" mental state, the UI triggers a massive red shield warning, forcibly locking down aggressive prep and mandating passive revision and rest.

### 2. The Execution Board (`/planner`)
The daily workspace. It is split into **High Energy (Morning)** and **Low Energy (Evening)** zones.
- The user must check off their strict MVD targets (RCs, QA, DILR). The progress ring only completes when all minimums are met.
- It tracks the user's side-project hours (AI/PM tasks) and warns them if they exceed the cognitive budget (1hr weekday / 3hr weekend), preventing context-switching fatigue.

### 3. The Knowledge Base (`/revision`)
A granular syllabus tracker. 
- Every CAT topic is pre-loaded. The user marks topics based on retention, and the OS automatically calculates when a concept is "Due for Revision" using time-decay algorithms.

### 4. Mock Intelligence (`/mocks`)
Beyond just logging scores, this module visualizes accuracy rates via Radar Charts. It allows the user to log specific psychological or execution failures (e.g., "Timing," "Panic," "Selection") into a global Mistake Database to spot recurring behavioral flaws.

### 5. The Strategic Blueprint (`/roadmap`)
A dynamic reading of the master plan. It reads the current date and highlights exactly which Phase the user is in (e.g., "Concept Building" vs. "Mock Intensive"), displaying the specific hourly expectations and mock frequency constraints for that period.

---

## Getting Started

First, install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Summary
CAT OS is a psychological guardrail built in code. By hardcoding the syllabus, enforcing MVDs over hours, and visualizing momentum through a sleek, dark interface, it transforms the exhausting grind of competitive exam prep into a disciplined, data-driven, and highly engaging operational mission.
