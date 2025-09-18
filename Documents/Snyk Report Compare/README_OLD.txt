SNYK REPORT COMPARE SCRIPT
===========================

OVERVIEW
========
The Snyk Report Compare Script is a powerful Python tool designed to analyze and compare Snyk vulnerability reports. It helps security teams identify new vulnerabilities, track remediation progress, and maintain comprehensive vulnerability management workflows.

KEY FEATURES
============
- Automated vulnerability comparison between two report periods.
- Ticket integration and cross-referencing with an existing vulnerability tracker.
- Professional Excel formatting with clickable hyperlinks and conditional formatting.
- Automatic file archiving into timestamped folders.
- Generates `.txt` templates for creating new vulnerability tickets.
- Filters out Docker-related projects by default (configurable).
- Colorized output indicators (✓ green for success, ✗ red for issues) in GUI; console where supported.

WHAT THE SCRIPT DOES
====================

PRIMARY FUNCTIONS
-----------------
1. Report Comparison
   - Compares two Snyk vulnerability reports (old vs. new).
   - Identifies new vulnerabilities that weren't in the previous report.
   - Uses ISSUE_URL as the unique identifier for accurate matching.

2. Data Processing
   - Sorts vulnerabilities alphabetically by name.
   - Counts critical severity vulnerabilities.
   - Filters out Docker-related projects (configurable).
   - Extracts and formats CVE/CWE information.

3. Tracker Integration
   - Cross-references new vulnerabilities with existing tracker file.
   - Maps existing tickets to vulnerabilities.
   - Appends new vulnerabilities without tickets to the tracker.

4. Output Generation
   - Creates a "Working sheet" with new vulnerabilities only.
   - Generates a "Vulnerability Tracker" sheet.
   - Applies professional formatting and hyperlinks.
   - Creates ticket templates for vulnerabilities without existing tickets.

5. File Management
   - Backs up original files automatically.
   - Archives processed files in organized folders.
   - Maintains file integrity throughout the process.

PREREQUISITES
=============

REQUIRED FILES
--------------
Place the following files in the same directory as the script. The script will automatically find the most recent versions.

- Two Snyk Reports: The script will identify the two most recent reports based on the `YYYY-MM-DD` date in their filenames.
- Vulnerability Tracker: The script will find the most recently modified tracker file (e.g., `Snyk Vulnerability tracker.xlsx`). This is optional but recommended.

REQUIRED PYTHON PACKAGES
------------------------
- `pandas>=2.0.0`
- `openpyxl>=3.1.0`
- `Pillow>=8.0.0`

QUICK START GUIDE
=================

USING THE REUTERS SCRIPT MANAGER (RECOMMENDED)
-----------------------------------------------
1. Launch the app: Run `python script_launcher.py` (or `python3` on macOS/Linux).
2. Select the script: "Snyk Report Compare/snyk_compare.py" will appear in the dropdown.
3. Run the script: Click the "🚀 Run Script" button.
4. Done: The script automatically finds the latest input files, processes them, and saves the updated report. View real-time progress in the launcher window.

MANUAL EXECUTION (ALTERNATIVE)
------------------------------
1. Check dependencies: Run `python check_dependencies.py` to ensure your environment is set up.
2. Execute script: Run `python snyk_compare.py` from your terminal.
3. Done: The script automatically finds the latest files and runs the comparison.
4. Console colorization: Colored ✓/✗ are enabled in console output; if your terminal strips ANSI colors, you'll still see [OK]/[MISSING].

STEP 3: REVIEW RESULTS
----------------------
- Check the modified new report file for the "Working sheet" and "Vulnerability Tracker" sheet.
- Use the generated `...-Ticket-Template.txt` file to create new tickets.
- The processed input files will be in the `_archive` folder.

UNDERSTANDING THE OUTPUT
========================

OUTPUT FILES CREATED
--------------------
1. Modified New Report
   - Location: Same as your selected new report file.
   - Sheets Created:
     - Original Sheet: Your original data (renamed to include "-original").
     - Working Sheet: New vulnerabilities only (green tab).
     - Vulnerability Tracker: Formatted tracker data (light blue tab).

2. Working Sheet Features
   - New Vulnerabilities Only: A clean list of what's new.
   - Ticket Column: Shows links to existing tickets from your tracker file.
   - Hyperlinked URLs: `ISSUE_URL` values are clickable links.
   - Conditional Formatting: 'Critical' vulnerabilities are highlighted in red.
   - Auto-Filter: All columns are filterable for easy data exploration.
   - Adjusted Column Widths: Columns are resized for better readability.

3. Vulnerability Tracker Sheet
   - Report Date: Automatically extracted from the new report's filename.
   - Ticket Information: Includes links to existing tickets.
   - Formatted Data: Dates and other fields are properly formatted.
   - Docker Projects Excluded: Provides a cleaner list for tracking.

