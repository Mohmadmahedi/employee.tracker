# Complete Implementation Guide

## Employee Monitoring System - Step by Step Setup

### Step 1: Database Setup

1. **Install MySQL 8.0+**
```bash
# Download from: https://dev.mysql.com/downloads/mysql/
```

2. **Create Database**
```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
source C:/Users/Admin/Desktop/attendance/backend-server/database/schema.sql
```

3. **Create Admin User**
```sql
USE employee_monitoring;

-- Hash password using bcrypt (use online tool or Node.js)
-- Password: Admin@123 -> Hash: $2b$10$...

INSERT INTO admin_users (id, email, password_hash, full_name, role, uninstall_password_hash)
VALUES (
  UUID(),
  'admin@company.com',
  '$2b$10$YourBcryptHashHere',
  'System Administrator',
  'SUPER_ADMIN',
  '$2b$10$YourUninstallPasswordHash'
);
```

---

### Step 2: Backend Server Setup

1. **Navigate to backend**
```bash
cd C:\Users\Admin\Desktop\attendance\backend-server
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**

Create `.env` file:
```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=employee_monitoring

# JWT
JWT_SECRET=super_secret_key_change_in_production_12345
JWT_REFRESH_SECRET=refresh_secret_key_67890
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d

# Master Password for Uninstall
ADMIN_MASTER_PASSWORD=MasterUninstallPass123!

# CORS
CORS_ORIGIN=http://localhost:3000

# Uploads
UPLOAD_PATH=./uploads
SCREENSHOT_PATH=./uploads/screenshots

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@company.com

# Google Sheets (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
GOOGLE_REFRESH_TOKEN=xxxxx

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=employee-screenshots
```

4. **Create required directories**
```bash
mkdir uploads
mkdir uploads\screenshots
mkdir logs
```

5. **Start server**
```bash
npm run dev
```

You should see:
```
==================================================
🚀 Server running on port 5000
📊 Environment: development
🌐 API URL: http://localhost:5000
==================================================
✓ Database connected successfully
```

---

### Step 3: Admin Dashboard Setup

1. **Navigate to desktop-app**
```bash
cd C:\Users\Admin\Desktop\attendance\desktop-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start development server**
```bash
npm run dev
```

Dashboard opens at: http://localhost:3000

5. **Login**
```
Email: admin@company.com
Password: Admin@123
```

---

### Step 4: Configure Settings from Admin Panel

1. **Navigate to Settings** (`/settings`)

2. **Global Settings**

Screenshot Settings:
- Screenshot Enabled: ✅ ON
- First Delay: 15 minutes
- Interval: 30 minutes
- Quality: 75%

Monitoring:
- Monitoring Enabled: ✅ ON
- Idle Threshold: 5 minutes
- Heartbeat Interval: 5 minutes

Security:
- Tamper Protection: ✅ ON
- Uninstall Protection: ✅ ON
- Process Watchdog: ✅ ON

3. **Click "Save All Changes"**

Changes are immediately:
- Saved to database
- Logged in config_history
- Pushed to all desktop apps via WebSocket

---

### Step 5: Desktop Application (Employee Side)

The desktop app will be built using **C# .NET** and will:

1. **Installation Flow**
```
Install → First Launch → Login Screen
         ↓
    Employee enters:
    - Email
    - Password
    - Full Name
    - Accept Consent ✅
         ↓
    Backend validates & registers
         ↓
    Create Google Sheet
         ↓
    Store encrypted token
         ↓
    Hide UI forever
         ↓
    Install Windows Service
         ↓
    Start monitoring
```

2. **Core Components**

**ActivityMonitor.cs** - Tracks PC activity
```csharp
class ActivityMonitor
{
    - DetectScreenLock()
    - DetectIdleTime()
    - CalculateWorkingTime()
    - SendHeartbeat()
}
```

**ScreenshotCapture.cs** - Captures screenshots
```csharp
class ScreenshotCapture
{
    - CaptureScreen()
    - CompressImage()
    - EncryptImage()
    - UploadToServer()
}
```

**ConfigSync.cs** - Syncs settings from admin
```csharp
class ConfigSync
{
    - ConnectWebSocket()
    - ListenForConfigUpdates()
    - ApplySettings()
}
```

