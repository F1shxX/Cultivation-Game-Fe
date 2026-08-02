# 万化仙途 Frontend

Vite/React frontend for the 万化仙途 demo. It talks to the backend API instead of connecting to Supabase with privileged keys.

Current demo flow:

- Ink-painting title menu and six-step character creation
- Entry CG and fixed horizontal Lushi Sect home scenes
- Character, inventory, equipment, method, and spell panels
- 29-event opportunity journal, including two complete dialogue/combat events
- Full-screen planting, alchemy, equipment forging, and treasure tempering systems
- Top-down bullet-hell combat with battle-locked method and spell loadouts
- Supabase-backed profile, progression, inventory, garden, and equipment saves

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

The local frontend runs at `http://localhost:5173/`. Production builds use the `/wanhua/` base path.

## Environment

```env
VITE_API_BASE_URL=http://localhost:3001
```
