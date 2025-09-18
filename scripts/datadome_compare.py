import pandas as pd
import os
import warnings
import sys
from datetime import datetime, date
import re
import shutil
from tkinter import Tk, filedialog, messagebox
from openpyxl import Workbook
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.formatting.rule import Rule
from openpyxl.styles.differential import DifferentialStyle
from difflib import SequenceMatcher
from colorama import init, Fore, Style

# Safe print function to handle Unicode in subprocess context
def safe_print(text):
    """Print text with Unicode fallback for subprocess context."""
    try:
        print(text)
    except UnicodeEncodeError:
        # Fallback: replace Unicode symbols with colored ASCII equivalents
        safe_text = text.replace('\u2713', f'{Fore.GREEN}[OK]{Style.RESET_ALL}').replace('\u2717', f'{Fore.RED}[MISSING]{Style.RESET_ALL}')
        print(safe_text)

def colored_print(text, color=None):
    """Print text with optional color, handling Unicode gracefully."""
    if color:
        colored_text = f"{color}{text}{Style.RESET_ALL}"
    else:
        colored_text = text
    safe_print(colored_text)

# Initialize colorama for Windows compatibility
init()

# --- Configuration Constants ---
AI_AGENTS_SHEET_NAME = 'AI agents and LLMs'
AI_AGENTS_CATEGORY_NAME = 'AI agents and LLMs'
BLOCK_WHITELIST_SHEET_NAME = 'Verified Bots'
UNIQUE_ID_COLUMN = 'Name'

# --- Directory Setup ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Working directory is the DataDome folder in the parent directory
WORKING_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), 'DataDome Verified Bots Compare')
ARCHIVE_DIR = os.path.join(WORKING_DIR, '_archive')

SHEET_CATEGORY_MAPPING = {
    'Major Search Engine': 'Major Search Engine',
    'Web Aggregator': 'Web Aggregator',
    'Social Network': 'Social Network',
    'ADS': 'Ads',
    'Seo Software': 'SEO software',
    'Competitive Intelligence': 'Competitive Intelligence',
    'Technical Partner': 'Technical partner',
    'Alt Search Engine': 'Alt Search Engine',
    'Marketing Database': 'Marketing Database',
    'Data provider': 'Data Provider',
    'Security Intelligence': 'Security Intelligence',
    'Media Monitoring': 'Media Monitoring',
    'Comparators': 'Comparators',
    'Marketing Tools': 'Marketing Tools',
    'Digital library': 'Digital Library',
    'Healthcheck': 'Healthcheck',
    'Local Range': 'Local Range',
    'other': 'Other',
    AI_AGENTS_SHEET_NAME: AI_AGENTS_CATEGORY_NAME
}

def setup_directories():
    """Create the archive directory if it doesn't exist."""
    os.makedirs(ARCHIVE_DIR, exist_ok=True)

def normalize_name(name):
    """Normalize bot names for accurate comparison."""
    if not isinstance(name, str):
        return ''
    return re.sub(r'[\s_]+', '', name.lower().strip())

def similarity(a, b):
    """Calculate a similarity score between two strings."""
    norm_a = normalize_name(a)
    norm_b = normalize_name(b)
    if norm_a == norm_b:
        return 1.0
    if norm_a in norm_b or norm_b in norm_a:
        return 0.95
    return SequenceMatcher(None, norm_a, norm_b).ratio()

def extract_date_from_filename(file_path):
    """Extract a date from the filename."""
    try:
        filename = os.path.basename(file_path)
        m = re.search(r"(20\d{2})[-_](\d{2})[-_](\d{2})", filename)
        if m:
            year, month, day = int(m.group(1)), int(m.group(2)), int(m.group(3))
            return date(year, month, day)
    except Exception:
        pass
    return None

