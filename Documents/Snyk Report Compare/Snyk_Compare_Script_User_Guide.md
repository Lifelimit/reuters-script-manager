# 🛡️ Snyk Compare Script — User Guide

This guide walks you through comparing Snyk vulnerability reports and updating your tracking file.

---

## 📦 Requirements

- `Snyk Report CAT YYYY-MM-DD.xlsx` (latest report)
- `Snyk Vulnerability tracker.xlsx`

Place these in the working folder shown in the app’s Script Details panel.

---

## 🚀 Steps

1. Select “Snyk Report Compare” from the dropdown
2. Click “Check Requirements” to validate files and dependencies
3. Optional: Toggle “Manual Mode” to select files directly via pickers
4. Click “Run Script”
5. Watch the progress label as steps advance; output appears below
6. On success, a compact “Completed” pill appears in the Actions area

---

## 🔄 Reset and Switching

- Use “Reset” to clear output, progress, and manual inputs while keeping the current script selected
- Switching scripts clears progress and completion state automatically

---

## 🧭 Interpreting Progress

You will see phases such as:
- Pre-flight Validation
- Step 1 through Step 8
- Complete

The progress bar and label map to these steps for clarity.

---

## 🧩 Manual Mode

- When enabled, automatic file checking is hidden
- Use the file pickers to select the required inputs
- Toggle off Manual Mode to restore automatic checking

---

## ❓ Troubleshooting

- Missing files: Re-check requirements or use Manual Mode to pick files
- Environment issues: Click “Repair” to set up Python and dependencies
- Unexpected errors: Review the output panel for details
- No completion pill: The indicator only appears after a successful run

---

Private — Internal Use Only