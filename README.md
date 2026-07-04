# Citizen Services & Municipal Intelligence Platform (CSMIP)

## Local database

The backend uses PostgreSQL through Prisma. Start a local database with:

```bash
docker compose up -d db
```

Then copy `backend/.env.example` to `backend/.env` and keep `DATABASE_URL` pointed at the Postgres container.

## GitHub Pages deployment

The frontend is wired for GitHub Pages deployment through `.github/workflows/deploy-github-pages.yml`.

On every push to `main`, the workflow builds `app/frontend` and publishes the static site to the `gh-pages` branch.

If you want the deployed site to talk to a public backend, set `VITE_BACKEND_URL` in the workflow to your hosted API URL and make sure that backend allows the GitHub Pages origin in `CORS_ORIGIN`.

## Local development

Frontend:

```bash
cd app/frontend
npm run dev
```

Backend:

```bash
cd backend
npm start
```
