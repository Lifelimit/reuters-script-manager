DATADOME COMPARE SCRIPT
=======================

OVERVIEW
========
The DataDome Compare Script analyzes DataDome bot management exports to identify new bot entries
and track changes in bot classifications. It helps security teams maintain accurate blocklists
and whitelists by comparing the latest exports with existing reference data through the
Reuters Script Manager desktop launcher.

KEY FEATURES
============
- Automated comparison of DataDome AI agents and verified bots exports
- Intelligent detection of new bot entries not in existing records
- Similarity analysis to identify potential bot renames
- Professional Excel reporting with detailed analysis
- Automatic file archiving and organization
- Real-time file monitoring and requirement validation
- Cross-platform compatibility with automatic environment setup
- Colorized output indicators for easy status identification

WHAT THE SCRIPT DOES
====================

PRIMARY FUNCTIONS
-----------------
1. Export Analysis
   - Processes latest DataDome AI agents export
   - Analyzes verified bots export data
   - Compares against existing block/whitelist reference
   - Identifies entries not previously catalogued

2. New Entry Detection
   - Scans for bots not in the reference file
   - Filters out known entries
   - Flags genuinely new discoveries
   - Provides detailed entry information

3. Similarity Analysis
   - Compares new entries against existing bot names
   - Calculates similarity scores for potential matches
   - Identifies possible bot renames or variations
   - Helps prevent duplicate entries

4. Report Generation
   - Creates comprehensive new entries report
   - Includes similarity analysis results
   - Provides actionable recommendations
   - Formats data for easy review and decision-making

5. File Management
   - Archives processed files automatically
   - Maintains organized file structure
   - Preserves historical data
   - Provides easy access to previous analyses

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

1. AI AGENTS EXPORT (Required)
   - Pattern: "DataDome_Export_AI_agents_YYYY-MM-DD.xlsx"
   - Description: Latest export of AI agents from DataDome

2. VERIFIED BOTS EXPORT (Required)
   - Pattern: "DataDome_Export_verified_bots_YYYY-MM-DD.xlsx"
   - Description: Latest export of verified bots from DataDome

3. BLOCK/WHITELIST REFERENCE (Required)
   - File: "DataDome Bots - Block or Whitelist.xlsx"
   - Description: Master reference file for bot classifications

The launcher automatically detects these files and shows their status in real-time.

HOW TO USE
==========

USING THE LAUNCHER (RECOMMENDED):
1. Open Reuters Script Manager
2. Select "DataDome Compare" from dropdown
3. Check Info Panel for file status (should be green)
4. Click blue "Run Script" button when all requirements are met
5. Monitor progress in Output Panel

PREPARING FILES:
1. Download latest DataDome exports
2. Place files in the script directory
3. Ensure reference file is current
4. File names must match expected patterns exactly
5. Close files if open in Excel

MONITORING EXECUTION:
1. Watch real-time output in the launcher
2. Green checkmarks (✓) indicate success
3. Red X marks (✗) indicate issues
4. Script provides detailed progress information

OUTPUT FILES
============
After successful execution:

1. NEW ENTRIES REPORT:
   - Contains newly discovered bot entries
   - Includes similarity analysis
   - Provides classification recommendations
   - Professional Excel formatting

2. ARCHIVED FILES:
   - Original files moved to _archive folder
   - Timestamped organization
   - Historical data preservation

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
- Output: Excel files with analysis results
- Archive: Organized by timestamp

SIMILARITY ALGORITHM:
- String comparison algorithms
- Configurable similarity thresholds
- Fuzzy matching capabilities
- Context-aware analysis

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

4. No New Entries Found:
   - Normal if no new bots have been added
   - Verify input files are current
   - Check reference file is up to date

ANALYSIS GUIDELINES
==================

SIMILARITY SCORES:
- 0.9-1.0: Very likely the same bot (possible rename)
- 0.8-0.9: Potentially related (investigate further)
- 0.6-0.8: Some similarity (manual review needed)
- <0.6: Likely different bots

DECISION MAKING:
1. Review similarity analysis carefully
2. Consider bot behavior patterns
3. Check historical data for context
4. Apply security policy guidelines
5. Document decisions for future reference

BEST PRACTICES
==============

1. FILE ORGANIZATION:
   - Keep DataDome files in dedicated directory
   - Download exports regularly
   - Maintain current reference files

2. REGULAR EXECUTION:
   - Run comparisons weekly or as needed
   - Process new exports promptly
   - Keep analysis results organized

3. MONITORING:
   - Watch launcher output during execution
   - Review results thoroughly
   - Document analysis decisions

4. MAINTENANCE:
   - Update reference files regularly
   - Clean archive folders periodically
   - Maintain script environment

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
desktop launcher for optimal user experience and bot management efficiency.