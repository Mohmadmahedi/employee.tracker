# 🎯 ADMIN CONTROL SYSTEM - Quick Reference

## What Admin Can Control

### ✅ Screenshot Settings (Real-time)
| Setting | Control | Impact |
|---------|---------|--------|
| Enable/Disable | Toggle ON/OFF | Start/stop all screenshots |
| First Delay | 15-60 minutes | When first screenshot happens |
| Interval | 15-120 minutes | Time between screenshots |
| Quality | 1-100% | JPEG compression quality |
| Active Only | true/false | Capture only when user active |

### ✅ Monitoring Settings
| Setting | Control | Impact |
|---------|---------|--------|
| Enable/Disable | Toggle ON/OFF | Start/stop all monitoring |
| Idle Threshold | 1-30 minutes | When user is considered idle |
| Heartbeat Interval | 1-30 minutes | Server update frequency |
| Screen Lock Detection | true/false | Track screen lock as break |

### ✅ Security Settings
| Setting | Control | Impact |
|---------|---------|--------|
| Tamper Protection | Toggle ON/OFF | Block unauthorized actions |
| Uninstall Protection | Toggle ON/OFF | Require admin password |
| File Integrity Check | Toggle ON/OFF | Monitor file changes |
| Process Watchdog | Toggle ON/OFF | Auto-restart if killed |

### ✅ Integration Settings
| Setting | Control | Impact |
|---------|---------|--------|
| Google Sheets Sync | Toggle ON/OFF | Enable/disable sync |
| Sync Interval | realtime/hourly/daily | Sync frequency |
| Monthly Email | Toggle ON/OFF | Auto-send reports |
| Email Day | 1-28 | Day of month to send |

### ✅ Working Hours
| Setting | Control | Impact |
|---------|---------|--------|
| Work Day Hours | 6-12 hours | Standard work day |
| Enable Overtime | true/false | Calculate overtime |
| Auto Logout | true/false | Logout after work hours |

---

## How to Control Desktop Apps

### Method 1: Global Settings (All Employees)

**Admin Dashboard → Settings → Global Settings**

Example: Change screenshot interval for ALL employees

```javascript
1. Go to Settings page
2. Find "Screenshot Interval" 
3. Change from 30 to 45 minutes
4. Click "Save All Changes"

Result:
✅ All desktop apps update in <5 seconds
✅ No restart required
✅ Change logged in database
```

### Method 2: Employee-Specific Override

**Admin Dashboard → Employees → Select Employee → Custom Settings**

Example: Different settings for one employee

```javascript
1. Go to Employees page
2. Click employee name
3. Click "Custom Settings"
4. Override any setting:
   - Screenshot Interval: 60 min (only for this employee)
   - Idle Threshold: 10 min
5. Save

Result:
✅ This employee uses custom settings
✅ Other employees use global settings
✅ Can revert to global anytime
```

---

## Real-Time Updates

```
Admin changes setting
    ↓ (< 1 second)
Backend saves to MySQL
    ↓ (< 1 second)
WebSocket emits event
    ↓ (< 3 seconds)
Desktop apps receive update
    ↓ (< 1 second)
Desktop apps apply settings
    ↓
DONE ✅ (Total: < 5 seconds)
```

**No employee action required!**
**No app restart required!**

---

## API Control (Advanced)

### Update Single Setting
```bash
curl -X PUT http://localhost:5000/api/settings/global/screenshot_interval \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "screenshot_interval",
    "setting_value": 45,
    "reason": "Reducing load"
  }'
```

### Bulk Update
```bash
curl -X POST http://localhost:5000/api/settings/global/bulk-update \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {"key": "screenshot_interval", "value": 45},
      {"key": "screenshot_quality", "value": 80},
      {"key": "heartbeat_interval", "value": 10}
    ],
    "reason": "Performance optimization"
  }'
```

### Employee Override
```bash
curl -X PUT http://localhost:5000/api/settings/employee/EMPLOYEE_ID/screenshot_interval \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "screenshot_interval",
    "setting_value": 60,
    "data_type": "number",
    "reason": "Remote employee - less frequent"
  }'
```

---

## Common Admin Tasks

### Task 1: Temporarily Disable All Monitoring
```
Settings → Monitoring → Monitoring Enabled: OFF → Save
```
Desktop apps stop all tracking immediately.

### Task 2: Reduce Screenshot Frequency
```
Settings → Screenshot → Interval: 30 → 60 → Save
```
All apps now capture every 60 minutes.

### Task 3: Different Settings for Specific Employee
```
Employees → John Doe → Custom Settings
→ Override: Screenshot Interval = 120 min
→ Save
```
Only John's app uses 120 min, others use global setting.

### Task 4: Emergency Stop All Screenshots
```
Settings → Screenshot → Enabled: OFF → Save
```
All apps stop screenshots in < 5 seconds.

### Task 5: View Config Change History
```
Settings → History Tab
```
See who changed what and when.

### Task 6: Backup Settings
```
Settings → Export → Download JSON
```
Save all settings to file.

### Task 7: Restore Settings
```
Settings → Import → Upload JSON
```
Restore from backup file.

---

## Database Tables

