# 🔐 CREATE ADMIN USER - Complete Guide

## After Database is Created

Once your database connection works, you need to create an admin user to login to the dashboard.

---

## Step 1: Generate Password Hash

You need to create a **bcrypt hash** of your admin password.

### Method A: Online Tool (Quickest)

1. Go to: **https://bcrypt-generator.com/**
2. Enter password: `Admin@123`
3. Rounds: `10`
4. Click "Generate"
5. Copy the hash (starts with `$2b$10$` or `$2a$10$`)

**Example hash:**
```
$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
```

### Method B: Node.js (If you prefer)

```javascript
// In backend-server directory
node

// In Node.js console:
const bcrypt = require('bcrypt');
bcrypt.hash('Admin@123', 10, (err, hash) => {
  console.log('Hash:', hash);
});
// Copy the printed hash
```

---

## Step 2: Create Admin User in MySQL

```sql
-- Login to MySQL
mysql -u root -p

-- Use database
USE employee_monitoring;

-- Create admin user (replace PASTE_YOUR_HASH_HERE with actual hash)
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (
  UUID(),
  'admin@company.com',
  '$2b$10$PASTE_YOUR_HASH_HERE',
  'System Administrator',
  'SUPER_ADMIN'
);

-- Verify admin was created
SELECT email, full_name, role FROM admin_users;

-- You should see:
-- +---------------------+----------------------+-------------+
-- | email               | full_name            | role        |
-- +---------------------+----------------------+-------------+
-- | admin@company.com   | System Administrator | SUPER_ADMIN |
-- +---------------------+----------------------+-------------+

-- Exit MySQL
exit;
```

---

## Step 3: Test Login

1. **Open dashboard:** http://localhost:3000

2. **Login with:**
   ```
   Email: admin@company.com
   Password: Admin@123
   ```

3. **You should see:**
   - Dashboard page loads
   - Sidebar with menu items
   - Welcome message

---

## Complete Example (Copy-Paste Ready)

### Using bcrypt-generator.com hash:

```sql
USE employee_monitoring;

-- Example with generated hash
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (
  UUID(),
  'admin@company.com',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'System Administrator',
  'SUPER_ADMIN'
);

SELECT * FROM admin_users;
```

---

## Create Additional Admin Users (Optional)

```sql
-- HR role admin
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (
  UUID(),
  'hr@company.com',
  '$2b$10$YOUR_HASH_HERE',
  'HR Manager',
  'HR'
);

-- Regular admin
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (
  UUID(),
  'manager@company.com',
  '$2b$10$YOUR_HASH_HERE',
  'Department Manager',
  'ADMIN'
);
```

---

## Roles Explained

| Role | Permissions |
|------|-------------|
| **SUPER_ADMIN** | Full access to everything, can modify global settings |
| **ADMIN** | Most features, limited settings access |
| **HR** | View reports, manage employees, no system settings |

---

## Troubleshooting

### Login fails with "Invalid credentials"

**Check password hash:**
```sql
SELECT email, password_hash FROM admin_users 
WHERE email = 'admin@company.com';
```

Make sure:
- Hash starts with `$2b$10$` or `$2a$10$`
- Hash is about 60 characters long
- No extra spaces or quotes

### Can't generate hash

**Alternative online tools:**
- https://www.browserling.com/tools/bcrypt
- https://bcrypt.online/

**Or use backend endpoint (after server starts):**
```bash
# Add this temporary route to backend if needed
POST http://localhost:5000/api/hash-password
Body: { "password": "Admin@123" }
```

### Wrong password

If you want to change password:
```sql
-- Generate new hash for new password
-- Then update:
UPDATE admin_users 
SET password_hash = '$2b$10$NEW_HASH_HERE'
WHERE email = 'admin@company.com';
```

---

## Full Setup Workflow

```bash
# 1. Make sure MySQL is running
Get-Service -Name MySQL*

# 2. Create database (if not done)
mysql -u root -p < backend-server/database/schema.sql

# 3. Generate password hash
# Go to: https://bcrypt-generator.com/
# Password: Admin@123
# Rounds: 10
# Copy hash

# 4. Create admin user
mysql -u root -p
USE employee_monitoring;
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (UUID(), 'admin@company.com', 'PASTE_HASH', 'Admin', 'SUPER_ADMIN');
exit;

# 5. Backend should show:
# ✓ Database connected successfully
# 🚀 Server running on port 5000

# 6. Open dashboard
# http://localhost:3000

# 7. Login
# Email: admin@company.com
# Password: Admin@123

# 8. Success! 🎉
```

---

## Quick Reference

**Default Admin Credentials:**
```
Email: admin@company.com
Password: Admin@123
```

**Bcrypt Hash Tool:**
```
https://bcrypt-generator.com/
```

**SQL Command:**
```sql
INSERT INTO admin_users (id, email, password_hash, full_name, role)
VALUES (UUID(), 'admin@company.com', '$2b$10$HASH', 'Admin', 'SUPER_ADMIN');
```

---

## After Successful Login

Once logged in, you can:

1. **Go to Settings** → Control all 20+ desktop app settings
2. **View Dashboard** → See system overview
3. **Manage Employees** → Add/edit employee accounts
4. **View Alerts** → See security alerts
5. **Access Reports** → View attendance data

**The admin control panel is fully functional!** 🚀

---

## Sample Passwords for Testing

If you want different passwords:

| Password | Bcrypt Hash (rounds=10) |
|----------|------------------------|
| Admin@123 | Use bcrypt-generator.com |
| Test@123 | Use bcrypt-generator.com |
| Pass@123 | Use bcrypt-generator.com |

Generate each one separately at https://bcrypt-generator.com/

---

## Security Notes

- ✅ Passwords are **never** stored in plain text
- ✅ Only bcrypt hashes are stored in database
- ✅ Hashes cannot be reversed to get password
- ✅ Each hash is unique even for same password (salt)
- ✅ JWT tokens expire after 24 hours
- ✅ Refresh tokens expire after 30 days

---

**Ready to login and control everything!** 🎉
