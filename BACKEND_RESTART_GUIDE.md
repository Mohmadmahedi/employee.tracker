# 🔴 BACKEND SERVER NOT RUNNING - Fix Guide

## Problem
The Settings page shows "Network Error" because the backend server at `http://localhost:5000` is not responding.

## Root Cause
The backend Node.js server has stopped or crashed.

---

## ✅ SOLUTION: Restart Backend Server

### Option 1: Use Existing Terminal

If you still have the terminal where you ran `npm run dev`:

1. **Check if it's still running**
   - Look for: `[nodemon] watching extensions: js,mjs,cjs,json`
   - Or: `🚀 Server running on port 5000`

2. **If it crashed or stopped:**
   ```bash
   # Press Ctrl+C to stop (if needed)
   # Then restart:
   npm run dev
   ```

3. **Wait for:**
   ```
   ✓ Database connected successfully
   ==================================================
   🚀 Server running on port 5000
   📊 Environment: development
   🌐 API URL: http://localhost:5000
   ==================================================
   ```

---

### Option 2: Open New Terminal

If you closed the terminal:

1. **Open PowerShell**

2. **Navigate and start:**
   ```bash
   cd C:\Users\Admin\Desktop\attendance\backend-server
   npm run dev
   ```

3. **Wait for server to start** (same output as above)

---

## Verify Server is Running

### Test 1: Health Check
```bash
# In a new PowerShell window:
Invoke-RestMethod http://localhost:5000/api/health
```

**Expected:**
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": 123
}
```

### Test 2: Browser
Open: http://localhost:5000/api/health

**Expected:** JSON response with status "OK"

---

## After Backend Starts

1. **Verify backend is running:**
   - Terminal shows: `🚀 Server running on port 5000`
   - Health check returns OK

2. **Go back to dashboard:**
   - URL: http://localhost:3000
   
3. **Refresh the page:**
   - Press `Ctrl + F5` (hard refresh)
   
4. **Login again:**
   - Email: `admin@company.com`
   - Password: `Admin@123`

5. **Navigate to Settings:**
   - Click "Settings" in sidebar
   - Settings should load successfully!

---

## Common Issues

### Issue 1: Port 5000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Fix:**
```bash
# Find process using port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Kill the process
Stop-Process -Id <PID> -Force

# Restart backend
npm run dev
```

---

### Issue 2: Database Connection Failed

**Error:**
```
✗ Database connection failed: Access denied
```

**Fix:**
Check `.env` file has correct MySQL password:
```bash
notepad backend-server\.env
```

Make sure `DB_PASSWORD` is set correctly.

---

### Issue 3: Missing Dependencies

**Error:**
```
Error: Cannot find module 'express'
```

**Fix:**
```bash
cd backend-server
npm install
npm run dev
```

---

## Keep Backend Running

**Important:** The backend server must keep running for the dashboard to work!

**Two terminals needed:**
1. **Terminal 1:** Backend server (`backend-server` folder)
   ```bash
   cd backend-server
   npm run dev
   ```

2. **Terminal 2:** Frontend dashboard (`desktop-app` folder)
   ```bash
   cd desktop-app
   npm run dev
   ```

Both must run simultaneously!

---

## Quick Commands

```bash
# Start backend (Terminal 1)
cd C:\Users\Admin\Desktop\attendance\backend-server
npm run dev

# Start frontend (Terminal 2)
cd C:\Users\Admin\Desktop\attendance\desktop-app
npm run dev

# Test backend health (Terminal 3)
Invoke-RestMethod http://localhost:5000/api/health
```

---

## Expected Terminal Output

### Backend (Terminal 1):
```
[nodemon] 3.0.2
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node src/server.js`
✓ Database connected successfully
==================================================
🚀 Server running on port 5000
📊 Environment: development
🌐 API URL: http://localhost:5000
==================================================
```

### Frontend (Terminal 2):
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

## After Fix

✅ Backend running on port 5000
✅ Frontend running on port 3000
✅ Can login to dashboard
✅ Settings page loads without errors
✅ Can view and modify 20+ settings

---

## Prevention

To avoid this in the future:

1. **Keep both terminals open** while working
2. **Don't close terminals** accidentally
3. **If backend crashes**, check the error and restart
4. **Watch for error messages** in backend terminal

---

## Still Not Working?

### Check Logs
```bash
# View backend logs
type backend-server\logs\combined.log
type backend-server\logs\error.log
```

### Check Processes
```bash
# See if Node is running
Get-Process node
```

### Restart Everything
```bash
# Close all terminals
# Open 2 new terminals
# Start backend in Terminal 1
# Start frontend in Terminal 2
```

---

**Bottom Line:** Just restart the backend server with `npm run dev` and everything should work! 🚀