**TamperProtection.cs** - Anti-tamper
```csharp
class TamperProtection
{
    - BlockUninstall()
    - MonitorProcess()
    - ProtectFiles()
    - SendAlert()
}
```

3. **Config Sync Implementation**

```csharp
using SocketIOClient;

public class ConfigSyncService
{
    private SocketIO socket;
    private string employeeId;
    private Dictionary<string, object> settings;

    public async Task Connect(string serverUrl, string employeeId)
    {
        this.employeeId = employeeId;
        socket = new SocketIO(serverUrl);

        // Listen for config updates
        socket.On("employee:config-update", response =>
        {
            var data = response.GetValue();
            ApplyGlobalConfig(data);
        });

        // Listen for employee-specific updates
        socket.On($"employee:{employeeId}:config-update", response =>
        {
            var settings = response.GetValue();
            ApplyEmployeeConfig(settings);
        });

        await socket.ConnectAsync();
    }

    private void ApplyGlobalConfig(dynamic data)
    {
        string key = data.setting_key;
        var value = data.setting_value;

        // Apply setting
        switch (key)
        {
            case "screenshot_interval":
                UpdateScreenshotInterval(Convert.ToInt32(value));
                break;

            case "screenshot_enabled":
                ToggleScreenshots(Convert.ToBoolean(value));
                break;

            case "heartbeat_interval":
                UpdateHeartbeatInterval(Convert.ToInt32(value));
                break;

            // ... etc
        }

        LogConfigChange(key, value);
    }
}
```

---

### Step 6: Google Sheets Integration

1. **Setup Google Cloud Project**

Go to: https://console.cloud.google.com

- Create new project
- Enable Google Sheets API
- Create OAuth 2.0 credentials
- Download credentials JSON

2. **Get Refresh Token**

Run auth flow once to get refresh token:
```javascript
// Use Google OAuth Playground or run this script
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/spreadsheets']
});

console.log('Visit:', authUrl);
// After authorization, get code and exchange for tokens
```

3. **Implement Sheet Creation**

```javascript
// backend-server/src/services/sheets.service.js

const { google } = require('googleapis');

async function createEmployeeSheet(employeeId, employeeName) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Create new spreadsheet
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `Attendance - ${employeeName}`
      },
      sheets: [{
        properties: {
          title: 'Monthly Attendance'
        },
        data: [{
          rowData: [{
            values: [
              { userEnteredValue: { stringValue: 'Date' } },
              { userEnteredValue: { stringValue: 'Login Time' } },
              { userEnteredValue: { stringValue: 'Logout Time' } },
              { userEnteredValue: { stringValue: 'Working Hours' } },
              { userEnteredValue: { stringValue: 'Break Hours' } },
              { userEnteredValue: { stringValue: 'Overtime' } }
            ]
          }]
        }]
      }]
    }
  });

  const sheetId = response.data.spreadsheetId;
  const sheetUrl = response.data.spreadsheetUrl;

  // Save to database
  await db.query(
    'UPDATE employees SET google_sheet_id = ?, google_sheet_url = ? WHERE id = ?',
    [sheetId, sheetUrl, employeeId]
  );

  return { sheetId, sheetUrl };
}
```

---

### Step 7: Testing Admin Control

1. **Test Global Settings**

In Admin Dashboard → Settings:
- Change "Screenshot Interval" from 30 to 45
- Click "Save All Changes"

Check:
- ✅ Database updated
- ✅ Config history logged
- ✅ WebSocket event emitted
- ✅ Desktop app receives update

2. **Test Employee Override**

In Employees page → Select employee → Custom Settings:
- Override "Screenshot Interval" to 60 minutes (for this employee only)
- Save

Check:
- ✅ Employee-specific setting saved
- ✅ Other employees still use global setting (30 min)
- ✅ Specific employee uses 60 minutes

3. **Test Real-time Sync**

Open browser console in admin dashboard:
```javascript
// Should see WebSocket events
ws://localhost:5000
Connected
```

Change any setting → Watch desktop app log:
```
[2026-01-03 10:30:15] Config update received
[2026-01-03 10:30:15] Setting: screenshot_interval
[2026-01-03 10:30:15] New value: 45
[2026-01-03 10:30:15] Applied successfully
```

