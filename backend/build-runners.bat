@echo off
REM ============================================================
REM Parallax — Build all Docker runner images
REM Run this before starting the backend for the first time
REM ============================================================

echo.
echo ============================================
echo  Building Parallax Docker Runner Images
echo ============================================
echo.

echo [1/4] Building parallax-python-runner...
docker build -t parallax-python-runner "%~dp0parallax-python-runner\runner"
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Python runner!
    exit /b 1
)

echo [2/4] Building parallax-java-runner...
docker build -t parallax-java-runner "%~dp0parallax-java-runner\runner"
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Java runner!
    exit /b 1
)

echo [3/4] Building parallax-js-runner...
docker build -t parallax-js-runner "%~dp0parallax-js-runner\runner"
if %errorlevel% neq 0 (
    echo ERROR: Failed to build JS runner!
    exit /b 1
)

echo [4/4] Building parallax-cpp-runner...
docker build -t parallax-cpp-runner "%~dp0parallax-cpp-runner\runner"
if %errorlevel% neq 0 (
    echo ERROR: Failed to build C++ runner!
    exit /b 1
)

echo.
echo ============================================
echo  All runner images built successfully!
echo ============================================
echo.
echo Verifying images:
docker images --format "  {{.Repository}}:{{.Tag}} ({{.Size}})" ^
    parallax-python-runner ^
    parallax-java-runner ^
    parallax-js-runner ^
    parallax-cpp-runner

echo.
echo You can now start the backend with: mvn spring-boot:run