def find_potential_rename(new_bot_name, all_bots_map, threshold=0.7):
    """Finds the best potential rename for a bot."""
    best_match = None
    highest_sim = 0
    for original_name, properties in all_bots_map.items():
        sim = similarity(new_bot_name, original_name)
        if sim > highest_sim:
            highest_sim = sim
            best_match = (original_name, properties['category'], sim)
    if highest_sim >= threshold:
        return best_match
    return None

def extract_bots_from_block_whitelist(block_whitelist_file):
    """Extracts all bots from the Block/Whitelist file, handling merged category cells."""
    print(f"-> Reading and processing Block/Whitelist file: {os.path.basename(block_whitelist_file)}")
    try:
        df = pd.read_excel(block_whitelist_file, sheet_name=BLOCK_WHITELIST_SHEET_NAME, header=1)
    except Exception as e:
        print(f"\n[-] Error Reading File: Could not read the sheet '{BLOCK_WHITELIST_SHEET_NAME}'.\nError: {e}")
        return None, None
        
    category_col, bot_name_col, response_col = df.columns[0], df.columns[1], df.columns[2]
    
    normalized_to_original = {}
    all_bots_details = {}
    current_category = ''  # Variable to hold the last seen category

    for _, row in df.iterrows():
        category = str(row[category_col]).strip()
        bot_name = str(row[bot_name_col]).strip()
        response = str(row[response_col]).strip()

        if category and category.lower() != 'nan':
            current_category = category

        if bot_name and bot_name.lower() != 'nan':
            if response.lower() == 'allow':
                response = 'Allow (Whitelist)'
            
            normalized_name = normalize_name(bot_name)
            normalized_to_original[normalized_name] = bot_name
            all_bots_details[bot_name] = {'response': response, 'category': current_category}

    print(f"-> Found {len(all_bots_details)} total bots in the Block/Whitelist file.")
    return normalized_to_original, all_bots_details

def process_report_data(df, report_category, normalized_whitelist, whitelist_details):
    """Processes a DataFrame from a report sheet."""
    findings = []
    if UNIQUE_ID_COLUMN not in df.columns or 'Response' not in df.columns:
        return findings
    for _, row in df.iterrows():
        report_name, report_response = str(row[UNIQUE_ID_COLUMN]).strip(), str(row['Response']).strip()
        if not report_name or report_name.lower() == 'nan':
            continue

        normalized_report_name = normalize_name(report_name)

        if normalized_report_name not in normalized_whitelist:
            rename_info = find_potential_rename(report_name, whitelist_details)
            if rename_info:
                original_name, original_category, sim_score = rename_info
                findings.append({
                    'Category in Report': report_category, 'Bot Name in Report': report_name, 'Report Response': report_response,
                    'Block/Whitelist Response': whitelist_details[original_name]['response'], 'Change Type': 'Possible Rename',
                    'Original Name Guess': f"{original_name} (Similarity: {sim_score:.2f})", 'Original Category Guess': original_category,
                })
            else:
                findings.append({
                    'Category in Report': report_category, 'Bot Name in Report': report_name, 'Report Response': report_response,
                    'Block/Whitelist Response': 'N/A', 'Change Type': 'New Entry',
                    'Original Name Guess': 'N/A', 'Original Category Guess': 'N/A',
                })
    return findings