---

### Step 8: Monthly Email Automation

1. **Configure Cron Job**

Already set up in `server.js`:
```javascript
cron.schedule('0 0 1 * *', async () => {
  await monthlyReportJob();
});
```

2. **Implement Monthly Report Service**

```javascript
// backend-server/src/services/cron.service.js

async function monthlyReportJob() {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const month = lastMonth.getMonth() + 1;
  const year = lastMonth.getFullYear();

  // Get all active employees
  const employees = await db.query(
    'SELECT * FROM employees WHERE is_active = TRUE'
  );

  for (const employee of employees) {
    // Calculate monthly summary
    const summary = await db.query(`
      SELECT 
        SUM(working_hours) as total_working,
        SUM(break_hours) as total_break,
        SUM(overtime_hours) as total_overtime,
        COUNT(DISTINCT attendance_date) as days_worked
      FROM daily_attendance
      WHERE employee_id = ?
        AND MONTH(attendance_date) = ?
        AND YEAR(attendance_date) = ?
    `, [employee.id, month, year]);

    // Send email
    await sendMonthlyEmail(employee, summary, month, year);

    // Log report
    await db.query(`
      INSERT INTO monthly_reports (...)
      VALUES (...)
    `);
  }
}
```

---

### Step 9: Security Hardening

1. **SSL/TLS in Production**

```javascript
// Use HTTPS
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('fullchain.pem')
};

https.createServer(options, app).listen(443);
```

2. **Rate Limiting**

Already implemented:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

3. **Input Validation**

Add to all routes:
```javascript
const { body, validationResult } = require('express-validator');

router.post('/settings/global/bulk-update',
  [
    body('settings').isArray(),
    body('settings.*.key').isString(),
    body('settings.*.value').exists(),
    body('reason').isString().optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ...
  }
);
```

---

### Step 10: Production Deployment

1. **Backend (Linux Server)**

```bash
# Install Node.js, MySQL, PM2
sudo apt update
sudo apt install nodejs npm mysql-server
npm install -g pm2

# Clone/upload code
cd /var/www/employee-monitoring
npm install --production

# Setup MySQL
mysql -u root -p < database/schema.sql

# Configure .env for production

# Start with PM2
pm2 start src/server.js --name "employee-monitoring"
pm2 startup
pm2 save
```

2. **Frontend (Static Hosting)**

```bash
# Build
cd desktop-app
npm run build

# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - Nginx
```

3. **Desktop App (Distribute to Employees)**

```
Build .exe installer:
- Bundle all dependencies
- Include auto-updater
- Sign with code signing certificate
- Distribute via internal portal
```

---

## Admin Control Examples

### Example 1: Disable Screenshots for All

Admin Dashboard → Settings → Screenshot:
```
Screenshot Enabled: ❌ OFF
```

Result: All desktop apps stop capturing screenshots immediately.

### Example 2: Custom Settings for Remote Employee

```
Employee: John Doe (Remote)
Override:
  - Screenshot Interval: 60 min (instead of global 30)
  - Idle Threshold: 10 min (instead of global 5)
```

### Example 3: Emergency Disable Monitoring

```
Admin → Settings → Monitoring:
Monitoring Enabled: ❌ OFF
```

All desktop apps stop tracking immediately.

---

## Troubleshooting

### Backend won't start
```bash
# Check MySQL connection
mysql -u root -p -e "SELECT 1"

# Check logs
tail -f backend-server/logs/combined.log
```

### Dashboard can't connect
```bash
# Check API health
curl http://localhost:5000/api/health

# Check CORS
# Make sure CORS_ORIGIN in .env matches frontend URL
```

### WebSocket not connecting
```javascript
// Check in browser console
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('Connected!'));
```

---

## Next Steps

1. ✅ **Backend & Database**: Done
2. ✅ **Admin Dashboard**: Done
3. 🔄 **Desktop App**: Implement in C# .NET
4. ⏳ **Google Sheets**: Integrate API
5. ⏳ **Email Service**: Complete implementation
6. ⏳ **Testing**: End-to-end testing
7. ⏳ **Deployment**: Production setup

---

**You now have complete admin control over all employee desktop applications!** 🎉
