-- =====================================================
-- EMPLOYEE MONITORING SYSTEM - MySQL Database Schema
-- With Full Admin Control over Desktop App Settings
-- =====================================================

-- Database Creation
CREATE DATABASE IF NOT EXISTS employee_monitoring;
USE employee_monitoring;

-- =====================================================
-- 1. EMPLOYEES TABLE
-- =====================================================
CREATE TABLE employees (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    google_sheet_id VARCHAR(255),
    google_sheet_url TEXT,
    
    -- Consent & Legal
    consent_accepted_at DATETIME,
    consent_version VARCHAR(50),
    consent_ip VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_seen DATETIME,
    pc_name VARCHAR(255),
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 2. ADMIN USERS TABLE
-- =====================================================
CREATE TABLE admin_users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'ADMIN', 'HR') DEFAULT 'HR',
    
    -- Master uninstall password
    uninstall_password_hash VARCHAR(255),
    
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 3. ADMIN CONTROL SETTINGS (GLOBAL)
-- Admin can control ALL desktop app behavior from here
-- =====================================================
CREATE TABLE global_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    category VARCHAR(50),
    updated_by CHAR(36),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default global settings
INSERT INTO global_settings (setting_key, setting_value, data_type, description, category) VALUES
-- Screenshot Settings
('screenshot_enabled', 'true', 'boolean', 'Enable/disable screenshot capture globally', 'screenshot'),
('screenshot_first_delay', '15', 'number', 'Minutes before first screenshot', 'screenshot'),
('screenshot_interval', '30', 'number', 'Minutes between screenshots', 'screenshot'),
('screenshot_quality', '75', 'number', 'JPEG quality (1-100)', 'screenshot'),
('screenshot_on_active_only', 'true', 'boolean', 'Capture only when user is active', 'screenshot'),

-- Activity Monitoring
('monitoring_enabled', 'true', 'boolean', 'Enable/disable activity monitoring', 'monitoring'),
('idle_threshold', '5', 'number', 'Minutes before considering user idle', 'monitoring'),
('heartbeat_interval', '5', 'number', 'Minutes between activity updates to server', 'monitoring'),
('detect_screen_lock', 'true', 'boolean', 'Detect screen lock as break time', 'monitoring'),

-- Working Hours
('work_day_hours', '8', 'number', 'Standard work day hours', 'time'),
('enable_overtime', 'true', 'boolean', 'Calculate overtime hours', 'time'),
('auto_logout_enabled', 'false', 'boolean', 'Auto logout after work hours', 'time'),

-- Security & Protection
('tamper_protection_enabled', 'true', 'boolean', 'Enable anti-tamper protection', 'security'),
('uninstall_protection_enabled', 'true', 'boolean', 'Require password to uninstall', 'security'),
('file_integrity_check', 'true', 'boolean', 'Monitor file modifications', 'security'),
('process_watchdog_enabled', 'true', 'boolean', 'Auto-restart if process killed', 'security'),

-- Google Sheets
('sheets_sync_enabled', 'true', 'boolean', 'Sync data to Google Sheets', 'integration'),
('sheets_sync_interval', 'daily', 'string', 'Sync frequency: realtime, hourly, daily', 'integration'),

-- Email Reports
('monthly_email_enabled', 'true', 'boolean', 'Send monthly reports to employees', 'email'),
('monthly_email_day', '1', 'number', 'Day of month to send report (1-28)', 'email'),
('include_pdf_report', 'false', 'boolean', 'Attach PDF to monthly email', 'email'),

-- Live Monitoring
('live_screen_enabled', 'true', 'boolean', 'Enable admin live screen viewing', 'monitoring'),
('live_screen_quality', '60', 'number', 'Live screen stream quality', 'monitoring'),
('live_screen_fps', '2', 'number', 'Frames per second for live stream', 'monitoring'),

-- Data Retention
('screenshot_retention_days', '90', 'number', 'Days to keep screenshots', 'data'),
('log_retention_days', '365', 'number', 'Days to keep activity logs', 'data');

