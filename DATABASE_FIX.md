# ⚡ IMMEDIATE FIX - Database Connection Error

## Problem
```
✗ Database connection failed: Access denied for user 'root'@'localhost' (using password: NO)
```

## Solution

### Option 1: MySQL Without Password (Quick Test)

If your MySQL root user has NO password, the current setup should work.
Try restarting the server - it should connect now.

### Option 2: MySQL With Password (Recommended)

If your MySQL has a password, follow these steps:

#### Step 1: Edit .env File

```bash
# Open in notepad
notepad backend-server\.env
```

#### Step 2: Add Your MySQL Password

Find this line:
```
DB_PASSWORD=
```

Change to:
```
DB_PASSWORD=your_mysql_password_here
```

**Example:**
```
DB_PASSWORD=MySecretPass123
```

#### Step 3: Save and Restart

1. Save the file (Ctrl+S)
2. Close notepad
3. The server will auto-restart (nodemon is watching)

---

## Verify MySQL Connection

### Test MySQL Login

```bash
# Test if you can login without password
mysql -u root

# If that fails, try with password:
mysql -u root -p
# (Enter your password when prompted)
```

### Common MySQL Passwords
- Blank (no password) - Most common in local development
- `root`
- `password`
- `mysql`
- Whatever you set during MySQL installation

---

## Create Database (If Not Exists)

```bash
# Login to MySQL
mysql -u root -p

# Inside MySQL:
CREATE DATABASE IF NOT EXISTS employee_monitoring;
USE employee_monitoring;

# Run the schema
source C:/Users/Admin/Desktop/attendance/backend-server/database/schema.sql

# Verify tables created
SHOW TABLES;

# Exit
exit;
```

---

## Quick Setup Commands

```powershell
# 1. Set MySQL password in .env
notepad backend-server\.env
# Add your password to DB_PASSWORD=

# 2. Create database (from project root)
mysql -u root -p < backend-server/database/schema.sql
# Enter password when prompted

# 3. Server should auto-restart
# Check the terminal - you should see:
# ✓ Database connected successfully
# 🚀 Server running on port 5000
```

---

## Still Not Working?

### Check MySQL Service

```powershell
# Check if MySQL is running
Get-Service -Name MySQL* | Select-Object Name, Status

# If not running, start it:
# Go to Services (Win+R → services.msc)
# Find MySQL service
# Right-click → Start
```

### Reset MySQL Root Password (Last Resort)

If you forgot your MySQL password:

1. Stop MySQL service
2. Start MySQL in safe mode
3. Reset password
4. Restart MySQL

[Full guide: https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html]

---

## Expected Output After Fix

```
[nodemon] restarting due to changes...
[nodemon] starting `node src/server.js`
✓ Database connected successfully
==================================================
🚀 Server running on port 5000
📊 Environment: development
🌐 API URL: http://localhost:5000
==================================================
```

---

## Current .env Configuration

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=           ← ADD YOUR PASSWORD HERE!
DB_NAME=employee_monitoring
```

---

## Next Steps After Database Connected

1. ✅ Verify server is running: http://localhost:5000/api/health
2. ✅ Create admin user in database
3. ✅ Start the React dashboard
4. ✅ Login and control settings!

---

**Most Common Fix:** Just add your MySQL password to `.env` file!
