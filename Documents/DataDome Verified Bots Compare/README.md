# 🤖 DataDome Compare Script

## 🎯 Overview

The DataDome Compare Script analyzes DataDome bot management exports to identify new bot entries and track changes in bot classifications. It helps security teams maintain accurate blocklists and whitelists by comparing the latest exports with existing reference data through the **Reuters Script Manager** desktop launcher.

---

## ✨ Key Features

### 🔄 **Automated Analysis**
- Automated comparison of DataDome AI agents and verified bots exports
- Intelligent detection of new bot entries not in existing records
- Similarity analysis to identify potential bot renames
- Professional Excel reporting with detailed analysis

### 📁 **File Management**
- Automatic file archiving and organization
- Real-time file monitoring and requirement validation
- Cross-platform compatibility with automatic environment setup
- Colorized output indicators for easy status identification

### 🎨 **Enhanced Experience**
- Smart execution control with requirement validation
- Professional formatting and visual feedback
- Real-time status updates

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
| **AI Agents Export** | `DataDome_Export_AI_agents_YYYY-MM-DD.xlsx` | Latest export of AI agents from DataDome |
| **Verified Bots Export** | `DataDome_Export_verified_bots_YYYY-MM-DD.xlsx` | Latest export of verified bots from DataDome |
| **Block/Whitelist Reference** | `DataDome Bots - Block or Whitelist.xlsx` | Master reference file for bot classifications |

> ⚠️ **Important**: The launcher automatically detects these files and shows their status in real-time.

---

## 🚀 How to Use

### 📱 **Using the Launcher (Recommended)**

1. **Open** Reuters Script Manager
2. **Select** "DataDome Compare" from dropdown
3. **Check** Info Panel for file status (should be 🟢 green)
4. **Click** blue "Run Script" button when all requirements are met
5. **Monitor** progress in Output Panel

### 📂 **Preparing Files**

1. Download latest DataDome exports
2. Place files in the script directory
3. Ensure reference file is current
4. File names must match expected patterns exactly
5. Close files if open in Excel

### 👀 **Monitoring Execution**

1. Watch real-time output in the launcher
2. Green checkmarks (✅) indicate success
3. Red X marks (❌) indicate issues
4. Script provides detailed progress information

---

## ⚙️ What the Script Does

### 1. 📊 **Export Analysis**
- Processes latest DataDome AI agents export
- Analyzes verified bots export data
- Compares against existing block/whitelist reference
- Identifies entries not previously catalogued

### 2. 🔍 **New Entry Detection**
- Scans for bots not in the reference file
- Filters out known entries
- Flags genuinely new discoveries
- Provides detailed entry information

### 3. 🧠 **Similarity Analysis**
- Compares new entries against existing bot names
- Calculates similarity scores for potential matches
- Identifies possible bot renames or variations
- Helps prevent duplicate entries

### 4. 📄 **Report Generation**
- Creates comprehensive new entries report
- Includes similarity analysis results
- Provides actionable recommendations
- Formats data for easy review and decision-making

### 5. 📦 **File Management**
- Archives processed files automatically
- Maintains organized file structure
- Preserves historical data
- Provides easy access to previous analyses

---

## 📤 Output Files

After successful execution:

### 📝 **New Entries Report**
- Contains newly discovered bot entries
- Includes similarity analysis
- Provides classification recommendations
- Professional Excel formatting

### 📁 **Archived Files**
- Original files moved to `_archive` folder
- Timestamped organization
- Historical data preservation

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
- **Output**: Excel files with analysis results
- **Archive**: Organized by timestamp

### 🧮 **Similarity Algorithm**
- String comparison algorithms
- Configurable similarity thresholds
- Fuzzy matching capabilities
- Context-aware analysis

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

#### 📊 **No New Entries Found**
- Normal if no new bots have been added
- Verify input files are current
- Check reference file is up to date

---

## 📊 Analysis Guidelines

### 🎯 **Similarity Scores**

| Score Range | Interpretation | Action |
|-------------|----------------|--------|
| **0.9-1.0** | 🔴 Very likely the same bot (possible rename) | Investigate thoroughly |
| **0.8-0.9** | 🟡 Potentially related | Manual review required |
| **0.6-0.8** | 🟠 Some similarity | Consider context |
| **<0.6** | 🟢 Likely different bots | Proceed with classification |

### 🧠 **Decision Making**

1. **Review** similarity analysis carefully
2. **Consider** bot behavior patterns
3. **Check** historical data for context
4. **Apply** security policy guidelines
5. **Document** decisions for future reference

---

## 💡 Best Practices

### 📂 **File Organization**
- Keep DataDome files in dedicated directory
- Download exports regularly
- Maintain current reference files

### 🔄 **Regular Execution**
- Run comparisons weekly or as needed
- Process new exports promptly
- Keep analysis results organized

### 👁️ **Monitoring**
- Watch launcher output during execution
- Review results thoroughly
- Document analysis decisions

### 🛠️ **Maintenance**
- Update reference files regularly
- Clean archive folders periodically
- Maintain script environment

---

## 📈 Workflow Recommendations

### 📅 **Weekly Process**

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

## 📞 Support

For additional help:
- 📖 Review launcher output for error details
- 📋 Check User Guide for detailed instructions
- ✅ Ensure all system requirements are met
- 🔧 Verify file permissions and access

> 🚀 This script is designed to work seamlessly with the Reuters Script Manager desktop launcher for optimal user experience and bot management efficiency.