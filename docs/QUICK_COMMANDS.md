# 🚀 QUICK START - Running the System

## Every Time You Start Working

You need **TWO terminals** running simultaneously:

---

## Terminal 1: Backend Server

```powershell
# Navigate to backend
cd C:\Users\Admin\Desktop\attendance\backend-server

# Start server
npm run dev
```

**Expected Output:**
```
✓ Database connected successfully
==================================================
🚀 Server running on port 5000
📊 Environment: development
🌐 API URL: http://localhost:5000
==================================================
```

**Leave this terminal open!**

---

## Terminal 2: Frontend Dashboard

```powershell
# Navigate to frontend
cd C:\Users\Admin\Desktop\attendance\desktop-app

# Start dashboard
npm run dev
```

**Expected Output:**
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Leave this terminal open!**

---

## Access the System

1. **Open browser:** http://localhost:3000

2. **Login:**
   - Email: `admin@company.com`
   - Password: `Admin@123`

3. **Navigate to Settings** (sidebar)

4. **Control 20+ settings!**

---

## If Backend Crashes

In the backend terminal:
```powershell
# Press Ctrl+C
# Then restart:
npm run dev
```

---

## If You Get "Network Error"

✅ Check backend is running (Terminal 1)
✅ Check for: "🚀 Server running on port 5000"
✅ Test: http://localhost:5000/api/health
✅ Restart if needed: `npm run dev`

---

## Full System Check

```powershell
# Test backend
Invoke-RestMethod http://localhost:5000/api/health

# Should return:
# status: OK
```

---

## Stop Everything

```powershell
# In each terminal:
Ctrl + C

# Or close both terminals
```

---

## Quick Commands

```powershell
# Start backend (Terminal 1)
cd C:\Users\Admin\Desktop\attendance\backend-server; npm run dev

# Start frontend (Terminal 2)
cd C:\Users\Admin\Desktop\attendance\desktop-app; npm run dev
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend won't start | Check `.env` file, MySQL running |
| Database error | Verify MySQL password in `.env` |
| Port 5000 in use | Kill process: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess` |
| Login fails | Check `FIX_LOGIN.md` |
| Settings won't load | Restart backend |

---

**Remember:** Both terminals must stay open while working! 🚀
