# Development Environment Setup

This project uses environment variables for secure API key handling.

## Initial Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Fill in your real API keys in the newly created `.env` file. These values are local to your machine and will NOT be tracked by Git.

## Environment Variables

- `VITE_GEMINI_KEY`: Your Google AI Studio (Gemini) API key.
- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Project Anon (Public) Key.

## Git Security Note

The `.env` file is ignored by Git to prevent accidental leakage of secrets. 
If you accidentally added `.env` to Git, run the following to remove it from tracking:
```bash
git rm --cached .env
```
