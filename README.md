# 📘 Reuters Script Manager

Modern, readable documentation for the desktop application and its Python scripts — styled to match the User Guide for a consistent experience.

---

## 🎯 Overview

The Reuters Script Manager helps you:
- 🔐 Analyze and compare Snyk vulnerability reports
- 🤖 Review DataDome verified bots and AI agents
- 🧭 View all related documentation directly in-app

---

## 🧩 Features

- 🧰 Automatic Python environment management (virtualenv + `requirements.txt`)
- 👁️ Real-time file monitoring and requirement validation
- 📚 In-app Markdown documentation viewer with syntax highlighting
- 🎛️ Smart controls (disabled until requirements are met)
- 🧪 Supported scripts: Snyk Report Compare, DataDome Verified Bots Compare

---

## 🚀 Getting Started

1. Install dependencies: `npm install`
2. Run the app (development): `npm run dev`  
   Alternatively, desktop with Tauri: `npm run tauri dev`
3. Build for production: `npm run build` and `npm run tauri build`

---

## 📚 Documentation Map

Documentation lives under `Documents/` and is accessible from within the app:

### 🧭 Main Application Docs
- `Documents/Main/README.md` — App overview, features, usage
- `Documents/Main/VS_CODE_GUIDE.md` — Developer setup and VS Code tips
- `Documents/Main/BUILD_STATUS.md` — Build and packaging information

### 🔐 Snyk Report Compare
- `Documents/Snyk Report Compare/README.md` — Technical overview
- `Documents/Snyk Report Compare/Snyk_Compare_Script_User_Guide.md` — User Guide

### 🤖 DataDome Verified Bots Compare
- `Documents/DataDome Verified Bots Compare/README.md` — Technical overview
- `Documents/DataDome Verified Bots Compare/DataDome_Compare_Script_User_Guide.md` — User Guide

---

## 🧪 Scripts

- `scripts/snyk_compare.py` — Compare Snyk reports over time
- `scripts/datadome_compare.py` — Compare DataDome verified bots

---

## 🛠️ Tech Stack

- Frontend: React + TypeScript
- Backend: Rust (Tauri)
- Packaging: Tauri
- Documentation: Markdown rendered in-app

---

## 🎯 Usage

1. Launch the application (development or built desktop)
2. Select a script: Snyk or DataDome
3. Ensure required files are available (status indicators guide you)
4. Open the relevant User Guide for step-by-step instructions
5. Execute the script once requirements are met

---

## 📊 Script Requirements

### Snyk Report Compare
- `Snyk Report CAT YYYY-MM-DD.xlsx` (latest report)
- `Snyk Vulnerability tracker.xlsx` (tracking file)

### DataDome Compare
- `DataDome_Export_AI_agents_YYYY-MM-DD.xlsx`
- `DataDome_Export_verified_bots_YYYY-MM-DD.xlsx`
- `DataDome Bots - Block or Whitelist.xlsx`

---

## 🔧 Configuration

The application automatically configures:
- Python virtual environment in `~/.reuters-script-manager/.venv`
- Required Python packages: `pandas`, `openpyxl`, `colorama`
- Working directory relative to application location

---

## 🛠️ Development

### Available Scripts
- `npm run dev` — Start Vite development server
- `npm run build` — Build frontend for production
- `npm run tauri dev` — Start Tauri development mode
- `npm run tauri build` — Build complete application

### Key Technologies
- React 18 with TypeScript
- Tauri (Rust)
- Tailwind CSS
- React Markdown

---

## 📜 License

Private — Internal Use Only

## 🤝 Contributing

This is a private repository. For questions or contributions, contact the development team.

---

Reuters Script Manager — Professional desktop automation for script management and execution.