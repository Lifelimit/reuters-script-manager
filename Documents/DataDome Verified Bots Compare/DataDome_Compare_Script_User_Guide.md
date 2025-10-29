# 🤖 DataDome Compare Script — User Guide

This guide provides a detailed walkthrough of the DataDome Compare script, its purpose, requirements, and outputs.

---

### 🎯 Purpose

The script compares the latest DataDome bot reports against a master whitelist file. Its goal is to identify new bots that need to be categorized or existing bots that may have been renamed.

---

### 📁 Required Files

> **Working Directory:** `DataDome Verified Bots Compare`

Place the following files directly inside the script's working directory, located at the root of the project.

| File Description              | Filename Example                                  |
| ----------------------------- | ------------------------------------------------- |
| **AI Agents Report**          | `DataDome_Export_AI_agents_2025-10-29.xlsx`       |
| **Verified Bots Report**      | `DataDome_Export_verified_bots_2025-10-29.xlsx`   |
| **Master Bot List**           | `DataDome Bots - Block or Whitelist.xlsx`         |


---

### ⚙️ How It Works

1.  **Finds Files**: The script automatically locates the most recent versions of the three required files based on their naming and modification dates.

2.  **Reads Master List**: It processes the `Block or Whitelist` file to build a comprehensive list of all currently known and categorized bots.

3.  **Compares Reports**: It iterates through the new `AI Agents` and `Verified Bots` reports, comparing each bot against the master list.

4.  **Identifies Changes**:
    -   **New Entry**: If a bot from a report does not exist in the master list, it is flagged as new.
    -   **Possible Rename**: If a new bot's name is over **70% similar** to an existing bot, it is flagged as a potential rename. This helps catch minor name changes that might otherwise be missed.

5.  **Generates Report**: It creates a new, color-coded Excel report that clearly lists all the findings. New entries are colored red, and possible renames are colored yellow.

6.  **Archives Inputs**: The two DataDome report files (`AI_agents` and `verified_bots`) are moved into the `_archive` folder to keep your workspace organized.

---

### 📄 Outputs

-   **New Entries Report (`.xlsx`)**: A new file named `DataDome_New_Entries_Report_YYYY-MM-DD.xlsx` that details all new and potentially renamed bots.
-   **Archived Inputs**: Your original report files are safely stored in the `_archive` folder.

---

*Private — Internal Use Only*