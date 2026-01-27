# ⚡ QUICK START GUIDE

## Get Running in 10 Minutes

### Step 1: Database (2 minutes)

```bash
# Start MySQL
# Windows: Start MySQL service from Services

# Create database
mysql -u root -p

# Inside MySQL:
source C:/Users/Admin/Desktop/attendance/backend-server/database/schema.sql

# Create admin user (replace hash with actual bcrypt hash)
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (UUID(), 'admin@company.com', '$2b$10$HASH_HERE', 'Admin', 'SUPER_ADMIN');

exit;
```

**Generate Password Hash:**
```javascript
// Use online tool: https://bcrypt-generator.com/
// Input: Admin@123
// Rounds: 10
// Copy the hash
```

---

### Step 2: Backend Server (3 minutes)

```bash
# Navigate
cd C:\Users\Admin\Desktop\attendance\backend-server

# Install
npm install

# Create .env file
copy env.example.txt .env

# Edit .env (minimum config):
```

**.env (Minimal)**
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=employee_monitoring

JWT_SECRET=change_this_secret_key_12345
JWT_REFRESH_SECRET=change_this_refresh_key_67890

ADMIN_MASTER_PASSWORD=MasterPass123!

CORS_ORIGIN=http://localhost:3000
```

```bash
# Start server
npm run dev

# You should see:
# ✓ Database connected successfully
# 🚀 Server running on port 5000
```

---

### Step 3: Admin Dashboard (3 minutes)

```bash
# Navigate
cd C:\Users\Admin\Desktop\attendance\desktop-app

# Install
npm install

# Start
npm run dev

# Opens: http://localhost:3000
```

---

### Step 4: Login & Control (2 minutes)

1. **Login**
```
URL: http://localhost:3000
Email: admin@company.com
Password: Admin@123
```

2. **Go to Settings**
```
Click: Settings (left sidebar)
```

3. **Change Any Setting**
```
Example:
- Find "Screenshot Interval"
- Change from 30 to 45 minutes
- Click "Save All Changes"

✅ Setting saved!
✅ All employee apps would receive this update in < 5 seconds
```

4. **View History**
```
Settings → History tab
- See all changes
- Who changed what
- When it happened
```

---

## 🎯 Test Admin Control

### Test 1: Global Setting
```
Settings → Screenshot → Interval: 30 → 60
Save → Check database
```

**Verify:**
```sql
USE employee_monitoring;
SELECT setting_key, setting_value FROM global_settings 
WHERE setting_key = 'screenshot_interval';
-- Should show: 60
```

### Test 2: Change History
```
Settings → History
-- Should show your change
```

**Verify:**
```sql
SELECT * FROM config_history 
ORDER BY created_at DESC LIMIT 1;
-- Should show: old_value=30, new_value=60
```

### Test 3: Bulk Update
```
Settings → Change multiple settings:
- Screenshot Interval: 45
- Screenshot Quality: 80
- Heartbeat Interval: 10

Save All → Check database
```

**Verify:**
```sql
SELECT setting_key, setting_value FROM global_settings 
WHERE setting_key IN ('screenshot_interval', 'screenshot_quality', 'heartbeat_interval');
-- Should show all new values
```

---

## 🔍 Verify System

### Check Backend
```bash
curl http://localhost:5000/api/health

# Response:
{
  "status": "OK",
  "timestamp": "2026-01-03T...",
  "uptime": 123
}
```

### Check Database
```sql
-- Settings count
SELECT COUNT(*) FROM global_settings;
-- Should be 20+

-- Admin users
SELECT email, full_name, role FROM admin_users;

-- Tables
SHOW TABLES;
-- Should show 13 tables
```

### Check WebSocket
```javascript
// In browser console (http://localhost:3000)
// Open DevTools → Network → WS

// Should see:
ws://localhost:5000/socket.io/?...
Status: 101 Switching Protocols
```

---

## 📊 Available Settings

Once logged in, you can control:

### Screenshot (5 settings)
- Enable/disable
- First delay
- Interval
- Quality
- Active only

### Monitoring (4 settings)
- Enable/disable
- Idle threshold
- Heartbeat interval
- Screen lock detection

### Security (4 settings)
- Tamper protection
- Uninstall protection
- File integrity check
- Process watchdog

### Integration (4 settings)
- Google Sheets sync
- Sync interval
- Monthly emails
- Email day

### Working Hours (3 settings)
- Work day hours
- Enable overtime
- Auto logout

**Total: 20+ settings** - All controllable from admin dashboard!

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check MySQL
mysql -u root -p -e "SELECT 1"

# Check port
netstat -ano | findstr :5000

# Check logs
type backend-server\logs\combined.log
```

### Dashboard won't load
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check port
netstat -ano | findstr :3000

# Restart
Ctrl+C
npm run dev
```

### Can't login
```sql
-- Check admin user
USE employee_monitoring;
SELECT * FROM admin_users WHERE email = 'admin@company.com';

-- If not exists, create one
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (UUID(), 'admin@company.com', '$2b$10$HASH', 'Admin', 'SUPER_ADMIN');
```

### Settings not saving
```bash
# Check backend logs
type backend-server\logs\error.log

# Check database connection
# Check admin token in localStorage (DevTools → Application → Local Storage)
```

---

## 🎯 What You Can Do Now

✅ **Login to admin dashboard**
✅ **View all settings** (20+ configurable options)
✅ **Change any setting** (screenshot interval, monitoring, etc.)
✅ **Save changes** (bulk or individual)
✅ **View change history** (full audit trail)
✅ **Export settings** (backup to JSON)
✅ **Import settings** (restore from backup)

### Coming Next:
- [ ] Employee desktop application (Windows service)
- [ ] Real-time config sync to desktop apps
- [ ] Google Sheets integration
- [ ] Screenshot capture
- [ ] Live monitoring
- [ ] Monthly email reports

---

## 📁 Project Structure

```
C:\Users\Admin\Desktop\attendance\
├── backend-server\          ← Node.js API (DONE ✅)
│   ├── src\
│   │   ├── server.js
│   │   ├── controllers\     ← Settings controller ⭐
│   │   ├── routes\
│   │   └── services\
│   ├── database\
│   │   └── schema.sql       ← MySQL schema (DONE ✅)
│   └── package.json
│
├── desktop-app\             ← React Dashboard (DONE ✅)
│   ├── src\
│   │   ├── pages\
│   │   │   └── Settings.jsx ← Admin control panel ⭐
│   │   ├── services\
│   │   └── App.jsx
│   └── package.json
│
└── docs\                    ← Documentation (DONE ✅)
    ├── IMPLEMENTATION.md
    ├── ADMIN_CONTROL_GUIDE.md
    └── PROJECT_SUMMARY.md
```

---

## 🔗 URLs

- Backend API: http://localhost:5000
- Admin Dashboard: http://localhost:3000
- API Health: http://localhost:5000/api/health

---

## 🎉 Success!

You now have:
- ✅ Admin dashboard running
- ✅ Backend API running
- ✅ MySQL database ready
- ✅ Settings fully controllable

**Next:** Build the Windows desktop application to receive these settings!

---

## 📞 Quick Commands

```bash
# Start everything
cd backend-server && npm run dev    # Terminal 1
cd desktop-app && npm run dev        # Terminal 2

# Check health
curl http://localhost:5000/api/health

# View logs
tail -f backend-server/logs/combined.log

# Database
mysql -u root -p employee_monitoring
```

---

**Time to complete:** 10 minutes
**Difficulty:** Easy
**Status:** ✅ READY

**Happy controlling!** 🚀
