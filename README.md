# Employee Monitoring, Attendance & Security Application

A comprehensive enterprise-grade employee monitoring system with **full admin control** over all desktop application settings, features, and behavior.

## 🎯 Key Features

### Admin Control Center
- **Complete Remote Control**: Admin can control ALL desktop app settings from web dashboard
- **Real-time Configuration**: Changes pushed instantly to all employee apps via WebSocket
- **Per-Employee Override**: Set custom settings for specific employees
- **Screenshot Control**: Adjust interval, quality, and timing from admin panel
- **Monitoring Parameters**: Control idle detection, heartbeat frequency, work hours
- **Security Settings**: Enable/disable tamper protection, uninstall blocks remotely

### Core Functionality
- ✅ Automatic work time tracking (PC ON/OFF, screen lock detection)
- ✅ Silent screenshot capture (admin-controlled intervals)
- ✅ Admin live screen monitoring
- ✅ Google Sheets integration (automatic data sync)
- ✅ Monthly auto-email reports to employees
- ✅ Anti-tamper & uninstall protection
- ✅ Security alerts for all tamper attempts

## 📁 Project Structure

```
attendance/
├── backend-server/          # Node.js + Express + MySQL API
│   ├── database/
│   │   └── schema.sql      # MySQL database with admin control tables
│   ├── src/
│   │   ├── controllers/    # Auth, Settings, Admin controllers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic, Google Sheets, Email
│   │   ├── middleware/     # Authentication, validation
│   │   ├── config/         # Database configuration
│   │   └── server.js       # Main server with WebSocket
│   └── package.json
│
├── desktop-app/            # React Admin Dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Settings.jsx     # ⭐ ADMIN CONTROL PANEL
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Employees.jsx
│   │   │   ├── LiveMonitoring.jsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── settingsService.js
│   │   └── App.jsx
│   └── package.json
│
└── docs/
    └── IMPLEMENTATION.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- MySQL 8.0+
- Windows 10/11 (for desktop client)
- Google Cloud project (for Sheets API)
- SMTP server (for emails)

### 1. Database Setup

```bash
# Create MySQL database
mysql -u root -p < backend-server/database/schema.sql

# Update credentials in backend-server/.env
```

### 2. Backend Server Setup

```bash
cd backend-server

# Install dependencies
npm install

# Create .env file (copy from env.example.txt)
cp env.example.txt .env

# Edit .env with your settings:
# - MySQL credentials
# - JWT secrets
# - Google Sheets API keys
# - SMTP settings

# Start server
npm run dev

# Server will run on http://localhost:5000
```

### 3. Admin Dashboard Setup

```bash
cd desktop-app

# Install dependencies
npm install

# Start development server
npm run dev

# Dashboard will open at http://localhost:3000
```

### 4. Admin Dashboard Login

Default credentials (create in database):
```
Email: admin@company.com
Password: Admin@123
```

---

## ⚙️ Admin Control Panel

The **Settings** page (`/settings`) is the central control panel where admin can:

### Global Settings

#### Screenshot Configuration
```javascript
screenshot_enabled: true/false           // Enable/disable globally
screenshot_first_delay: 15              // Minutes before first screenshot
screenshot_interval: 30                 // Minutes between screenshots
screenshot_quality: 75                  // JPEG quality (1-100)
screenshot_on_active_only: true/false   // Capture only when active
```

#### Activity Monitoring
```javascript
monitoring_enabled: true/false          // Enable monitoring
idle_threshold: 5                      // Minutes before idle
heartbeat_interval: 5                  // Minutes between server updates
detect_screen_lock: true/false         // Track screen lock as break
```

#### Working Hours
```javascript
work_day_hours: 8                      // Standard work day
enable_overtime: true/false            // Calculate overtime
auto_logout_enabled: false             // Auto logout after hours
```

#### Security & Protection
```javascript
tamper_protection_enabled: true/false   // Anti-tamper
uninstall_protection_enabled: true      // Require password
file_integrity_check: true/false        // Monitor file changes
process_watchdog_enabled: true/false    // Auto-restart process
```

#### Integrations
```javascript
sheets_sync_enabled: true/false         // Google Sheets sync
sheets_sync_interval: 'daily'           // realtime, hourly, daily
monthly_email_enabled: true/false       // Monthly reports
monthly_email_day: 1                    // Day of month (1-28)
```

### Per-Employee Override

Admin can set custom settings for specific employees:

```javascript
// Example: Reduce screenshot frequency for employee X
Employee ID: abc-123
Setting: screenshot_interval
Value: 60 (minutes)
```

All changes are:
- ✅ Logged in `config_history` table
- ✅ Pushed to desktop apps via WebSocket
- ✅ Applied in real-time (no app restart needed)

---

## 🔌 API Endpoints

### Settings API (Admin Only)

```http
# Get all global settings
GET /api/settings/global
Authorization: Bearer {admin_token}

