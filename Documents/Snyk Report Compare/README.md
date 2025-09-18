# 📊 Snyk Report Compare Script

## 🎯 Overview

The Snyk Report Compare Script is a powerful Python tool designed to analyze and compare Snyk vulnerability reports. It helps security teams identify new vulnerabilities, track remediation progress, and maintain comprehensive vulnerability management workflows through the **Reuters Script Manager** desktop launcher.

---

## ✨ Key Features

### 🔄 **Automated Analysis**
- Automated vulnerability comparison between two report periods
- Intelligent file detection and real-time status monitoring
- Smart execution control with requirement validation
- Professional Excel formatting with clickable hyperlinks

### 📁 **File Management**
- Automatic file archiving into timestamped folders
- Generates `.txt` templates for creating new vulnerability tickets
- Filters out Docker-related projects by default (configurable)
- Cross-platform compatibility with automatic environment setup

### 🎨 **Enhanced Experience**
- Colorized output indicators (✅ green for success, ❌ red for issues)
- Real-time file monitoring and requirement validation
- Professional formatting and visual feedback

---

## 🔧 Launcher Integration

The script is **fully integrated** with the Reuters Script Manager desktop launcher:

### ⚡ **Automatic Setup**
- Python virtual environment creation
- Dependency installation (`pandas`, `openpyxl`, `colorama`)
- Cross-platform compatibility

### 👁️ **Smart File Monitoring**
- Real-time detection of required files
- Visual status indicators in the Info Panel
- Automatic updates when files are added/removed

### 🚀 **Intelligent Execution**
- Run button disabled when requirements not met
- Color-coded status (🔴 red = missing, 🟢 green = ready)
- Prevention of execution errors through validation

---

## 📋 Required Files

The script requires these files in the working directory:

| File Type | Pattern | Description |
|-----------|---------|-------------|
| **Current Snyk Report** | `Snyk Report CAT YYYY-MM-DD.xlsx` | The most recent Snyk vulnerability report |
| **Previous Snyk Report** | `Snyk Report CAT YYYY-MM-DD.xlsx` | Previous report for comparison |
| **Vulnerability Tracker** | `Snyk Vulnerability tracker.xlsx` | Master tracking file for all vulnerabilities |

> ⚠️ **Important**: The launcher automatically detects these files and shows their status in real-time.

---

## 🚀 How to Use

### 📱 **Using the Launcher (Recommended)**

1. **Open** Reuters Script Manager
2. **Select** "Snyk Report Compare" from dropdown
3. **Check** Info Panel for file status (should be 🟢 green)
4. **Click** blue "Run Script" button when all requirements are met
5. **Monitor** progress in Output Panel

### 📂 **Preparing Files**

1. Place Snyk reports in the script directory
2. Ensure vulnerability tracker is present
3. File names must match expected patterns exactly
4. Close files if open in Excel

### 👀 **Monitoring Execution**

1. Watch real-time output in the launcher
2. Green checkmarks (✅) indicate success
3. Red X marks (❌) indicate issues
4. Script provides detailed progress information

---

## ⚙️ What the Script Does

### 1. 📊 **Report Comparison**
- Compares two Snyk vulnerability reports (old vs. new)
- Identifies new vulnerabilities that weren't in the previous report
- Uses `ISSUE_URL` as the unique identifier for accurate matching
- Tracks vulnerability trends and resolution progress

### 2. 🔍 **Data Processing**
- Sorts vulnerabilities alphabetically by name
- Counts critical severity vulnerabilities
- Filters out Docker-related projects (configurable)
- Extracts and formats CVE/CWE information
- Maintains data integrity throughout processing

### 3. 🔗 **Tracker Integration**
- Cross-references new vulnerabilities with existing tracker file
- Maps existing tickets to vulnerabilities
- Appends new vulnerabilities without tickets to the tracker
- Preserves historical vulnerability data

### 4. 📄 **Output Generation**
- Creates a "Working sheet" with new vulnerabilities only
- Generates a "Vulnerability Tracker" sheet
- Applies professional formatting and hyperlinks
- Creates ticket templates for vulnerabilities without existing tickets
- Provides detailed summary statistics

### 5. 📦 **File Management**
- Backs up original files automatically
- Archives processed files in organized folders
- Maintains file integrity throughout the process
- Provides file location access through the launcher

---

## 📤 Output Files

After successful execution:

### 📝 **Working Sheet**
- Contains only new vulnerabilities
- Professional formatting applied
- Hyperlinks to vulnerability details

### 📊 **Vulnerability Tracker**
- Updated with new findings
- Historical data preserved
- Ticket mappings maintained

### 🎫 **Ticket Templates**
- Text files for creating new tickets
- Pre-formatted with vulnerability details
- Ready for ticket system submission

### 📁 **Archived Files**
- Original files moved to `_archive` folder
- Timestamped organization
- Backup preservation

---

## 🛠️ Technical Details

### 📦 **Dependencies**
- `pandas`: Data manipulation and Excel file handling
- `openpyxl`: Excel file formatting and styling
- `colorama`: Colored output in console

### 🐍 **Python Version**
- Python 3.8 or higher
- Automatically managed by the launcher

### 📁 **File Formats**
- **Input**: Excel files (`.xlsx` format)
- **Output**: Excel files with multiple sheets
- **Templates**: Plain text files (`.txt`)

### ⚙️ **Configuration**
- Docker filtering: Configurable in script
- File patterns: Defined in script constants
- Output formatting: Customizable styling

---

## 🔧 Troubleshooting

### ❌ **Common Issues**

#### 🔴 **Red "Requirements Not Met" Button**
- Check Info Panel for missing files
- Verify file names match patterns exactly
- Ensure files are in correct directory
- Use "Reveal" button to access file location

#### 📁 **File Access Errors**
- Close Excel files if open
- Check file permissions
- Ensure files aren't locked by other processes

#### 📦 **Missing Dependencies**
- Click "Repair" button in launcher
- Wait for environment recreation
- Restart launcher if needed

#### ⚠️ **Processing Errors**
- Check file formats and structure
- Verify Excel files contain expected worksheets
- Review output panel for detailed error messages

---

## 💡 Best Practices

### 📂 **File Organization**
- Keep related files in same directory
- Use consistent naming conventions
- Maintain backup copies

### 🔄 **Regular Execution**
- Run comparisons when new reports arrive
- Keep vulnerability tracker current
- Archive processed files regularly

### 👁️ **Monitoring**
- Watch launcher output during execution
- Don't interrupt running scripts
- Review results for accuracy

### 🛠️ **Maintenance**
- Update vulnerability tracker regularly
- Clean archive folders periodically
- Maintain script dependencies

---

## 📞 Support

For additional help:
- Review launcher output for error details
- Check User Guide for detailed instructions
- Ensure all system requirements are met
- Verify file permissions and access

> 🚀 This script is designed to work seamlessly with the Reuters Script Manager desktop launcher for optimal user experience and reliability.