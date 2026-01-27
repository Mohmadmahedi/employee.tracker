# ✅ COMPLETE SETUP CHECKLIST

## Current Status

- ✅ **Backend code** - Complete (Node.js + Express + MySQL)
- ✅ **Frontend code** - Complete (React + Material-UI)
- ✅ **Database schema** - Ready (13 tables, 50+ settings)
- ✅ **Documentation** - Complete (5 guides)
- ✅ **Admin Dashboard** - Running on http://localhost:3000
- ⚠️ **Backend Server** - Waiting for MySQL database
- ❌ **MySQL Database** - Not created yet
- ❌ **Admin User** - Not created yet

---

## 🎯 TODO: Complete These Steps

### ☐ Step 1: Fix MySQL Connection (2 minutes)

**Check if you have MySQL password:**
```bash
mysql -u root
```

**If works (no password):**
- Database connection should work automatically
- Skip to Step 2

**If fails (needs password):**
```bash
# 1. Open .env file
notepad backend-server\.env

# 2. Find line: DB_PASSWORD=
# 3. Change to: DB_PASSWORD=your_actual_password
# 4. Save and close

# Server will auto-restart and connect!
```

**Expected Result:**
```
✓ Database connected successfully
🚀 Server running on port 5000
```

---

### ☐ Step 2: Create Database (1 minute)

**Method A: Using MySQL CLI (Recommended)**
```bash
# Login to MySQL
mysql -u root -p

# Inside MySQL console:
CREATE DATABASE IF NOT EXISTS employee_monitoring;
USE employee_monitoring;
source C:/Users/Admin/Desktop/attendance/backend-server/database/schema.sql;

# Verify tables created
SHOW TABLES;
# You should see 13 tables

# Exit
exit;
```

**Method B: Import directly**
```bash
mysql -u root -p < backend-server/database/schema.sql
```

**Expected Result:**
- 13 tables created
- 50+ default settings inserted
- Schema ready for use

---

### ☐ Step 3: Create Admin User (2 minutes)

**3.1 Generate Password Hash**

Go to: **https://bcrypt-generator.com/**
- Password: `Admin@123`
- Rounds: `10`
- Click "Generate"
- Copy the hash (starts with $2b$10$)

**3.2 Create Admin in Database**
```sql
# Login to MySQL
mysql -u root -p

# Use database
USE employee_monitoring;

# Create admin (replace YOUR_HASH with the copied hash)
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (
  UUID(),
  'admin@company.com',
  '$2b$10$YOUR_HASH_HERE',
  'System Administrator',
  'SUPER_ADMIN'
);

# Verify
SELECT email, full_name, role FROM admin_users;

# Exit
exit;
```

**Expected Result:**
- Admin user created
- Can login to dashboard

---

### ☐ Step 4: Test Login to Dashboard (1 minute)

1. **Open browser:** http://localhost:3000

2. **Login with:**
   ```
   Email: admin@company.com
   Password: Admin@123
   ```

3. **Verify:**
   - ✅ Dashboard loads
   - ✅ Sidebar menu appears
   - ✅ Can navigate to Settings page

**Expected Result:**
- Successfully logged in
- Dashboard showing

---

### ☐ Step 5: Test Admin Control Panel (2 minutes)

1. **Navigate to Settings** (click "Settings" in sidebar)

2. **You should see:**
   - Screenshot settings (5 options)
   - Monitoring settings (4 options)
   - Security settings (4 options)
   - Integration settings (4 options)
   - Working hours (3 options)
   - **Total: 20+ controllable settings**

3. **Test changing a setting:**
   ```
   - Find "Screenshot Interval"
   - Change from 30 to 45
   - Click "Save All Changes"
   - You should see: "X settings saved successfully!"
   ```

4. **Verify in database:**
   ```sql
   mysql -u root -p
   USE employee_monitoring;
   SELECT setting_key, setting_value FROM global_settings 
   WHERE setting_key = 'screenshot_interval';
   # Should show: 45
   ```

