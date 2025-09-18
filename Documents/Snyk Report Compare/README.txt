SNYK REPORT COMPARE SCRIPT
===========================

OVERVIEW
========
The Snyk Report Compare Script is a powerful Python tool designed to analyze and compare Snyk vulnerability reports. It helps security teams identify new vulnerabilities, track remediation progress, and maintain comprehensive vulnerability management workflows through the Reuters Script Manager desktop launcher.

KEY FEATURES
============
- Automated vulnerability comparison between two report periods
- Intelligent file detection and real-time status monitoring
- Smart execution control with requirement validation
- Professional Excel formatting with clickable hyperlinks
- Automatic file archiving into timestamped folders
- Generates .txt templates for creating new vulnerability tickets
- Filters out Docker-related projects by default (configurable)
- Colorized output indicators (✓ green for success, ✗ red for issues)
- Cross-platform compatibility with automatic environment setup

WHAT THE SCRIPT DOES
====================

PRIMARY FUNCTIONS
-----------------
1. Report Comparison
   - Compares two Snyk vulnerability reports (old vs. new)
   - Identifies new vulnerabilities that weren't in the previous report
   - Uses ISSUE_URL as the unique identifier for accurate matching
   - Tracks vulnerability trends and resolution progress

2. Data Processing
   - Sorts vulnerabilities alphabetically by name
   - Counts critical severity vulnerabilities
   - Filters out Docker-related projects (configurable)
   - Extracts and formats CVE/CWE information
   - Maintains data integrity throughout processing

3. Tracker Integration
   - Cross-references new vulnerabilities with existing tracker file
   - Maps existing tickets to vulnerabilities
   - Appends new vulnerabilities without tickets to the tracker
   - Preserves historical vulnerability data

4. Output Generation
   - Creates a "Working sheet" with new vulnerabilities only
   - Generates a "Vulnerability Tracker" sheet
   - Applies professional formatting and hyperlinks
   - Creates ticket templates for vulnerabilities without existing tickets
   - Provides detailed summary statistics

5. File Management
   - Backs up original files automatically
   - Archives processed files in organized folders
   - Maintains file integrity throughout the process
   - Provides file location access through the launcher

LAUNCHER INTEGRATION
===================
The script is fully integrated with the Reuters Script Manager desktop launcher:

AUTOMATIC SETUP:
- Python virtual environment creation
- Dependency installation (pandas, openpyxl, colorama)
- Cross-platform compatibility

SMART FILE MONITORING:
- Real-time detection of required files
- Visual status indicators in the Info Panel
- Automatic updates when files are added/removed

INTELLIGENT EXECUTION:
- Run button disabled when requirements not met
- Color-coded status (red = missing, green = ready)
- Prevention of execution errors through validation

REQUIRED FILES
==============
The script requires these files in the working directory:

1. CURRENT SNYK REPORT (Required)
   - Pattern: "Snyk Report CAT YYYY-MM-DD.xlsx"
   - Description: The most recent Snyk vulnerability report

2. PREVIOUS SNYK REPORT (Required)
   - Pattern: "Snyk Report CAT YYYY-MM-DD.xlsx" 
   - Description: Previous report for comparison

3. VULNERABILITY TRACKER (Required)
   - File: "Snyk Vulnerability tracker.xlsx"
   - Description: Master tracking file for all vulnerabilities

The launcher automatically detects these files and shows their status in real-time.

HOW TO USE
==========

USING THE LAUNCHER (RECOMMENDED):
1. Open Reuters Script Manager
2. Select "Snyk Report Compare" from dropdown
3. Check Info Panel for file status (should be green)
4. Click blue "Run Script" button when all requirements are met
5. Monitor progress in Output Panel

PREPARING FILES:
1. Place Snyk reports in the script directory
2. Ensure vulnerability tracker is present
3. File names must match expected patterns exactly
4. Close files if open in Excel

MONITORING EXECUTION:
1. Watch real-time output in the launcher
2. Green checkmarks (✓) indicate success
3. Red X marks (✗) indicate issues
4. Script provides detailed progress information

OUTPUT FILES
============
After successful execution:

1. WORKING SHEET:
   - Contains only new vulnerabilities
   - Professional formatting applied
   - Hyperlinks to vulnerability details

2. VULNERABILITY TRACKER:
   - Updated with new findings
   - Historical data preserved
   - Ticket mappings maintained

3. TICKET TEMPLATES:
   - Text files for creating new tickets
   - Pre-formatted with vulnerability details
   - Ready for ticket system submission

4. ARCHIVED FILES:
   - Original files moved to _archive folder
   - Timestamped organization
   - Backup preservation

TECHNICAL DETAILS
=================

DEPENDENCIES:
- pandas: Data manipulation and Excel file handling
- openpyxl: Excel file formatting and styling
- colorama: Colored output in console

PYTHON VERSION:
- Python 3.8 or higher
- Automatically managed by the launcher

FILE FORMATS:
- Input: Excel files (.xlsx format)
- Output: Excel files with multiple sheets
- Templates: Plain text files (.txt)

CONFIGURATION:
- Docker filtering: Configurable in script
- File patterns: Defined in script constants
- Output formatting: Customizable styling

TROUBLESHOOTING
===============

COMMON ISSUES:

1. Red "Requirements Not Met" Button:
   - Check Info Panel for missing files
   - Verify file names match patterns exactly
   - Ensure files are in correct directory
   - Use "Reveal" button to access file location

2. File Access Errors:
   - Close Excel files if open
   - Check file permissions
   - Ensure files aren't locked by other processes

3. Missing Dependencies:
   - Click "Repair" button in launcher
   - Wait for environment recreation
   - Restart launcher if needed

4. Processing Errors:
   - Check file formats and structure
   - Verify Excel files contain expected worksheets
   - Review output panel for detailed error messages

BEST PRACTICES
==============

1. FILE ORGANIZATION:
   - Keep related files in same directory
   - Use consistent naming conventions
   - Maintain backup copies

2. REGULAR EXECUTION:
   - Run comparisons when new reports arrive
   - Keep vulnerability tracker current
   - Archive processed files regularly

3. MONITORING:
   - Watch launcher output during execution
   - Don't interrupt running scripts
   - Review results for accuracy

4. MAINTENANCE:
   - Update vulnerability tracker regularly
   - Clean archive folders periodically
   - Maintain script dependencies

SUPPORT
=======
For additional help:
- Review launcher output for error details
- Check User Guide for detailed instructions
- Ensure all system requirements are met
- Verify file permissions and access

VERSION INFORMATION
==================
Script Version: 2.0
Launcher Integration: Full support
Last Updated: September 18, 2025
Platform Support: Windows, macOS, Linux

This script is designed to work seamlessly with the Reuters Script Manager 
desktop launcher for optimal user experience and reliability.