def create_output_excel(findings_df, output_path):
    """Creates a formatted Excel file."""
    wb = Workbook()
    ws = wb.active
    ws.title = "New and Renamed Bots"
    for r in dataframe_to_rows(findings_df, index=False, header=True):
        ws.append(r)
    bold_font = Font(bold=True)
    for cell in ws[1]:
        cell.font = bold_font
    for col in ws.columns:
        max_length = 0
        column = get_column_letter(col[0].column)
        for cell in col:
            cell.alignment = Alignment(wrap_text=True, vertical='top')
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except: pass
        adjusted_width = (max_length + 2) * 1.2
        ws.column_dimensions[column].width = min(max(20, adjusted_width), 60)

    red_fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
    yellow_fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")

    red_dxf = DifferentialStyle(fill=red_fill)
    yellow_dxf = DifferentialStyle(fill=yellow_fill)

    change_type_col_letter = ''
    for cell in ws[1]:
        if cell.value == 'Change Type':
            change_type_col_letter = get_column_letter(cell.column)
            break

    if change_type_col_letter:
        new_entry_rule = Rule(type='expression', dxf=red_dxf, stopIfTrue=True)
        new_entry_rule.formula = [f'ISNUMBER(SEARCH("New Entry", {change_type_col_letter}2))']
        ws.conditional_formatting.add(f'{change_type_col_letter}2:{change_type_col_letter}{ws.max_row}', new_entry_rule)

        rename_rule = Rule(type='expression', dxf=yellow_dxf, stopIfTrue=True)
        rename_rule.formula = [f'ISNUMBER(SEARCH("Rename", {change_type_col_letter}2))']
        ws.conditional_formatting.add(f'{change_type_col_letter}2:{change_type_col_letter}{ws.max_row}', rename_rule)

    wb.save(output_path)
    print(f"\n-> Successfully created the report: {output_path}")

def find_latest_file(directory, file_identifier, file_type="date"):
    """Finds the latest file in a directory based on date in filename or modification time."""
    latest_file = None
    latest_time = None
    for filename in os.listdir(directory):
        if file_identifier.lower() in filename.lower() and filename.endswith('.xlsx') and not filename.startswith('~'):
            file_path = os.path.join(directory, filename)
            current_time = None
            if file_type == "date":
                current_time = extract_date_from_filename(file_path)
            else: # "mod_time"
                current_time = os.path.getmtime(file_path)

            if current_time:
                if latest_time is None or current_time > latest_time:
                    latest_time = current_time
                    latest_file = file_path
    return latest_file