4. Ticket Template File
   - Filename: `[NewReportName]-Ticket-Template.txt`.
   - Content: Pre-formatted text blocks for each new vulnerability that doesn't have a ticket yet.
   - Format: Ready to copy and paste into your ticketing system.

5. Archive Folder
   - Location: `_archive/Snyk Report - YYYY-MM-DD/`.
   - Contents: Your original input files (old report, new report, tracker) are moved here.

KEY COLUMNS IN OUTPUT
=====================

- TICKET: Links to existing tickets from your tracker file.
- ID: The unique Snyk vulnerability identifier.
- NAME: The vulnerability name.
- TR SEVERITY: The severity level (Critical, High, etc.).
- PROJECT_NAME: The GitHub repository name.
- PROBLEM_TITLE: A detailed vulnerability description.
- CVE/CWE: CVE and CWE identifiers.
- PACKAGE_NAME_AND_VERSION: The affected library and version.
- GRACE_PERIOD: The remediation deadline.
- ISSUE_URL: A link to the Snyk vulnerability details.

TROUBLESHOOTING
===============

COMMON ISSUES AND SOLUTIONS
---------------------------

1. "Required column 'ISSUE_URL' not found"
   - Problem: The Snyk report does not have the expected column structure.
   - Solution: Ensure your Snyk report export includes the `ISSUE_URL` column.

2. "Could not find sheet 'Snyk all repositories'"
   - Problem: The script cannot find the required sheet in your Excel file.
   - Solution: Ensure your Snyk report has a sheet named "Snyk all repositories".

3. "No new vulnerabilities were found"
   - Problem: The new report contains no vulnerabilities that were not in the old report.
   - Solution: This is a normal outcome if no new issues were found.

4. Python/Package Installation Issues
   - Problem: Missing required Python packages.
   - Solution: Use the `check_dependencies.py` script or the Reuters Script Manager to automatically install dependencies.

5. File Permission Errors
   - Problem: The script cannot write to the output file or create the archive directory.
   - Solution: Ensure you have write permissions in the script's directory and that the input files are not open in another program like Excel.

6. Odd characters (�) in output
   - Problem: Some third‑party tools emit non‑UTF‑8 bytes.
   - Solution: When run via the Reuters Script Manager, output is forced to UTF‑8 and undecodable bytes are safely replaced so the app doesn’t crash. If you run from a terminal, ensure your console is UTF‑8 or leave the defaults; no further action is needed.

ADVANCED FEATURES
=================

CUSTOM CONFIGURATION
--------------------
You can modify the script constants at the top of snyk_compare.py:
    REPO_SHEET_NAME = 'Snyk all repositories'  # Sheet name to look for
    WORKING_SHEET_NAME = 'Working sheet'       # Name for new vulnerabilities sheet
    TRACKER_SHEET_NAME = 'Vulnerability Tracker'  # Name for tracker sheet
    UNIQUE_ID_COLUMN = 'ISSUE_URL'             # Column used for comparison

DOCKER PROJECT FILTERING
------------------------
The script automatically hides Docker-related projects in the Working sheet. This can be modified in the code if needed.

DATE EXTRACTION
---------------
The script automatically extracts report dates from filenames using patterns like:
- YYYY-MM-DD.
- YYYY_MM_DD.

HYPERLINK GENERATION
--------------------
- Issue URLs are automatically converted to clickable hyperlinks.
- Ticket links are preserved and formatted.
- Proper Excel HYPERLINK formulas are generated.

CONDITIONAL FORMATTING
----------------------
- Critical vulnerabilities are highlighted in red.
- Date columns are properly formatted.
- Headers are bolded.

BEST PRACTICES
==============

FILE NAMING
-----------
- Use consistent naming conventions for your reports.
- Include dates in filenames (YYYY-MM-DD format).
- Keep tracker files in a consistent location.

REGULAR PROCESSING
------------------
- Run the script regularly (weekly or bi-weekly).
- Keep a consistent schedule for report generation.
- Archive old reports systematically.

TRACKER MAINTENANCE
-------------------
- Keep your vulnerability tracker up to date.
- Use consistent ticket naming conventions.
- Regularly review and update ticket statuses.

BACKUP STRATEGY
---------------
- The script automatically backs up files, but maintain additional backups.
- Keep copies of important tracker files.
- Document your vulnerability management process.

INTEGRATION WITH REUTERS SCRIPT MANAGER
========================================
This script is designed to work seamlessly with the Reuters Script Manager GUI.

- Automatic Discovery: The script appears automatically in the dropdown menu.
- One-Click Execution: Run the script with a single click of the "🚀 Run Script" button.
- Real-Time Output: View live progress and results in the launcher's output window.
- Environment Management: The launcher handles all dependency and virtual environment setup automatically.
- Professional UI: A modern, platform-native interface with light/dark mode support.
- Integrated Documentation: View this README and the user guide directly within the app.
================================================================================

This guide covers all aspects of using the Snyk Compare Script.

