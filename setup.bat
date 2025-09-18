@echo off
REM Reuters Script Manager - Setup and Build Script for Windows
REM This script helps set up the development environment and build the application

echo 🚀 Reuters Script Manager - Setup and Build Script
echo ==================================================

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or later.
    exit /b 1
)

REM Check if Rust is installed
where rustc >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Rust is not installed. Please install Rust from https://rustup.rs/
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install dependencies
echo 📦 Installing Node.js dependencies...
npm install

REM Install Tauri CLI if not already installed
where tauri >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing Tauri CLI...
    npm install -g @tauri-apps/cli
)

echo ✅ Dependencies installed successfully

REM Parse command line arguments
if "%1"=="dev" goto dev
if "%1"=="build" goto build
if "%1"=="help" goto help
if "%1"=="" goto help
goto unknown

:dev
echo 🔧 Starting development server...
npm run tauri dev
goto end

:build
echo 🏗️  Building for production...
npm run tauri build
echo ✅ Build completed! Check src-tauri\target\release\bundle\ for output files
goto end

:help
echo Usage: %0 [command]
echo.
echo Commands:
echo   dev     Start development server
echo   build   Build for production
echo   help    Show this help message
echo.
echo Examples:
echo   %0 dev    # Start development
echo   %0 build  # Build for production
goto end

:unknown
echo ❌ Unknown command: %1
goto help

:end