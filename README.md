# 📘 Reuters Script Manager

<div align="center">
  <img src="https://img.shields.io/badge/Tauri-24C8DB?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
</div>

A desktop application designed to simplify and automate the process of running recurring comparison scripts.

---

## ✨ Features

-   🔐 **Snyk Vulnerability Analysis**: Compares two Snyk reports to identify new vulnerabilities. The script generates multiple outputs:
    -   `Working sheet`: A clean, filtered list for immediate action.
    -   `Working sheet - Manual`: A comprehensive sheet with all data for in-depth manual reviews.
    -   `Vulnerability Tracker`: A pre-formatted sheet to easily update your master tracker.

-   🤖 **DataDome Bot Review**: Compares DataDome exports against a master list to find new and potentially renamed bots, helping keep your bot definitions up-to-date.

-   📚 **Built-in Documentation**: Access detailed, step-by-step user guides for each script directly from within the application.

## 🚀 Getting Started

### 1. Prepare Your Files

Before running a script, make sure the required files are present in the correct folder.

-   **For Snyk Compare**: In the `Documents/Snyk Report Compare` folder:
    -   The latest Snyk report (e.g., `Snyk Report CAT YYYY-MM-DD.xlsx`).
    -   The master `Snyk Vulnerability tracker.xlsx`.

-   **For DataDome Compare**: In the `Documents/DataDome Verified Bots Compare` folder:
    -   The latest `DataDome_Export_AI_agents_YYYY-MM-DD.xlsx`.
    -   The latest `DataDome_Export_verified_bots_YYYY-MM-DD.xlsx`.
    -   The master `DataDome Bots - Block or Whitelist.xlsx`.

### 2. Run the Script

1.  Launch the **Reuters Script Manager** application.
2.  Select the script you want to run (Snyk or DataDome).
3.  The status indicators will confirm if your files are ready.
4.  Click the **Run** button and let the script do the work.

## ⚠️ Important Notes

-   **File Location is Key**: Always keep the required files in their designated directories as shown in the app's details panel.
-   **Consistent Naming**: Use the recommended file naming conventions, especially for dates (`YYYY-MM-DD`).
-   **Do Not Interrupt**: Allow the script to complete without interruption to prevent partially-written files or errors.

---

## 🛠️ For Developers

This application is built with Tauri, allowing for a cross-platform desktop application using web technologies for the frontend.

### Tech Stack

-   **Backend:** Rust
-   **Frontend:** React with TypeScript
-   **Framework:** Tauri
-   **Styling:** Tailwind CSS
-   **Bundler:** Vite

### Prerequisites

Before you begin, ensure you have the following installed:
-   [Node.js](https://nodejs.org/) (which includes npm)
-   [Rust](https://www.rust-lang.org/tools/install)
-   [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) for your specific operating system.

### Setup and Installation

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd reuters-script-manager
    ```

2.  **Install NPM dependencies:**
    ```sh
    npm install
    ```

### Running the Application

You can run the application in development mode using one of the following methods:

1.  **Command Line:**
    ```sh
    npm run tauri dev
    ```

2.  **VS Code (Recommended):**
    -   Open the **Run and Debug** view.
    -   Select **"Run App (No Rust Debug)"** from the dropdown menu.
    -   Press the play button (F5).

---

*Private — Internal Use Only*
