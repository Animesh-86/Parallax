@echo off
echo Building Parallax Backend...
cd backend\backend
call mvn clean compile
if %errorlevel% neq 0 (
    echo.
    echo Backend build failed!
    exit /b %errorlevel%
)
echo.
echo Backend build successful!
exit /b 0
