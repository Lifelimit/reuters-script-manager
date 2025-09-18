# 📊 Thomson Reuters Script Manager

A professional desktop application for managing and executing Thomson Reuters Python scripts with automatic environment setup, real-time file monitoring, and rich documentation support.

![Thomson Reuters](https://img.shields.io/badge/Thomson-Reuters-blue?style=flat-square)
![Tauri](https://img.shields.io/badge/Tauri-React-orange?style=flat-square)
![License](https://img.shields.io/badge/License-Private-red?style=flat-square)

## 🚀 Features

### � **Automatic Environment Management**
- ✅ Auto-creates Python virtual environments
- ✅ Installs required dependencies automatically
- ✅ Handles `requirements.txt` parsing and validation
- ✅ Cross-platform compatibility (Windows, macOS, Linux)

### 👁️ **Real-Time Monitoring**
- ✅ Live file system monitoring for required files
- ✅ Visual status indicators for file availability
- ✅ Automatic requirement validation before script execution
- ✅ Smart button states (disabled when requirements not met)

### 📚 **Rich Documentation**
- ✅ In-app Markdown documentation viewer
- ✅ Syntax highlighting for code examples
- ✅ Script-specific user guides
- ✅ Professional formatting with icons and tables

### 🎯 **Supported Scripts**
- **Snyk Report Compare**: Vulnerability analysis and tracking
- **DataDome Bot Compare**: Bot verification and management

## 🏗️ Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Tauri (Rust) + Python integration
- **Documentation**: Markdown with syntax highlighting
- **Build System**: Vite + npm
- **Icons**: Custom TR-branded SVG icons

## � Prerequisites

- **Node.js** 16+ and npm
- **Rust** (for Tauri)
- **Python** 3.8+ (automatically managed)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
npm run tauri dev
```

### 3. Build for Production
```bash
npm run tauri build
```

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── DocumentViewer.tsx    # Markdown documentation viewer
│   ├── ScriptDetailsPanel.tsx # Script info and file status
│   ├── ScriptControlPanel.tsx # Execution controls
│   └── ScriptOutputViewer.tsx # Real-time output display
├── App.tsx              # Main application component
└── main.tsx            # React entry point

src-tauri/
├── src/                 # Rust backend code
├── icons/              # Application icons
└── tauri.conf.json     # Tauri configuration

scripts/
├── snyk_compare.py     # Snyk vulnerability analysis
└── datadome_compare.py # DataDome bot management

Documents/
├── Main/               # General documentation
├── Snyk Report Compare/    # Snyk-specific guides
└── DataDome Verified Bots Compare/ # DataDome guides
```

## 🎯 Usage

1. **Launch Application**: Run the built application or development server
2. **Select Script**: Choose between Snyk Report Compare or DataDome Compare
3. **Check Requirements**: The app automatically validates required files
4. **View Documentation**: Click "View Guide" for script-specific instructions
5. **Execute Script**: Run button enables when all requirements are met

## 📊 Script Requirements

### Snyk Report Compare
- `Snyk Report CAT YYYY-MM-DD.xlsx` (latest report)
- `Snyk Vulnerability tracker.xlsx` (tracking file)

### DataDome Compare  
- `DataDome_Export_AI_agents_YYYY-MM-DD.xlsx`
- `DataDome_Export_verified_bots_YYYY-MM-DD.xlsx`
- `DataDome Bots - Block or Whitelist.xlsx`

## 🔧 Configuration

The application automatically configures:
- Python virtual environment in `~/.reuters-script-manager/.venv`
- Required Python packages: `pandas`, `openpyxl`, `colorama`
- Working directory relative to application location

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build frontend for production
- `npm run tauri dev` - Start Tauri development mode
- `npm run tauri build` - Build complete application

### Key Technologies
- **React 18**: Modern React with hooks and TypeScript
- **Tauri**: Secure, lightweight desktop app framework
- **Tailwind CSS**: Utility-first CSS framework
- **React Markdown**: Rich documentation rendering

## 📜 License

Private - Thomson Reuters Internal Use Only

## 🤝 Contributing

This is a private repository for Thomson Reuters internal use. For questions or contributions, contact the development team.

---

**Thomson Reuters Script Manager** - Professional desktop automation for script management and execution.