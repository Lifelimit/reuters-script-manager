# 🔐 Snyk Compare Script — User Guide

This guide provides a detailed walkthrough of the Snyk Compare script, its purpose, requirements, and outputs.

---

### 🎯 Purpose

The script compares two Snyk vulnerability reports to find new issues, cross-references them with a master tracker, and generates several outputs to streamline the ticketing and review process.

---

### 📁 Required Files

> **Working Directory:** `Snyk Report Compare`

Place the following files directly inside the script's working directory, located at the root of the project.

| File Description              | Filename Example                               |
| ----------------------------- | ---------------------------------------------- |
| **New Snyk Report**           | `Snyk Report CAT 2025-10-29.xlsx`              |
| **Previous Snyk Report**      | `Snyk Report CAT 2025-10-22.xlsx`              |
| **Vulnerability Tracker**     | `Snyk Vulnerability tracker.xlsx`              |


---

### ⚙️ How It Works

1.  **Validation**: The script begins by running a series of checks to ensure all required files and their internal sheets (`Snyk all repositories`, `Tickets`) are present and correctly formatted.

2.  **Comparison**: It identifies **new vulnerabilities** by comparing the `ISSUE_URL` in the new and old reports. If an `ISSUE_URL` is missing, a **fallback ID** is generated from other data (e.g., Project Name + Package + CVE) to ensure every issue is tracked.

3.  **Tracker Cross-Reference**: It checks the `Vulnerability Tracker.xlsx` to see if tickets have already been created for any of the new vulnerabilities.

4.  **Sheet Generation**: It modifies the new Snyk report file by adding three new sheets:
    -   `Working sheet`: A filtered view of new, non-Docker issues for immediate action.
    -   `Working sheet - Manual`: A complete, unfiltered view of all issues from the new report, with `Ticket` and `Needs Action` columns to guide manual review.
    -   `Vulnerability Tracker`: A sheet formatted for easy copy-pasting into your master tracker.

5.  **Ticket Template Creation**: A `.txt` file is created with pre-formatted text for any new vulnerability that doesn't have a ticket, ready to be pasted into an ADO ticket.

6.  **Archiving**: The original input files are moved to a dated folder inside `_archive` to keep your workspace clean.

---

### 📄 Outputs

-   **Updated Snyk Report (`.xlsx`)**: The new report file, now containing the three generated sheets.
-   **Ticket Template File (`.txt`)**: A text file with templates for creating new tickets.
-   **Archived Inputs**: Your original files are safely stored in the `_archive` folder.

---

*Private — Internal Use Only*