# Update single setting
PUT /api/settings/global/:setting_key
{
  "setting_key": "screenshot_interval",
  "setting_value": 45,
  "reason": "Reducing load"
}

# Bulk update
POST /api/settings/global/bulk-update
{
  "settings": [
    {"key": "screenshot_interval", "value": 45},
    {"key": "screenshot_quality", "value": 80}
  ],
  "reason": "Performance optimization"
}

# Get employee-specific settings
GET /api/settings/employee/:employeeId

# Set employee override
PUT /api/settings/employee/:employeeId/:setting_key
{
  "setting_key": "screenshot_interval",
  "setting_value": 60,
  "data_type": "number",
  "reason": "Custom for this employee"
}

# Remove employee override
DELETE /api/settings/employee/:employeeId/override/:settingKey

# Get config change history
GET /api/settings/history?employeeId=xxx&limit=50

# Export settings (backup)
GET /api/settings/export

# Import settings (restore)
POST /api/settings/import
```

### Authentication API

```http
# Admin login
POST /api/auth/admin/login
{
  "email": "admin@company.com",
  "password": "Admin@123",
  "ip_address": "192.168.1.1"
}

# Employee login (desktop app)
POST /api/auth/employee/login
{
  "email": "employee@company.com",
  "password": "Employee@123",
  "full_name": "John Doe",
  "consent_accepted": true,
  "pc_name": "DESKTOP-ABC",
  "ip_address": "192.168.1.2"
}

# Verify admin password (for uninstall)
POST /api/auth/admin/verify-password
{
  "password": "Admin@123",
  "employee_id": "employee-uuid"
}
```

---

## 🔄 Real-Time Configuration Sync

When admin changes settings:

```
1. Admin updates setting via dashboard
   ↓
2. Backend saves to database + logs change
   ↓
3. Backend emits WebSocket event:
   - Global: `employee:config-update`
   - Specific: `employee:{id}:config-update`
   ↓
4. Desktop apps receive update instantly
   ↓
5. Desktop apps apply new configuration
   ↓
6. Desktop apps send acknowledgment
```

### Desktop App Integration

```javascript
// Desktop app connects to WebSocket
const socket = io('http://localhost:5000');

// Listen for config updates
socket.on('employee:config-update', (data) => {
  console.log('Config updated:', data);
  
  // Apply new settings
  if (data.setting_key === 'screenshot_interval') {
    updateScreenshotInterval(data.setting_value);
  }
});

// Employee-specific updates
socket.on(`employee:${employeeId}:config-update`, (settings) => {
  applyCustomSettings(settings);
});
```

---

## 📊 Database Schema Highlights

### Global Settings Table
```sql
CREATE TABLE global_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE,
    setting_value TEXT,
    data_type ENUM('string', 'number', 'boolean', 'json'),
    description TEXT,
    category VARCHAR(50),
    updated_by CHAR(36),
    updated_at DATETIME
);
```

### Employee Settings Table (Overrides)
```sql
CREATE TABLE employee_settings (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36),
    setting_key VARCHAR(100),
    setting_value TEXT,
    data_type ENUM('string', 'number', 'boolean', 'json'),
    is_override BOOLEAN DEFAULT TRUE,
    updated_by CHAR(36),
    UNIQUE KEY (employee_id, setting_key)
);
```

### Config History (Audit Trail)
```sql
CREATE TABLE config_history (
    id CHAR(36) PRIMARY KEY,
    config_type ENUM('GLOBAL', 'EMPLOYEE_SPECIFIC'),
    employee_id CHAR(36),
    setting_key VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by CHAR(36),
    change_reason TEXT,
    created_at DATETIME
);
```

---

## 🛡️ Security Features

### Admin Authentication
- JWT-based authentication
- Role-based access (SUPER_ADMIN, ADMIN, HR)
- Password hashing with bcrypt

### Uninstall Protection
```sql
-- Uninstall requires admin password verification
POST /api/auth/admin/verify-password

