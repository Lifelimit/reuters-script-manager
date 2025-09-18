#!/bin/bash

# Reuters Script Manager - Setup and Build Script
# This script helps set up the development environment and build the application

set -e

echo "🚀 Reuters Script Manager - Setup and Build Script"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or later."
    exit 1
fi

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust from https://rustup.rs/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Tauri CLI if not already installed
if ! command -v tauri &> /dev/null; then
    echo "📦 Installing Tauri CLI..."
    npm install -g @tauri-apps/cli
fi

echo "✅ Dependencies installed successfully"

# Function to build for development
dev() {
    echo "🔧 Starting development server..."
    npm run tauri dev
}

# Function to build for production
build() {
    echo "🏗️  Building for production..."
    npm run tauri build
    echo "✅ Build completed! Check src-tauri/target/release/bundle/ for output files"
}

# Function to show help
help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  dev     Start development server"
    echo "  build   Build for production"
    echo "  help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev    # Start development"
    echo "  $0 build  # Build for production"
}

# Parse command line arguments
case "${1:-help}" in
    dev)
        dev
        ;;
    build)
        build
        ;;
    help|--help|-h)
        help
        ;;
    *)
        echo "❌ Unknown command: $1"
        help
        exit 1
        ;;
esac