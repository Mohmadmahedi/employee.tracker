# PowerShell script to create .env file

Write-Host "Creating .env file for backend server..." -ForegroundColor Green
Write-Host ""

$envContent = @"
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# MySQL Database - CONFIGURE THESE!
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=employee_monitoring

# JWT Secret Keys
JWT_SECRET=super_secret_jwt_key_change_this_in_production_12345
JWT_REFRESH_SECRET=refresh_token_secret_key_change_this_67890
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d

# Admin Master Password
ADMIN_MASTER_PASSWORD=MasterUninstallPass123!

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
SCREENSHOT_PATH=./uploads/screenshots

# AWS S3 - Optional
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=employee-monitoring-screenshots

# Email Configuration - Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@company.com
EMAIL_FROM_NAME=Employee Monitoring System

# Google Sheets - Optional
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
GOOGLE_REFRESH_TOKEN=

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
"@

$envContent | Out-File -FilePath ".env" -Encoding ASCII

Write-Host "✓ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Edit .env file and set your MySQL password:" -ForegroundColor Yellow
Write-Host "  DB_PASSWORD=your_mysql_password_here" -ForegroundColor Yellow
Write-Host ""
Write-Host "Done! You can now edit .env file to add your MySQL password."
