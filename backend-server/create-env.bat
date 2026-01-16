@echo off
echo Creating .env file for backend server...
echo.

(
echo NODE_ENV=development
echo PORT=5000
echo API_URL=http://localhost:5000
echo.
echo # MySQL Database - CONFIGURE THESE!
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USER=root
echo DB_PASSWORD=
echo DB_NAME=employee_monitoring
echo.
echo # JWT Secret Keys
echo JWT_SECRET=super_secret_jwt_key_change_this_in_production_12345
echo JWT_REFRESH_SECRET=refresh_token_secret_key_change_this_67890
echo JWT_EXPIRES_IN=24h
echo JWT_REFRESH_EXPIRES_IN=30d
echo.
echo # Admin Master Password
echo ADMIN_MASTER_PASSWORD=MasterUninstallPass123!
echo.
echo # File Upload
echo UPLOAD_PATH=./uploads
echo MAX_FILE_SIZE=10485760
echo SCREENSHOT_PATH=./uploads/screenshots
echo.
echo # AWS S3 - Optional
echo AWS_ACCESS_KEY_ID=
echo AWS_SECRET_ACCESS_KEY=
echo AWS_REGION=us-east-1
echo AWS_S3_BUCKET=employee-monitoring-screenshots
echo.
echo # Email Configuration - Optional
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_SECURE=false
echo SMTP_USER=
echo SMTP_PASSWORD=
echo EMAIL_FROM=noreply@company.com
echo EMAIL_FROM_NAME=Employee Monitoring System
echo.
echo # Google Sheets - Optional
echo GOOGLE_CLIENT_ID=
echo GOOGLE_CLIENT_SECRET=
echo GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
echo GOOGLE_REFRESH_TOKEN=
echo.
echo # CORS
echo CORS_ORIGIN=http://localhost:3000
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW=15
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # Logging
echo LOG_LEVEL=info
echo LOG_FILE=./logs/app.log
) > .env

echo.
echo ✓ .env file created successfully!
echo.
echo IMPORTANT: Edit .env file and set your MySQL password:
echo   DB_PASSWORD=your_mysql_password_here
echo.
pause