def main():
    """Main automated processing logic."""
    root = Tk()
    root.withdraw()
    warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')
    setup_directories()

    colored_print("-> Searching for the latest files in the script's directory...", Fore.CYAN)

    block_whitelist_file = find_latest_file(WORKING_DIR, "Block or Whitelist", file_type="mod_time")
    ai_agents_file = find_latest_file(WORKING_DIR, "DataDome_Export_AI_agents", file_type="date")
    verified_bots_file = find_latest_file(WORKING_DIR, "DataDome_Export_verified_bots", file_type="date")

    print("\nRequired Files:")
    
    file_requirements = [
        {
            'name': 'DataDome Bots - Block or Whitelist.xlsx',
            'found_file': block_whitelist_file,
            'search_pattern': 'block.*whitelist',
            'description': 'Master list file'
        },
        {
            'name': 'DataDome_Export_AI_agents_YYYY-MM-DD.xlsx',
            'found_file': ai_agents_file,
            'search_pattern': 'AI_agents',
            'description': 'AI agents report'
        },
        {
            'name': 'DataDome_Export_verified_bots_YYYY-MM-DD.xlsx',
            'found_file': verified_bots_file,
            'search_pattern': 'verified_bots',
            'description': 'Verified bots report'
        }
    ]
    
    for req in file_requirements:
        if req['found_file']:
            safe_print(f"  \u2713 {os.path.basename(req['found_file'])}")
        else:
            import re
            similar_files = []
            for filename in os.listdir(WORKING_DIR):
                if (re.search(req['search_pattern'], filename, re.IGNORECASE) and 
                    filename.endswith('.xlsx') and not filename.startswith('~')):
                    similar_files.append(filename)
            
            if similar_files:
                safe_print(f"  \u2717 {req['name']} (found but invalid: {', '.join(similar_files)})")
            else:
                safe_print(f"  \u2717 {req['name']}")
    
    if not all([block_whitelist_file, ai_agents_file, verified_bots_file]):
        missing_count = sum(1 for f in [block_whitelist_file, ai_agents_file, verified_bots_file] if not f)
        print(f"\n[-] Error: {missing_count} required file{'s' if missing_count > 1 else ''} missing from the script's directory.")
        print("\nPlease ensure all required files are present before running the script.")
        print("\nNote: Files with dates in their names should follow the format YYYY-MM-DD.")
        return

    safe_print(f"\n\u2713 All required files found! Proceeding with analysis...")

    normalized_whitelist, whitelist_details = extract_bots_from_block_whitelist(block_whitelist_file)
    if not normalized_whitelist: return
    all_findings = []

    colored_print("\n-> Processing Verified Bots file...", Fore.CYAN)
    with pd.ExcelFile(verified_bots_file) as xls_verified:
        for sheet_name in xls_verified.sheet_names:
            if sheet_name in SHEET_CATEGORY_MAPPING:
                report_category = SHEET_CATEGORY_MAPPING[sheet_name]
                print(f"  - Analyzing sheet: '{sheet_name}' (Category: '{report_category}')")
                df_sheet = pd.read_excel(xls_verified, sheet_name=sheet_name)
                findings = process_report_data(df_sheet, report_category, normalized_whitelist, whitelist_details)
                all_findings.extend(findings)

    colored_print("\n-> Processing AI Agents file...", Fore.CYAN)
    try:
        with pd.ExcelFile(ai_agents_file) as xls_ai:
            df_ai = pd.read_excel(xls_ai, sheet_name=AI_AGENTS_SHEET_NAME)
            findings = process_report_data(df_ai, AI_AGENTS_CATEGORY_NAME, normalized_whitelist, whitelist_details)
            all_findings.extend(findings)
    except Exception as e:
        print(f"\n[!] Warning: Could not process AI Agents file sheet '{AI_AGENTS_SHEET_NAME}'.\nError: {e}")

    if not all_findings:
        print("\n-> No new or renamed bots were found.")
        print("\n" + Fore.GREEN + "="*60)
        print("     ANALYSIS COMPLETE!")
        print("="*60 + Style.RESET_ALL)
        print("\nNo new or renamed bots were found.")
        
        colored_print("\n-> Archiving processed report files...", Fore.YELLOW)
        shutil.move(ai_agents_file, os.path.join(ARCHIVE_DIR, os.path.basename(ai_agents_file)))
        shutil.move(verified_bots_file, os.path.join(ARCHIVE_DIR, os.path.basename(verified_bots_file)))
        colored_print("-> Archiving complete.", Fore.GREEN)
        return

    findings_df = pd.DataFrame(all_findings)
    output_columns = [
        'Category in Report', 'Bot Name in Report', 'Report Response', 'Block/Whitelist Response',
        'Change Type', 'Original Name Guess', 'Original Category Guess'
    ]
    findings_df = findings_df.reindex(columns=output_columns)

    file_date = extract_date_from_filename(verified_bots_file)
    report_date_str = file_date.strftime('%Y-%m-%d') if file_date else datetime.now().strftime('%Y-%m-%d')
    output_file = os.path.join(WORKING_DIR, f"DataDome_New_Entries_Report_{report_date_str}.xlsx")
    create_output_excel(findings_df, output_file)

    colored_print("\n-> Archiving processed report files...", Fore.YELLOW)
    shutil.move(ai_agents_file, os.path.join(ARCHIVE_DIR, os.path.basename(ai_agents_file)))
    shutil.move(verified_bots_file, os.path.join(ARCHIVE_DIR, os.path.basename(verified_bots_file)))
    colored_print("-> Archiving complete.", Fore.GREEN)

    print("\n" + Fore.GREEN + "="*60)
    print("     ANALYSIS COMPLETE!")
    print("="*60 + Style.RESET_ALL)
    print(f"\nFound {len(findings_df)} new or renamed bots.")
    print(f"\nReport saved to: {output_file}")

if __name__ == '__main__':
    main()
