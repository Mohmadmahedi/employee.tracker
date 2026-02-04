# How to Deploy Backend to a New Render Server

Since your project is already connected to GitHub (`https://github.com/Mohmadmahedi/employee.tracker.git`), follow these steps to deploy to a new Render server.

## Step 1: Push Latest Changes to GitHub
First, we need to save the recent fixes (database migration, linting config) to GitHub so Render can see them.

Run these commands in your terminal:
```bash
git add .
git commit -m "Fix database schema and add eslint config"
git push origin main
```

## Step 2: Create New Web Service on Render
1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository: `Mohmadmahedi/employee.tracker`.
4.  Give it a unique **Name** (e.g., `attendance-backend-v2`).
5.  **Important Details**:
    *   **Root Directory**: `attendance/backend-server` (This is critical because your backend is in a subfolder).
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`

## Step 3: Configure Environment Variables
On the Render setup page, scroll down to **Environment Variables**. You MUST copy these values from your `backend-server/.env` file.

| Key | Value (Example/Copy from your .env) |
|-----|-------------------------------------|
| `DB_HOST` | `employee-tracker-employee-tracker.d.aivencloud.com` |
| `DB_PORT` | `21409` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | `YOUR_AVNS_PASSWORD_HERE` |
| `DB_NAME` | `defaultdb` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | (Copy from .env) |
| `CORS_ORIGIN` | `*` |
| `NODE_ENV` | `production` |

*Note: You don't need to copy `PORT` (Render sets this automatically).*

Click **Create Web Service**. Wait for the deployment to finish. It should show a green "Live" badge.

## Step 4: Update Desktop App
Once the new server is live, Render will give you a URL like `https://attendance-backend-v2.onrender.com`.

1.  Open `attendance/desktop-app/.env` on your computer.
2.  Update the URLs with your NEW Render URL:
    ```env
    VITE_API_URL=https://attendance-backend-v2.onrender.com/api
    VITE_SOCKET_URL=https://attendance-backend-v2.onrender.com
    ```
3.  Test the connection by running `node verify_remote.js`.
