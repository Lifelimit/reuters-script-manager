# 📘 Reuters Script Manager — Script Guides

This guide provides a clear, easy-to-understand overview of the scripts managed by this application. Below is a detailed breakdown of what each script does, what files it requires, and what it produces.

---

## 🔐 Snyk Vulnerability Analysis

**Purpose:** To compare the latest Snyk vulnerability report against a previous one, identify new issues, and generate actionable outputs for tracking and ticketing.

<br>

#### 📁 Required Files

> **Working Directory:** `Snyk Report Compare`

Place the following files directly inside the script's working directory, located at the root of the project.

| File Description              | Filename Example                               |
| ----------------------------- | ---------------------------------------------- |
| **New Snyk Report**           | `Snyk Report CAT 2025-10-29.xlsx`              |
| **Previous Snyk Report**      | `Snyk Report CAT 2025-10-22.xlsx`              |
| **Vulnerability Tracker**     | `Snyk Vulnerability tracker.xlsx`              |


#### ⚙️ Process at a Glance

1.  **Validates Files**: The script first runs a comprehensive check to ensure all required files and their internal sheets (`Snyk all repositories`, `Tickets`) are present and correctly formatted.
2.  **Compares Reports**: It identifies **new vulnerabilities** by comparing the `ISSUE_URL` in the new and old reports. If an `ISSUE_URL` is missing, it creates a **fallback ID** from other data (like Project Name + Package + CVE) to ensure no issue is missed.
3.  **Cross-References Tracker**: It checks the `Vulnerability Tracker.xlsx` to see if tickets already exist for any of the new vulnerabilities.
4.  **Generates Excel Sheets**: It modifies the new Snyk report by adding three new, pre-formatted sheets:
    -   `Working sheet`: A filtered view of new, non-Docker issues for immediate action.
    -   `Working sheet - Manual`: A complete, unfiltered view of all issues, with `Ticket` and `Needs Action` columns to guide manual review.
    -   `Vulnerability Tracker`: A sheet ready to be copy-pasted into your master tracker file.
5.  **Creates Ticket Templates**: A `.txt` file is created with pre-formatted text for any new vulnerability that doesn't have a ticket, ready to be pasted into an ADO ticket.
6.  **Archives Inputs**: The original input files (old report, original new report, and tracker) are moved into a dated folder inside `_archive` to keep your workspace clean.

#### 📄 Generated Outputs

-   **Updated Snyk Report (`.xlsx`)**: The new report file, now containing the three generated sheets.
-   **Ticket Template File (`.txt`)**: A text file with templates for creating new tickets.

---

## 🤖 DataDome Bot Review

**Purpose:** To compare the latest DataDome bot reports against a master whitelist, identify new or potentially renamed bots, and generate a clean report of the findings.

<br>

#### 📁 Required Files

> **Working Directory:** `DataDome Verified Bots Compare`

Place the following files directly inside the script's working directory, located at the root of the project.

| File Description              | Filename Example                                  |
| ----------------------------- | ------------------------------------------------- |
| **AI Agents Report**          | `DataDome_Export_AI_agents_2025-10-29.xlsx`       |
| **Verified Bots Report**      | `DataDome_Export_verified_bots_2025-10-29.xlsx`   |
| **Master Bot List**           | `DataDome Bots - Block or Whitelist.xlsx`         |


#### ⚙️ Process at a Glance

1.  **Finds Latest Files**: The script automatically locates the most recent versions of the three required files.
2.  **Reads Master List**: It processes the `Block or Whitelist` file to build a complete list of all currently known and categorized bots.
3.  **Compares Reports to Master List**: It iterates through the new AI Agents and Verified Bots reports and compares each entry against the master list.
4.  **Identifies Changes**:
    -   **New Entry**: If a bot from a report does not exist in the master list, it is flagged as new.
    -   **Possible Rename**: If a new bot's name is over **70% similar** to an existing bot, it is flagged as a potential rename, helping you catch minor name changes.
5.  **Generates Report**: It creates a new, color-coded Excel report that clearly lists all the findings.
6.  **Archives Inputs**: The two DataDome report files are moved into the `_archive` folder.

#### 📄 Generated Outputs

-   **New Entries Report (`.xlsx`)**: A new file named `DataDome_New_Entries_Report_YYYY-MM-DD.xlsx` with all new and potentially renamed bots. The "Change Type" column is colored red for new entries and yellow for possible renames.

---

*Private — Internal Use Only*
