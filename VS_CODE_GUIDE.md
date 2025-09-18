# 🚀 Reuters Script Manager - VS Code Development Guide

A comprehensive guide for developing, debugging, and building the Reuters Script Manager desktop application using Visual Studio Code.

## 🎯 Quick Start Methods

### Method 1: Using Tasks (Recommended)

1. **Open Command Palette**: `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. **Type**: `Tasks: Run Task`
3. **Select one of**:
   - `Tauri: Development` - Full desktop app with hot reload
   - `Frontend: Development` - Web version only (browser preview)
   - `Tauri: Build` - Build production executables

### Method 2: Using Debug Configuration

1. **Go to Run & Debug**: `Cmd+Shift+D` (macOS) or `Ctrl+Shift+D` (Windows/Linux)
2. **Select configuration**:
   - `Tauri Development` - Launch full desktop app
   - `Frontend Only (Vite)` - Web browser preview
3. **Click the green play button** or press `F5`

### Method 3: Using Integrated Terminal

1. **Open Terminal**: `Ctrl+`` (backtick) or `View → Terminal`
2. **Run commands**:
   ```bash
   # Full desktop app (recommended)
   npm run tauri dev
   
   # Web browser preview only
   npm run dev
   
   # Production build
   npm run tauri build
   
   # TypeScript type checking
   npx tsc --noEmit
   ```

## 🏗️ Architecture Overview

### Frontend (React + TypeScript)
- **`src/App.tsx`**: Main application orchestration and state management
- **`src/components/`**: React components for UI
  - `ScriptDetailsPanel.tsx`: Info panel with dependencies and file status
  - `ScriptControlPanel.tsx`: Controls, dropdowns, and action buttons
  - `ScriptOutputViewer.tsx`: Output display with colored indicators
- **`src/index.css`**: Tailwind CSS with custom styling and theme support

### Backend (Rust/Tauri)
- **`src-tauri/src/main.rs`**: Tauri backend with all command implementations
- **Key Commands**:
  - Environment management: `setup_venv`, `check_dependencies`, `install_dependencies`
  - File operations: `analyze_required_files`, `check_required_files`, `reveal_path`
  - Script execution: `launch_script` with proper environment activation
  - File monitoring: Real-time file system watching

### Configuration
- **`tauri.conf.json`**: Tauri configuration and window settings
- **`package.json`**: Node.js dependencies and build scripts
- **`Cargo.toml`**: Rust dependencies and metadata

## 🎨 Development Features

### Hot Reload & Live Updates
- **Frontend changes**: Automatically reload in real-time
- **CSS changes**: Instant updates with Tailwind CSS
- **Rust backend changes**: Restart required (Ctrl+C, then re-run)
- **Real-time file monitoring**: Tests file watcher functionality during development

### Advanced Debugging
- **React DevTools**: Available when running `npm run dev`
- **Rust debugging**: Use VS Code's built-in Rust debugging with breakpoints
- **Console logs**: View in VS Code's integrated terminal
- **Tauri DevTools**: Built-in debugging tools for desktop app
- **Network monitoring**: Debug backend command calls

### Code Quality Tools
- **TypeScript**: Full type checking and IntelliSense
- **ESLint**: JavaScript/TypeScript linting
- **Rust Analyzer**: Rust language server with full IDE support
- **Prettier**: Code formatting (configure as needed)

## 🔧 Development Workflow

