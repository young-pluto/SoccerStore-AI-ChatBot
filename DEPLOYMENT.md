# Deployment Guide for 11Yards AI Support Agent

Since this application has two distinct parts (a React frontend and a Node.js backend with specific database requirements), **Vercel alone is NOT recommended for the backend**.

## Why not Vercel for the backend?

Your backend uses SQLite (`chat.db`), which writes data to the local file system. Vercel Serverless Functions have a **read-only file system** (except for `/tmp`, which is wiped after execution). This means your database would disappear every time the server sleeps or restarts!

## Recommended Setup

- **Frontend**: **Vercel** (Excellent for React/Vite/static sites)
- **Backend**: **Render** (Offers Node.js services with persistent disks)

---

## Part 1: Deploy Backend to Render

1.  Push your code to a GitHub repository (if you haven't already).
2.  Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Configuration**:

    - **Name**: `11yards-backend`
    - **Root Directory**: `backend` (Important! This tells Render the app is in the subfolder)
    - **Environment**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm start`
    - **Plan**: Free (Note: Sleep mode causes 50s delay on first request)

5.  **Environment Variables** (Add these in the dashboard):

    - `OPENAI_API_KEY`: `your-key-here`
    - `FRONTEND_URL`: `https://your-vercel-frontend-url.vercel.app` (You can add this _after_ deploying frontend)
    - `NODE_VERSION`: `18` (or higher)

6.  **Persistent Disk (Crucial for SQLite)**:

    - On the Free Tier, Render **does not persist files** after restarts.
    - **Solution**: For a demo, you might accept that data resets on deployment.
    - **Better Solution (Paid)**: Add a "Disk" in Render settings (`/var/data`) and change your DB path to use it.
    - **Alternative**: Use a hosted database like Turso (LibSQL) or migrate to PostgreSQL (Supabase/Neon) if you need free persistence.
    - _For this assignment, standard standard ephemeral storage is likely fine for the demo._

7.  Click **Create Web Service**.
8.  **Copy your Backend URL** (e.g., `https://11yards-backend.onrender.com`).

---

## Part 2: Deploy Frontend to Vercel

1.  Go to [vercel.com](https://vercel.com/) and **Add New Project**.
2.  Import the **Same GitHub Repository**.
3.  **Configuration**:
    - **Framework Preset**: Vite
    - **Root Directory**: `frontend` (Click Edit and select the folder)
4.  **Environment Variables**:

    - `VITE_API_URL`: `https://11yards-backend.onrender.com` (Paste your Render Backend URL here)
      - _Note: Remove the trailing slash `/` if present._

5.  Click **Deploy**.

---

## Part 3: Final Wiring

1.  Once Vercel finishes, copy the new **Frontend URL** (e.g., `https://11yards-frontend.vercel.app`).
2.  Go back to **Render Dashboard** -> **Environment**.
3.  Update/Add `FRONTEND_URL` = `https://11yards-frontend.vercel.app`.
4.  **Redeploy** the backend (Manual Deploy -> Clear build cache & deploy) to apply the CORS change.

## Verification

1.  Open your Vercel URL.
2.  Send a message.
3.  **Troubleshooting**:
    - If chat doesn't load: Check Browser Console (F12) -> Network Tab. Look for red failed requests.
    - If "CORS error": Use `curl` to check if `FRONTEND_URL` is set correctly on backend.
    - If "503 Service Unavailable" on first load: Render free tier is waking up. Wait 1 min.