### global_settings
```sql
-- Stores default settings for all employees
SELECT setting_key, setting_value FROM global_settings;

# screenshot_interval  | 30
# screenshot_quality   | 75
# monitoring_enabled   | true
# ...
```

### employee_settings
```sql
-- Stores employee-specific overrides
SELECT employee_id, setting_key, setting_value 
FROM employee_settings;

# john-uuid  | screenshot_interval | 60
# jane-uuid  | idle_threshold     | 10
```

### config_history
```sql
-- Audit trail of all changes
SELECT * FROM config_history 
ORDER BY created_at DESC LIMIT 10;

# Shows: who changed what, when, old value, new value, reason
```

---

## WebSocket Events

### Server → Desktop App Events

```javascript
// Global config update
{
  "event": "employee:config-update",
  "data": {
    "type": "GLOBAL",
    "setting_key": "screenshot_interval",
    "setting_value": "45"
  }
}

// Employee-specific update
{
  "event": "employee:EMPLOYEE_ID:config-update",
  "data": {
    "type": "EMPLOYEE_SPECIFIC",
    "setting_key": "screenshot_interval",
    "setting_value": "60"
  }
}

// Bulk update
{
  "event": "employee:config-update",
  "data": {
    "type": "GLOBAL_BULK",
    "settings": [
      {"key": "screenshot_interval", "value": 45},
      {"key": "screenshot_quality", "value": 80}
    ]
  }
}
```

### Desktop App → Server Events

```javascript
// Heartbeat (every X minutes)
{
  "event": "employee:heartbeat",
  "data": {
    "employeeId": "uuid",
    "status": "WORKING",
    "timestamp": "2026-01-03T10:30:00Z"
  }
}

// Config acknowledgment
{
  "event": "employee:config-received",
  "data": {
    "employeeId": "uuid",
    "setting_key": "screenshot_interval",
    "applied": true
  }
}
```

---

## Security

### Admin Authentication
```
Admin login → JWT token → Valid 24 hours → Auto-refresh
```

### Uninstall Protection
```
Employee tries to uninstall
  ↓
Desktop app shows: "Enter Admin Password"
  ↓
Desktop app sends to: POST /api/auth/admin/verify-password
  ↓
Backend checks password
  ↓
If correct: Allow uninstall
If wrong: Block & Alert admin
```

### Tamper Alerts
```sql
-- All tamper attempts logged
SELECT * FROM tamper_alerts;

# employee_id | alert_type        | action_attempted      | status
# john-uuid   | UNINSTALL_ATTEMPT | Password incorrect    | BLOCKED
# jane-uuid   | PROCESS_KILL      | Task Manager force    | BLOCKED
```

---

## Performance

### Settings Load Time
```
First load: ~200ms (fetch from MySQL)
Subsequent: ~50ms (cached)
Real-time update: <5s (WebSocket)
```

### Screenshot Upload
```
Capture: ~100ms
Compress: ~50ms
Encrypt: ~30ms
Upload: ~500ms (depends on network)
Total: ~700ms per screenshot
```

### Database Queries
```
Get all settings: ~10ms
Update setting: ~5ms
Log history: ~3ms
```

---

## Monitoring

### Check System Health
```bash
# Backend health
curl http://localhost:5000/api/health

# Response:
{
  "status": "OK",
  "timestamp": "2026-01-03T10:30:00Z",
  "uptime": 3600
}
```

### View Logs
```bash
# Application logs
tail -f backend-server/logs/combined.log

# Error logs
tail -f backend-server/logs/error.log
```

### Database Stats
```sql
-- Total employees
SELECT COUNT(*) FROM employees;

-- Active employees
SELECT COUNT(*) FROM employees WHERE is_active = TRUE;

-- Settings count
SELECT COUNT(*) FROM global_settings;

-- Overrides count
SELECT COUNT(*) FROM employee_settings;

-- Config changes today
SELECT COUNT(*) FROM config_history 
WHERE DATE(created_at) = CURDATE();
```

---

## Troubleshooting

### Desktop app not receiving updates
```
1. Check WebSocket connection
2. Check employee_id in database
3. Check backend logs
4. Restart desktop app
```

### Settings not saving
```
1. Check admin authentication
2. Check database connection
3. Check validation errors
4. Check backend logs
```

### Screenshots not uploading
```
1. Check screenshot_enabled setting
2. Check network connection
3. Check upload path permissions
4. Check S3 credentials (if using)
```

---

## Best Practices

✅ Always provide a reason when changing settings
✅ Test changes on one employee before applying globally
✅ Export settings backup before major changes
✅ Monitor config_history regularly
✅ Review tamper_alerts daily
✅ Keep employee overrides minimal (use global when possible)
✅ Document why employee overrides exist

---

## Quick Commands

```bash
# Start backend
cd backend-server && npm run dev

# Start dashboard
cd desktop-app && npm run dev

# Check MySQL
mysql -u root -p employee_monitoring

# View settings
SELECT * FROM global_settings;

# View history
SELECT * FROM config_history ORDER BY created_at DESC LIMIT 20;

# View alerts
SELECT * FROM tamper_alerts WHERE status = 'PENDING';

# Export settings
curl http://localhost:5000/api/settings/export \
  -H "Authorization: Bearer TOKEN" > backup.json
```

---

**Admin has COMPLETE control over every aspect of employee desktop applications!** 🎉
