# 📖 Snyk Report Compare Script - User Guide

## 🎯 Overview

The Snyk Report Compare script analyzes Snyk vulnerability reports to identify new vulnerabilities, track resolved issues, and maintain an up-to-date vulnerability tracker. It automatically compares the latest report with previous reports and updates the vulnerability tracker Excel file.

---

## 📋 Required Files

The script requires the following files to be present in the working directory:

### 1. 📊 **Current Snyk Report** (Required)
- **File**: `Snyk Report CAT YYYY-MM-DD.xlsx` (latest date)
- **Location**: Same directory as script
- **Description**: The most recent Snyk vulnerability report

### 2. 📈 **Previous Snyk Report** (Required for comparison)
- **File**: `Snyk Report CAT YYYY-MM-DD.xlsx` (previous date)
- **Location**: Same directory as script
- **Description**: The previous Snyk report for comparison

### 3. 📝 **Vulnerability Tracker** (Required)
- **File**: `Snyk Vulnerability tracker.xlsx`
- **Location**: Same directory as script
- **Description**: Master tracking file for all vulnerabilities

> ⚠️ **Important**: All files must be in the same directory as the script for proper execution.

> 📅 **Filename Date Format**: Report filenames should include dates in `YYYY-MM-DD` (or `YYYY_MM_DD`) format so the script can correctly detect the latest report.

---

## 🚀 Launcher Application Features

The Reuters Script Manager launcher provides several helpful features:

### ⚡ **Automatic Environment Setup**
- ✅ Creates Python virtual environment automatically
- ✅ Installs required dependencies (`pandas`, `openpyxl`, `colorama`)
- ✅ No manual setup required

### 👁️ **Real-Time File Monitoring**
- ✅ Automatically detects when required files are present or missing
- ✅ Updates status in real-time as you add or remove files
- ✅ Visual indicators show file availability

### 🎛️ **Smart Execution Control**
- 🔴 Run Script button is **RED and DISABLED** when files are missing
- ⚠️ Button shows "Requirements Not Met" with warning icon
- 🟢 Button becomes **BLUE and ENABLED** when all files are present
- 🛡️ Prevents execution errors by validating requirements first

### 📊 **Status Indicators**
- 🟢 **GREEN text**: Dependencies installed, files found
- 🔴 **RED text**: Missing dependencies or files
- 📋 Info panel shows detailed status of each requirement

---

## 🔧 Before Running the Script

### 1. 📂 **Prepare Files**
- Place the latest Snyk report in the script directory
- Ensure the previous report is also present for comparison
- Verify the vulnerability tracker file exists
- File names must match the expected pattern exactly

### 2. ✅ **Check Status**
- Open Reuters Script Manager
- Select "Snyk Report Compare" from dropdown
- Check the **Info Panel** (left side) for file status
- Verify all items show as found (🟢 green text)
- Ensure all dependencies are installed

### 3. 🔍 **Validate Requirements**
- Click "Check Requirements" if needed to refresh status
- Use "Repair" button if dependencies are missing
- Wait for Run Script button to become blue

---

## 🎮 Running the Script

### 1. 🚀 **Execution**
- Click the blue **"Run Script"** button
- Monitor progress in the **Output Panel** (right side)
- Script will process files and generate results

### 2. 👀 **Output Monitoring**
- Watch real-time output for progress updates
- ✅ Green checkmarks indicate successful operations
- ❌ Red X marks indicate errors or warnings
- Detailed processing information is displayed

### 3. 🏁 **Completion**
- Script will indicate when processing is complete
- Check for any error messages in the output
- Verify results in the updated files

---

## ⚙️ Script Functionality

The script performs the following operations:

### 1. 🔍 **File Validation**
- Checks for required input files
- Validates file formats and structure
- Reports missing or invalid files

### 2. 📊 **Report Comparison**
- Reads current and previous Snyk reports
- Identifies new vulnerabilities
- Tracks resolved vulnerabilities
- Compares severity levels and details

### 3. 📝 **Tracker Update**
- Updates the vulnerability tracker with new findings
- Marks resolved issues
- Maintains historical tracking data
- Preserves existing tracker information

### 4. 📄 **Results Generation**
- Creates summary reports
- Generates comparison statistics
- Updates Excel files with new data
- Provides detailed change analysis

---

## 📤 Output Files

After successful execution, the following files are updated:

### 1. 📊 **Vulnerability Tracker**
- Updated with new vulnerabilities
- Resolved issues marked appropriately
- Historical data preserved

### 2. 📈 **Summary Reports**
- New vulnerability summaries
- Comparison statistics
- Change analysis results

---

## 🛠️ Troubleshooting

### ❌ **Common Issues and Solutions**

#### 🔴 **"Requirements Not Met" (Red Button)**
- Check Info Panel for specific missing files
- Ensure file names match exactly (case-sensitive)
- Verify files are in the correct directory
- Use "Reveal" button to open the working directory

#### 📦 **Missing Dependencies**
- Click "Repair" button to reinstall Python environment
- Wait for dependency installation to complete
- Restart application if needed

#### 📁 **File Format Errors**
- Ensure Excel files are not corrupted
- Check that files are not open in other applications
- Verify file permissions allow reading/writing

#### ⚠️ **Script Execution Errors**
- Check output panel for detailed error messages
- Ensure input files contain expected data structure
- Verify Excel files have the correct worksheets/columns

#### 🐌 **Performance Issues**
- Close other applications using the Excel files
- Ensure sufficient disk space is available
- Wait for file operations to complete fully

---

## 💡 Tips for Success

### 1. 📂 **Organization**
- Keep all related files in the same directory
- Use consistent file naming conventions
- Maintain backup copies of important files

### 2. 🔄 **Regular Updates**
- Run comparisons regularly when new reports arrive
- Keep the vulnerability tracker current
- Archive old reports in separate folders after processing

### 3. 👁️ **Monitoring**
- Watch the output panel during execution
- Don't interrupt the script while running
- Save work in other applications before running

### 4. 📁 **File Management**
- Use "Reveal" button to quickly access file directories
- Organize files by date or report period
- Maintain clean working directories

---

## 📞 Support

For additional support:
- 📖 Check the README file for general information
- 📄 Review output messages for specific error details
- ✅ Ensure all system requirements are met

> 🎯 **Pro Tip**: The launcher makes running this script much easier and safer by automatically validating all requirements before execution!