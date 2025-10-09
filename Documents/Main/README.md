# 📘 Reuters Script Manager — User Guide

Simple, practical guidance for using the Reuters Script Manager desktop app. This guide focuses on what you need to run scripts successfully — no developer setup required.

---

## 🎯 What You Can Do

- 🔐 Compare Snyk vulnerability reports over time
- 🤖 Review DataDome verified bots and AI agents
- 📚 Open step-by-step user guides directly in the app

---

## 🚀 Quick Start

1. Launch the app
2. Choose a script from the dropdown (Snyk or DataDome)
3. Ensure required files are present (status indicators will confirm)
4. Open the User Guide from the top bar for exact steps
5. Click Run once requirements are met

---

## 📁 Required Files

The app automatically checks for required files. Place them in the same directory as the script or in the working folder shown in the details panel.

### Snyk Report Compare
- `Snyk Report CAT YYYY-MM-DD.xlsx` (latest report)
- `Snyk Vulnerability tracker.xlsx` (tracking file)

### DataDome Compare
- `DataDome_Export_AI_agents_YYYY-MM-DD.xlsx`
- `DataDome_Export_verified_bots_YYYY-MM-DD.xlsx`
- `DataDome Bots - Block or Whitelist.xlsx`

---

## 🧭 Using the App

- Top bar: Open README and the script’s User Guide
- Left panel: Script details, working directory, dependencies, and required files
- Right panel: Controls for selecting, resetting, checking requirements, repairing, and running scripts
- Bottom panel: Real-time output and status

---

## 🛠️ Common Actions

- Browse: Select a script file to run
- Repair: Automatically set up the Python environment if needed
- Check Requirements: Re-validate files if you’ve added/changed them
- Reset: Restore the panel to its initial state for the current script
- Reveal: Open the working folder in your file explorer

---

## 🧩 Manual Mode (Optional)

- Toggle Manual Mode to select input files directly via file pickers
- When Manual Mode is enabled, automatic file checking is hidden
- Turn Manual Mode off to return to automatic file discovery

---

## 📈 Run Progress and Completion

- Progress maps to distinct steps shown during execution
- The compact “Completed” pill appears only for successful runs
- Switching scripts clears progress and completion state
- Use Reset to clear output, progress, and manual inputs without changing the selected script

---

## ✅ Tips for Success

- Keep the latest files in the working directory
- Follow the User Guide steps carefully
- Don’t interrupt the script while it’s running
- Use consistent file naming and archive old files regularly

---

## ❓ Troubleshooting

- Missing files: Status indicators will show what’s missing
- Environment issues: Click Repair to recreate the Python environment
- Permission errors: Ensure files aren’t locked or restricted
- Unexpected messages: Review the output panel for details
- Progress stuck: Switch scripts or click Reset to clear and try again
- Completion indicator: The compact "Completed" pill only appears after a successful run
- Manual mode: Toggle off to hide file pickers and restore automatic file checking

---

## 📚 Guides

Open these directly in the app:
- Snyk: `Snyk_Compare_Script_User_Guide.md`
- DataDome: `DataDome_Compare_Script_User_Guide.md`

---

Private — Internal Use Only