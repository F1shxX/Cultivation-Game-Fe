# Cultivation Game Frontend

Vite/React frontend for the cultivation game demo. It talks to the backend API instead of connecting to Supabase with privileged keys.

Current demo flow:

- Opening story scene
- Lushi Sect home scene
- Cultivation, alchemy, planting, forging actions
- Mouse cave battle stub
- Supabase-backed demo save sync through the backend

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

## Environment

```env
VITE_API_BASE_URL=http://localhost:3001
```
