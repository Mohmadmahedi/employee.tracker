# 🚀 Deployment Guide: Employee Monitoring System

This guide covers how to deploy the **Backend Server** to the cloud and how to build the **Desktop Application** for distribution.

---

## Part 1: Backend Deployment (Cloud)

We will use **Render.com** (easiest) or a **VPS** (Ubuntu).
**Requirement:** You need a **MySQL Database**.

### Option A: Deploy on Render.com (Recommended)

1.  **Push Code to GitHub**
    *   Upload your entire project folder (`attendance`) to a private GitHub repository.

2.  **Create Database (MySQL)**
    *   Render does not offer free MySQL. You can use **Aiven** (free tier) or **PlanetScale**.
    *   **Goal:** Get a `DATABASE_URL` or Host/User/Pass credentials.
    *   *Alternative:* If you have a VPS, install MySQL there.

3.  **Create Web Service**
    *   Go to [Render Dashboard](https://dashboard.render.com/).
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub repo.
    *   **Root Directory:** `backend-server`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
    *   **Environment Variables** (Add these):
        *   `PORT`: `10000` (Render default)
        *   `DB_HOST`: (your mysql host)
        *   `DB_USER`: (your mysql user)
        *   `DB_PASSWORD`: (your mysql password)
        *   `DB_NAME`: `employee_monitoring`
        *   `DB_PORT`: `3306`
        *   `JWT_SECRET`: (some random long password)

4.  **Deploy**
    *   Click **Create Web Service**.
    *   Wait for it to show "Live".
    *   Copy your backend URL (e.g., `https://your-app.onrender.com`).

---

## Part 2: Desktop App Build (Windows .exe)

Now that the backend is live, we need to connect the desktop app to it and build the installer.

### 1. Update Configuration
Open `desktop-app/.env` and update the URLs to point to your **new cloud backend**:

```ini
# desktop-app/.env
VITE_API_URL=https://your-app.onrender.com/api
VITE_SOCKET_URL=https://your-app.onrender.com
```

### 2. Build the Installer
Open your terminal in VS Code:

```bash
cd desktop-app
npm run dist
```

### 3. Locate the Installer
Once the process finishes (approx. 2-5 mins), go to:
`desktop-app/release/`

You will see:
*   **`Employee Tracker Setup 1.0.0.exe`** (or similar name)

### 4. Distribute
*   **For Employees:** Send them the `.exe` file. Ask them to install it. It will auto-launch and hide itself.
*   **For Admin:** Install the same `.exe`. Login with your Admin credentials to access the dashboard.

---

## 🔒 Important Security Note (WebRTC)
Since we upgraded to **WebRTC Live Streaming**, your backend **MUST** be served over **HTTPS** (Secure).
*   ✅ **Render.com** provides HTTPS automatically.
*   ❌ If you use a basic IP address (VPS) without SSL, the video stream and screen recording **WILL NOT WORK**.

## 🛠 Troubleshooting

**App shows "Network Error" or Login fails:**
1.  Check if the Backend on Render is "Active".
2.  Check the "Logs" tab in Render for database connection errors.
3.  Ensure your `DB_HOST` allows connections from the cloud (Whitelist IP `0.0.0.0/0` if using a managed DB).

**Live Stream is black/loading:**
1.  Ensure you are using the HTTPS URL in the `.env` file.
2.  Employees might need to allow "Screen Recording" permission on their OS (mostly Mac, but sometimes Windows requires it).