-- All attempts logged
INSERT INTO tamper_alerts (alert_type, action_attempted, status)
VALUES ('UNINSTALL_ATTEMPT', 'Password entered', 'BLOCKED');
```

### Tamper Detection
- Process kill detection
- File modification monitoring
- Service stop attempts
- Registry change tracking

---

## 📧 Monthly Email Reports

Configured via settings:

```javascript
monthly_email_enabled: true
monthly_email_day: 1  // 1st of each month
include_pdf_report: false
```

Email content:
```
Subject: Monthly Attendance Report - January 2026

Dear John Doe,

Your attendance summary for January 2026:

• Total Working Hours: 160.5
• Total Break Time: 32.0
• Total Overtime: 8.5
• Days Worked: 22

View detailed report: [Google Sheets Link]

---
This is an automated email from Employee Monitoring System
```

---

## 🎨 Admin Dashboard Features

### Settings Page
- **Tabbed Interface**: All Settings, Screenshot, Monitoring, Security, Integration
- **Real-time Validation**: Input validation before save
- **Change Detection**: Shows unsaved changes warning
- **Bulk Operations**: Save all changes at once
- **Export/Import**: Backup and restore configurations
- **Category Grouping**: Settings organized by category
- **Visual Feedback**: Toast notifications for all actions

### Other Pages (To be implemented)
- Dashboard: Overview stats
- Employees: Manage employee accounts, view individual settings
- Live Monitoring: Real-time screen view
- Screenshots: Browse and search screenshots
- Reports: Monthly/weekly reports
- Alerts: Security alerts dashboard

---

## 🔧 Environment Variables

```env
# Backend (.env)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=employee_monitoring

JWT_SECRET=your_jwt_secret
ADMIN_MASTER_PASSWORD=MasterPass123!

SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=app_password

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REFRESH_TOKEN=xxx

AWS_S3_BUCKET=screenshots-bucket
```

---

## 📝 Development Roadmap

### Phase 1: Foundation ✅
- [x] MySQL schema with admin control tables
- [x] Backend API with settings controller
- [x] React admin dashboard
- [x] Settings management UI
- [x] WebSocket real-time sync

### Phase 2: Desktop App (Next)
- [ ] Windows C# .NET desktop application
- [ ] One-time login with consent
- [ ] Activity monitoring service
- [ ] Screenshot capture engine
- [ ] WebSocket client for config sync
- [ ] Anti-tamper protection

### Phase 3: Integrations
- [ ] Google Sheets API integration
- [ ] Email service (monthly reports)
- [ ] AWS S3 screenshot storage
- [ ] Live screen streaming

### Phase 4: Advanced Features
- [ ] Live screen monitoring (WebRTC)
- [ ] Advanced analytics
- [ ] Multi-tenant support
- [ ] Mobile app for admin

---

## 🤝 Contributing

This is a proprietary enterprise system. Contact admin for access.

## 📄 License

Proprietary - All Rights Reserved

---

## 🆘 Support

For setup help or issues:
1. Check database connection
2. Verify all .env variables
3. Check logs in `backend-server/logs/`
4. Review WebSocket connection status

## 🔗 Links

- Backend API: http://localhost:5000
- Admin Dashboard: http://localhost:3000
- API Documentation: http://localhost:5000/api/health

---

**Made with enterprise-grade security and complete admin control** 🚀
