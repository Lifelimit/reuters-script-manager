# 📖 DataDome Compare Script - User Guide

## 🎯 Overview

The DataDome Compare script analyzes DataDome bot reports to identify new bot entries, track changes, and maintain an up-to-date blocklist/whitelist. It compares the latest AI agents and verified bots exports with existing records to detect new entries and potential renames.

---

## 📋 Required Files

The script requires the following files to be present in the working directory:

### 1. 🤖 **AI Agents Export** (Required)
- **File**: `DataDome_Export_AI_agents_YYYY-MM-DD.xlsx` (latest date)
- **Location**: Same directory as script
- **Description**: Latest export of AI agents from DataDome

### 2. ✅ **Verified Bots Export** (Required)
- **File**: `DataDome_Export_verified_bots_YYYY-MM-DD.xlsx` (latest date)
- **Location**: Same directory as script
- **Description**: Latest export of verified bots from DataDome

### 3. 📝 **Block/Whitelist Reference** (Required)
- **File**: `DataDome Bots - Block or Whitelist.xlsx`
- **Location**: Same directory as script
- **Description**: Master reference file for bot classifications

> ⚠️ **Important**: All files must be in the same directory as the script for proper execution.

> 📅 **Filename Date Format**: Export filenames should include dates in `YYYY-MM-DD` (or `YYYY_MM_DD`) format so the launcher and script can correctly detect the latest exports.

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
- Download latest DataDome exports (AI agents and verified bots)
- Ensure the Block/Whitelist reference file is current
- Place all files in the script directory
- File names must match the expected pattern exactly

### 2. ✅ **Check Status**
- Open Reuters Script Manager
- Select "DataDome Compare" from dropdown
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
- Verify results in the generated report file

---

## ⚙️ Script Functionality

The script performs the following operations:

### 1. 🔍 **File Validation**
- Checks for required input files
- Validates file formats and structure
- Reports missing or invalid files

### 2. 📊 **Data Comparison**
- Reads latest DataDome exports
- Compares with existing block/whitelist records
- Identifies new bot entries not previously seen

### 3. 🧠 **Similarity Analysis**
- Analyzes bot names for potential renames
- Calculates similarity scores between entries
- Flags potential matches for review

### 4. 📄 **Report Generation**
- Creates new entries report
- Provides similarity analysis results
- Generates actionable recommendations

---

## 📤 Output Files

After successful execution, the following files are created:

### 1. 📊 **New Entries Report**
- **File**: `DataDome_New_Entries_Report_YYYY-MM-DD.xlsx`
- Contains newly discovered bot entries
- Includes similarity analysis for potential renames
- Provides recommendations for blocking/whitelisting

### 2. 📁 **Archived Files**
- Original files moved to `_archive` folder
- Timestamped organization for historical tracking
- Preserves data integrity

---

## 🔧 Troubleshooting

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

#### 📊 **No New Entries Found**
- This is normal if no new bots have been added
- Check that input files are actually different from previous runs
- Verify the reference file is up to date

---

## 📊 Interpreting Results

The generated report contains:

### 1. 🆕 **New Entries**
- Bots not found in the reference block/whitelist
- Each entry includes bot details and source information

### 2. 🧮 **Similarity Scores**
- Numerical scores indicating potential name matches
- Higher scores suggest possible renames of existing bots
- Scores above 0.8 typically indicate strong similarity

### 3. 💡 **Recommendations**
- Suggested actions (block/whitelist) based on analysis
- Context for decision making
- Historical comparison data

---

## 📈 Similarity Score Guide

| Score | Meaning | Recommendation |
|-------|---------|----------------|
| **0.9 - 1.0** | 🔴 Very likely same bot | Investigate thoroughly - possible rename |
| **0.8 - 0.9** | 🟡 Potentially related | Manual review required |
| **0.6 - 0.8** | 🟠 Some similarity | Consider bot context and behavior |
| **< 0.6** | 🟢 Likely different | Proceed with normal classification |

---

## 💡 Tips for Success

### 1. 📂 **Organization**
- Keep all DataDome files in the same directory
- Download exports regularly to track changes
- Maintain current reference files

### 2. 🔄 **Regular Updates**
- Run comparisons when new exports are available
- Keep the block/whitelist reference file current
- Review similarity analysis results carefully

### 3. 👁️ **Monitoring**
- Watch the output panel during execution
- Don't interrupt the script while running
- Save work in other applications before running

### 4. 📁 **File Management**
- Use "Reveal" button to quickly access file directories
- Organize exports by date
- Archive old files after processing

---

## 📅 Workflow Recommendations

### 🗓️ **Weekly Process**
1. **Download** latest DataDome exports
2. **Run** comparison script
3. **Review** new entries report
4. **Update** block/whitelist based on findings

### 🔍 **Analysis Review**
1. **Check** similarity scores for potential renames
2. **Validate** recommendations against security policies
3. **Document** decisions for future reference

### 🛠️ **Maintenance**
1. **Keep** reference files updated
2. **Archive** old exports regularly
3. **Monitor** script performance and accuracy

---

## 🎯 Best Practices for Analysis

### 🧠 **Decision Making Process**
1. **Review** similarity analysis carefully
2. **Consider** bot behavior patterns
3. **Check** historical data for context
4. **Apply** security policy guidelines
5. **Document** decisions for future reference

### 📝 **Documentation**
- Keep notes on classification decisions
- Track patterns in bot naming conventions
- Maintain history of policy changes

### 🔄 **Continuous Improvement**
- Regularly review classification accuracy
- Update reference files based on new insights
- Adjust similarity thresholds if needed

---

## 📞 Support

For additional support:
- 📖 Check the README file for general information
- 📄 Review output messages for specific error details
- ✅ Ensure all system requirements are met
- 🛠️ Contact system administrator for environment issues

> 🎯 **Pro Tip**: The launcher makes bot analysis much more reliable by automatically validating all file requirements and providing real-time status feedback!