-- =====================================================
-- 4. EMPLOYEE-SPECIFIC SETTINGS
-- Admin can override global settings per employee
-- =====================================================
CREATE TABLE employee_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    is_override BOOLEAN DEFAULT TRUE,
    updated_by CHAR(36),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_employee_setting (employee_id, setting_key),
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 5. ATTENDANCE SESSIONS (Heartbeat Data)
-- =====================================================
CREATE TABLE attendance_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    session_date DATE NOT NULL,
    state ENUM('WORKING', 'BREAK', 'IDLE', 'OFFLINE') NOT NULL,
    timestamp DATETIME NOT NULL,
    pc_name VARCHAR(255),
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_date (employee_id, session_date),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 6. DAILY ATTENDANCE SUMMARY
-- =====================================================
CREATE TABLE daily_attendance (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    attendance_date DATE NOT NULL,
    
    -- Time tracking
    login_time TIME,
    logout_time TIME,
    working_hours DECIMAL(5,2) DEFAULT 0.00,
    break_hours DECIMAL(5,2) DEFAULT 0.00,
    idle_hours DECIMAL(5,2) DEFAULT 0.00,
    overtime_hours DECIMAL(5,2) DEFAULT 0.00,
    
    -- Metadata
    screenshot_count INT DEFAULT 0,
    synced_to_sheets BOOLEAN DEFAULT FALSE,
    synced_at DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_date (employee_id, attendance_date),
    INDEX idx_date (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 7. SCREENSHOTS TABLE
-- =====================================================
CREATE TABLE screenshots (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    screenshot_time DATETIME NOT NULL,
    
    -- Storage
    file_path VARCHAR(500),
    s3_url TEXT,
    file_size_kb INT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    
    -- Thumbnail
    thumbnail_url TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_time (employee_id, screenshot_time DESC),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 8. TAMPER ALERTS TABLE
-- =====================================================
CREATE TABLE tamper_alerts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    
    -- Alert details
    alert_type ENUM('UNINSTALL_ATTEMPT', 'PROCESS_KILL', 'SERVICE_STOP', 'FILE_MODIFY', 'REGISTRY_CHANGE', 'OTHER') NOT NULL,
    action_attempted VARCHAR(255) NOT NULL,
    status ENUM('BLOCKED', 'ALLOWED', 'PENDING') DEFAULT 'BLOCKED',
    
    -- Context
    pc_name VARCHAR(255),
    ip_address VARCHAR(50),
    alert_time DATETIME NOT NULL,
    
    -- Admin action
    reviewed_by CHAR(36),
    reviewed_at DATETIME,
    admin_notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_employee (employee_id),
    INDEX idx_time (alert_time DESC),
    INDEX idx_type (alert_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 9. UNINSTALL REQUESTS
-- =====================================================
CREATE TABLE uninstall_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    
    -- Request details
    reason TEXT,
    requested_at DATETIME NOT NULL,
    
    -- Admin approval
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    reviewed_by CHAR(36),
    reviewed_at DATETIME,
    admin_notes TEXT,
    
    -- One-time code for approved uninstall
    uninstall_code VARCHAR(10),
    code_expires_at DATETIME,
    code_used BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 10. MONTHLY REPORTS
-- =====================================================
CREATE TABLE monthly_reports (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    report_month INT NOT NULL,
    report_year INT NOT NULL,
    
    -- Summary data
    total_working_hours DECIMAL(8,2) DEFAULT 0.00,
    total_break_hours DECIMAL(8,2) DEFAULT 0.00,
    total_overtime_hours DECIMAL(8,2) DEFAULT 0.00,
    total_days_worked INT DEFAULT 0,
    total_screenshots INT DEFAULT 0,
    
    -- Report delivery
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at DATETIME,
    pdf_url TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_month (employee_id, report_month, report_year),
    INDEX idx_month_year (report_year, report_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 11. ACTIVITY LOGS (Audit Trail)
-- =====================================================
CREATE TABLE activity_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Actor
    actor_type ENUM('ADMIN', 'EMPLOYEE', 'SYSTEM') NOT NULL,
    actor_id CHAR(36),
    
    -- Action
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    entity_id CHAR(36),
    
    -- Details
    description TEXT,
    metadata JSON,
    ip_address VARCHAR(50),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_actor (actor_type, actor_id),
    INDEX idx_action (action),
    INDEX idx_time (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 12. LIVE SCREEN SESSIONS
-- =====================================================
CREATE TABLE live_screen_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    admin_id CHAR(36) NOT NULL,
    
    -- Session details
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    duration_seconds INT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_active (is_active),
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 13. CONFIG CHANGE HISTORY
-- Track all admin changes to settings
-- =====================================================
CREATE TABLE config_history (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Config details
    config_type ENUM('GLOBAL', 'EMPLOYEE_SPECIFIC') NOT NULL,
    employee_id CHAR(36),
    setting_key VARCHAR(100) NOT NULL,
    
    -- Change tracking
    old_value TEXT,
    new_value TEXT,
    
    -- Admin
    changed_by CHAR(36) NOT NULL,
    change_reason TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_time (created_at DESC),
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- Current active settings per employee (with global fallback)
CREATE VIEW employee_effective_settings AS
SELECT 
    e.id AS employee_id,
    e.full_name AS employee_name,
    COALESCE(es.setting_key, gs.setting_key) AS setting_key,
    COALESCE(es.setting_value, gs.setting_value) AS setting_value,
    COALESCE(es.data_type, gs.data_type) AS data_type,
    IF(es.id IS NOT NULL, 'EMPLOYEE_OVERRIDE', 'GLOBAL') AS source
FROM employees e
CROSS JOIN global_settings gs
LEFT JOIN employee_settings es 
    ON e.id = es.employee_id AND gs.setting_key = es.setting_key
WHERE e.is_active = TRUE;

-- Daily attendance summary with employee info
CREATE VIEW attendance_summary AS
SELECT 
    da.id,
    da.attendance_date,
    e.id AS employee_id,
    e.email,
    e.full_name,
    da.login_time,
    da.logout_time,
    da.working_hours,
    da.break_hours,
    da.overtime_hours,
    da.screenshot_count,
    da.synced_to_sheets
FROM daily_attendance da
JOIN employees e ON da.employee_id = e.id;

-- Pending alerts summary
CREATE VIEW pending_alerts_summary AS
SELECT 
    ta.id,
    ta.alert_time,
    ta.alert_type,
    ta.action_attempted,
    e.full_name AS employee_name,
    e.email AS employee_email,
    ta.pc_name,
    ta.status
FROM tamper_alerts ta
JOIN employees e ON ta.employee_id = e.id
WHERE ta.reviewed_by IS NULL
ORDER BY ta.alert_time DESC;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Get effective setting for an employee
DELIMITER //
CREATE PROCEDURE GetEmployeeSetting(
    IN p_employee_id CHAR(36),
    IN p_setting_key VARCHAR(100)
)
BEGIN
    SELECT 
        COALESCE(
            (SELECT setting_value FROM employee_settings 
             WHERE employee_id = p_employee_id AND setting_key = p_setting_key),
            (SELECT setting_value FROM global_settings WHERE setting_key = p_setting_key)
        ) AS setting_value;
END //

-- Get all effective settings for an employee
CREATE PROCEDURE GetAllEmployeeSettings(
    IN p_employee_id CHAR(36)
)
BEGIN
    SELECT 
        gs.setting_key,
        COALESCE(es.setting_value, gs.setting_value) AS setting_value,
        COALESCE(es.data_type, gs.data_type) AS data_type,
        gs.category,
        IF(es.id IS NOT NULL, TRUE, FALSE) AS is_override
    FROM global_settings gs
    LEFT JOIN employee_settings es 
        ON es.employee_id = p_employee_id AND gs.setting_key = es.setting_key;
END //

-- Update setting and log change
CREATE PROCEDURE UpdateGlobalSetting(
    IN p_setting_key VARCHAR(100),
    IN p_new_value TEXT,
    IN p_admin_id CHAR(36),
    IN p_reason TEXT
)
BEGIN
    DECLARE v_old_value TEXT;
    
    -- Get old value
    SELECT setting_value INTO v_old_value 
    FROM global_settings 
    WHERE setting_key = p_setting_key;
    
    -- Update setting
    UPDATE global_settings 
    SET setting_value = p_new_value,
        updated_by = p_admin_id
    WHERE setting_key = p_setting_key;
    
    -- Log change
    INSERT INTO config_history (config_type, setting_key, old_value, new_value, changed_by, change_reason)
    VALUES ('GLOBAL', p_setting_key, v_old_value, p_new_value, p_admin_id, p_reason);
    
    -- Log activity
    INSERT INTO activity_logs (actor_type, actor_id, action, entity_type, description)
    VALUES ('ADMIN', p_admin_id, 'UPDATE_GLOBAL_SETTING', 'SETTING', 
            CONCAT('Changed ', p_setting_key, ' from "', v_old_value, '" to "', p_new_value, '"'));
END //

DELIMITER ;

-- =====================================================
-- SAMPLE DATA (FOR TESTING)
-- =====================================================

-- Create default super admin (password: Admin@123)
INSERT INTO admin_users (email, password_hash, full_name, role, uninstall_password_hash) VALUES
('admin@company.com', '$2b$10$YourHashedPasswordHere', 'System Administrator', 'SUPER_ADMIN', '$2b$10$UninstallPasswordHash');

-- Create sample employees (password: Employee@123)
INSERT INTO employees (email, password_hash, full_name, consent_accepted_at, consent_version) VALUES
('john.doe@company.com', '$2b$10$YourHashedPasswordHere', 'John Doe', NOW(), '1.0'),
('jane.smith@company.com', '$2b$10$YourHashedPasswordHere', 'Jane Smith', NOW(), '1.0');

-- =====================================================
-- END OF SCHEMA
-- =====================================================