### Setting Up the Environment
1. **Install Prerequisites**:
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Tauri CLI globally
   npm install -g @tauri-apps/cli
   ```

2. **Install Rust** (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **Install VS Code Extensions** (recommended):
   - rust-analyzer (Rust language support)
   - Tauri (Tauri framework support)
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense
   - TypeScript Importer

### Daily Development
1. **Start Development Server**:
   ```bash
   npm run tauri dev
   ```

2. **Make Changes**:
   - Frontend: Edit files in `src/`
   - Backend: Edit files in `src-tauri/src/`
   - Styles: Modify Tailwind classes in components

3. **Test Features**:
   - File monitoring: Add/remove files and watch status updates
   - Environment management: Test dependency installation
   - Cross-platform: Verify functionality on target platforms

### Building and Testing
1. **Development Build**:
   ```bash
   npm run dev          # Frontend only
   npm run tauri dev    # Full desktop app
   ```

2. **Production Build**:
   ```bash
   npm run tauri build  # Creates platform-specific executables
   ```

3. **Type Checking**:
   ```bash
   npx tsc --noEmit     # Check TypeScript without building
   ```

## 🐛 Debugging Techniques

### Frontend Debugging
- **React DevTools**: Inspect component state and props
- **Browser DevTools**: Network tab for API calls to backend
- **Console logging**: Use `console.log()` for quick debugging
- **VS Code debugger**: Set breakpoints in TypeScript code

### Backend Debugging
- **Rust logging**: Use `println!()` or `log` crate for output
- **VS Code Rust debugging**: Set breakpoints in Rust code
- **Command testing**: Test individual Tauri commands
- **Error handling**: Monitor Tauri command error responses

### Common Debugging Scenarios
1. **File monitoring not working**: Check file watcher implementation
2. **Dependencies not installing**: Debug Python environment setup
3. **UI not updating**: Verify state management in React components
4. **Cross-platform issues**: Test on different operating systems

## 📁 Key File Locations

### Frontend Development
```
src/
├── App.tsx                     # Main app logic and state
├── components/
│   ├── ScriptDetailsPanel.tsx  # Info panel component
│   ├── ScriptControlPanel.tsx  # Controls and buttons
│   └── ScriptOutputViewer.tsx  # Output display
├── main.tsx                    # React entry point
└── index.css                   # Tailwind styles
```

### Backend Development
```
src-tauri/
├── src/
│   └── main.rs                 # All Tauri commands
├── Cargo.toml                  # Rust dependencies
└── tauri.conf.json            # App configuration
```

### Configuration Files
```
├── package.json                # Node.js deps and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS setup
└── vite.config.ts             # Vite build configuration
```

## 🚀 Performance Optimization

### Development Performance
- **Incremental builds**: Vite's fast hot reload
- **Rust compilation**: Use `--release` flag for optimized builds
- **Memory usage**: Monitor during file watching operations
- **Startup time**: Optimize Python environment setup

### Production Optimization
- **Bundle size**: Analyze with Vite bundle analyzer
- **Rust optimization**: Release builds are automatically optimized
- **Asset optimization**: Compress images and fonts
- **Startup performance**: Minimize initial Python environment setup

## 🔍 Troubleshooting

### Common Development Issues
1. **Port conflicts**: Vite dev server port 1420 already in use
   ```bash
   # Kill existing processes
   lsof -ti :1420 | xargs kill -9
   ```

2. **Rust compilation errors**: Usually dependency or syntax issues
   ```bash
   cargo check  # Check for compilation errors
   ```

3. **Node.js dependency issues**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Tauri build failures**: Check system dependencies
   - macOS: Xcode Command Line Tools
   - Windows: MSVC, Windows SDK
   - Linux: Build essentials, webkit2gtk

### VS Code Specific Issues
1. **Extensions not working**: Restart VS Code or reload window
2. **IntelliSense slow**: Check TypeScript server performance
3. **Rust analyzer issues**: Restart the Rust analyzer extension
4. **Git integration**: Ensure proper `.gitignore` configuration

## 📝 Contributing Guidelines

### Code Style
- **TypeScript**: Use strict type checking
- **React**: Functional components with hooks
- **Rust**: Follow standard Rust conventions
- **CSS**: Use Tailwind utility classes

### Git Workflow
1. Create feature branches for new functionality
2. Write descriptive commit messages
3. Test thoroughly before committing
4. Update documentation for user-facing changes

### Testing
- **Manual testing**: Test all user workflows
- **Cross-platform**: Verify on Windows, macOS, Linux
- **Edge cases**: Test error conditions and edge cases
- **Performance**: Monitor startup time and memory usage

## 📚 Additional Resources

### Documentation
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Rust Book](https://doc.rust-lang.org/book/)

### VS Code Resources
- [VS Code Rust Development](https://code.visualstudio.com/docs/languages/rust)
- [VS Code TypeScript](https://code.visualstudio.com/docs/languages/typescript)
- [Debugging in VS Code](https://code.visualstudio.com/docs/editor/debugging)

This guide provides everything needed for effective development of the Reuters Script Manager in VS Code.
- **Styling**: `src/index.css` (Tailwind CSS)
- **Config**: `src-tauri/tauri.conf.json`

## 🔧 VS Code Features Setup

### Recommended Extensions (Auto-install prompt)
- **Tauri**: `tauri-apps.tauri-vscode`
- **Rust**: `rust-lang.rust-analyzer` 
- **Tailwind CSS**: `bradlc.vscode-tailwindcss`
- **TypeScript**: `ms-vscode.vscode-typescript-next`

### Keyboard Shortcuts
- `Cmd+Shift+P` → `Tasks: Run Task` → `Tauri: Development`
- `F5` → Start debugging (use Tauri Development configuration)
- `Ctrl+C` → Stop running development server

## 📱 Preview Your App

### Desktop App Preview
```bash
npm run tauri dev
```
- Opens native desktop window
- Full app functionality
- Real file system access

### Web Browser Preview  
```bash
npm run dev
```
- Opens at `http://localhost:1420`
- Limited functionality (no file access)
- Good for UI development

## 🏗️ Building for Production

### From VS Code
1. `Cmd+Shift+P` → `Tasks: Run Task` → `Tauri: Build`

### From Terminal
```bash
npm run tauri build
```

**Output locations**:
- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Windows**: `src-tauri/target/release/bundle/nsis/`  
- **Linux**: `src-tauri/target/release/bundle/appimage/`

---

**💡 Tip**: Use `Tauri: Development` task for the best development experience with hot reload and native desktop features!