**Expected Result:**
- Settings page fully functional
- Can change and save settings
- Changes reflected in database

---

## 🎉 SUCCESS CRITERIA

Once all steps complete, you should have:

✅ **Backend running:**
```
==================================================
🚀 Server running on port 5000
📊 Environment: development
🌐 API URL: http://localhost:5000
==================================================
✓ Database connected successfully
```

✅ **Frontend running:**
```
Local: http://localhost:3000
```

✅ **Database created:**
```
13 tables
50+ settings
1 admin user
```

✅ **Can login:**
```
Email: admin@company.com
Password: Admin@123
Status: ✅ Logged in
```

✅ **Settings controllable:**
```
Can change screenshot interval
Can toggle monitoring
Can adjust security settings
All changes saved to database
```

---

## 📋 Quick Reference

### Servers
```bash
# Backend
cd backend-server
npm run dev
→ http://localhost:5000

# Frontend  
cd desktop-app
npm run dev
→ http://localhost:3000
```

### MySQL
```bash
# Login
mysql -u root -p

# Use database
USE employee_monitoring;

# View settings
SELECT * FROM global_settings;

# View admins
SELECT * FROM admin_users;
```

### Check Status
```bash
# Backend health
curl http://localhost:5000/api/health

# Database tables
mysql -u root -p -e "USE employee_monitoring; SHOW TABLES;"
```

---

## 🆘 Troubleshooting

### Backend won't connect to MySQL
→ See: `DATABASE_FIX.md`

### Can't generate password hash
→ Use: https://bcrypt-generator.com/

### Login fails
→ Check admin_users table password_hash

### Settings won't save
→ Check browser console for errors
→ Check backend logs

---

## 📚 Documentation Files

- `README.md` - Complete system overview
- `QUICK_START.md` - Fast setup guide
- `DATABASE_FIX.md` - MySQL connection troubleshooting
- `CREATE_ADMIN_USER.md` - Admin user creation guide
- `STATUS.md` - Current status and next steps
- `PROJECT_SUMMARY.md` - Full feature list
- `ADMIN_CONTROL_GUIDE.md` - Settings reference

---

## 🎯 Time Estimate

| Step | Time | Status |
|------|------|--------|
| MySQL connection | 2 min | ⚠️ Pending |
| Create database | 1 min | ⚠️ Pending |
| Create admin user | 2 min | ⚠️ Pending |
| Test login | 1 min | ⚠️ Pending |
| Test settings | 2 min | ⚠️ Pending |
| **TOTAL** | **8 minutes** | |

---

## ✅ Final Verification

Run this checklist:

```bash
# 1. Backend connected to MySQL?
# Look for: ✓ Database connected successfully

# 2. Database has tables?
mysql -u root -p -e "USE employee_monitoring; SHOW TABLES;"
# Should show 13 tables

# 3. Admin user exists?
mysql -u root -p -e "USE employee_monitoring; SELECT email FROM admin_users;"
# Should show: admin@company.com

# 4. Can login to dashboard?
# Go to: http://localhost:3000
# Login successful?

# 5. Settings page works?
# Navigate to Settings
# Can see and change settings?

# 6. Changes save to database?
# Change a setting → Save
# Check database:
mysql -u root -p -e "USE employee_monitoring; SELECT * FROM config_history;"
# Should show your change
```

---

## 🚀 You're Done When...

✅ Backend shows: "Database connected successfully"
✅ Can login at http://localhost:3000
✅ Settings page shows 20+ options
✅ Can change and save settings
✅ Changes appear in database

**Then you have full admin control over the entire system!** 🎉

---

**Next:** After basic setup works, you can:
1. Add more admin users
2. Test all pages in dashboard
3. Build the Windows desktop application
4. Configure Google Sheets integration
5. Set up email service

**But first:** Complete the 5 steps above! ⬆️
