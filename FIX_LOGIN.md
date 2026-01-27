# 🔐 FIX LOGIN - Invalid Credentials Error

## Problem
Login shows "Invalid credentials" error.

## Solution
Update the admin password hash in the database.

---

## Quick Fix (Choose One Method)

### Method 1: MySQL Workbench (Easiest)

1. **Open MySQL Workbench**

2. **Connect to your database**

3. **Open a new SQL tab**

4. **Copy and paste this command:**
```sql
USE employee_monitoring;

UPDATE admin_users 
SET password_hash = '$2b$10$hmHpmxD9BMHVVqBeIUW7Pu6mPb8vPLJ8hfO0OFYOP.YNJvt41Tlwm'
WHERE email = 'admin@company.com';

SELECT email, full_name FROM admin_users WHERE email = 'admin@company.com';
```

5. **Click Execute** (lightning bolt icon)

6. **You should see:** admin@company.com | System Administrator

7. **Go back to login page and try again!**

---

### Method 2: Command Line

If you have MySQL in PATH:

```bash
# Open PowerShell and run:
mysql -u root -p
```

Inside MySQL console:
```sql
USE employee_monitoring;

UPDATE admin_users 
SET password_hash = '$2b$10$hmHpmxD9BMHVVqBeIUW7Pu6mPb8vPLJ8hfO0OFYOP.YNJvt41Tlwm'
WHERE email = 'admin@company.com';

exit;
```

---

### Method 3: Using SQL File

```bash
# Navigate to project
cd C:\Users\Admin\Desktop\attendance

# Run the fix script
# (MySQL path might vary - adjust if needed)
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < backend-server\database\fix-admin-password.sql
```

---

## After Update

**Login credentials:**
```
URL:      http://localhost:3000
Email:    admin@company.com
Password: Admin@123
```

**Refresh the login page and try again!**

---

## Still Not Working?

### Check Backend Logs

Look at the backend terminal for errors. You should see:
```
POST /api/auth/admin/login
```

### Test Password Hash Manually

```javascript
// In backend-server directory
node

// In Node console:
const bcrypt = require('bcrypt');
const hash = '$2b$10$hmHpmxD9BMHVVqBeIUW7Pu6mPb8vPLJ8hfO0OFYOP.YNJvt41Tlwm';
bcrypt.compare('Admin@123', hash, (err, result) => {
  console.log('Password matches:', result); // Should be true
});
```

### Verify Database

```sql
SELECT email, password_hash FROM admin_users WHERE email = 'admin@company.com';
```

The password_hash should start with: `$2b$10$hmHpmxD9...`

---

## Alternative: Create New Admin

If update doesn't work, delete and recreate:

```sql
USE employee_monitoring;

-- Delete old admin
DELETE FROM admin_users WHERE email = 'admin@company.com';

-- Create new admin
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (
  UUID(),
  'admin@company.com',
  '$2b$10$hmHpmxD9BMHVVqBeIUW7Pu6mPb8vPLJ8hfO0OFYOP.YNJvt41Tlwm',
  'System Administrator',
  'SUPER_ADMIN'
);
```

---

## Correct Password Hash

For reference, the correct hash for password **"Admin@123"** is:

```
$2b$10$hmHpmxD9BMHVVqBeIUW7Pu6mPb8vPLJ8hfO0OFYOP.YNJvt41Tlwm
```

This was generated using:
```javascript
bcrypt.hash('Admin@123', 10)
```

---

## After Fix

1. ✅ Password updated in database
2. ✅ Refresh login page (Ctrl+F5)
3. ✅ Login with: admin@company.com / Admin@123
4. ✅ Should work!

---

## Test Different Password (Optional)

If you want to use a different password:

1. Generate hash:
   - Go to: https://bcrypt-generator.com/
   - Enter your password
   - Rounds: 10
   - Copy the hash

2. Update database:
```sql
UPDATE admin_users 
SET password_hash = 'YOUR_GENERATED_HASH'
WHERE email = 'admin@company.com';
```

---

**Most likely fix:** Just run the UPDATE command in MySQL Workbench!
