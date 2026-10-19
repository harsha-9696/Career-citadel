# Career Citadel - Agent Operating Guide

## Agent skills

### Issue tracker

Local markdown in `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`GLOSSARY.md` + `docs/adr/`). See `docs/agents/domain.md`.

---

## Project Overview

Career Citadel is an interactive 3D virtual headquarters where candidates prepare for high-stakes tech careers with specialized AI counselors (Babu, Ravi, Harsha, Radha, Veena) powered by Groq and unified by the Citadel Brain shared memory system.

### Tech Stack
- **Framework**: React 18 + Vite + TypeScript (strict mode)
- **3D Engine**: Three.js + @react-three/fiber + @react-three/drei
- **AI Backend**: Groq API (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`)
- **Document Processing**: `pdfjs-dist` (client-side PDF extraction)
- **Audio**: Web Audio API (procedural spatial sound synthesis)
