-- Fix Admin Login Password
-- This updates the admin user with correct bcrypt hash for 'Admin@123'

USE employee_monitoring;

-- Update admin password
UPDATE admin_users 
SET password_hash = '$2b$10$hmHpmxD9BMHVVqBeIUW7Pu6mPb8vPLJ8hfO0OFYOP.YNJvt41Tlwm'
WHERE email = 'admin@company.com';

-- Verify the update
SELECT email, full_name, role, 
       LEFT(password_hash, 20) as hash_preview 
FROM admin_users 
WHERE email = 'admin@company.com';
