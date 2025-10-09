import pandas as pd
import os
import warnings
from datetime import date, datetime
import shutil
import re
from tkinter import Tk, filedialog, messagebox
from openpyxl import load_workbook
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import Rule
from openpyxl.styles import Font
from openpyxl.styles import Alignment
from openpyxl.styles.differential import DifferentialStyle
from openpyxl.styles import PatternFill
from colorama import init, Fore, Style
import sys

# Initialize colorama for Windows compatibility
init(autoreset=True)

# Safe print function to handle Unicode in subprocess context
def safe_print(text):
    """Print text with Unicode fallback for subprocess context, and colorize checkmarks when possible."""
    try:
        # If there are no ANSI codes already, colorize ✓/✗ inline for terminal output
        if isinstance(text, str) and ('\x1b[' not in text):
            text = text.replace('✓', f'{Fore.GREEN}✓{Style.RESET_ALL}').replace('✗', f'{Fore.RED}✗{Style.RESET_ALL}')
        # Force flush to ensure colorama codes are processed immediately
        print(text, flush=True)
    except UnicodeEncodeError:
        # Fallback: replace Unicode symbols with colored ASCII equivalents
        safe_text = text
        if isinstance(safe_text, str):
            safe_text = safe_text.replace('✓', f'{Fore.GREEN}[OK]{Style.RESET_ALL}').replace('✗', f'{Fore.RED}[MISSING]{Style.RESET_ALL}')
        print(safe_text, flush=True)

def colored_print(text, color=None):
    """Print text with optional color, handling Unicode gracefully."""
    if color:
        colored_text = f"{color}{text}{Style.RESET_ALL}"
    else:
        colored_text = text
    safe_print(colored_text)

def print_critical_line(text):
    """Print a line with the word 'Critical' highlighted in red."""
    # Replace 'Critical' with colored version
    colored_text = text.replace('Critical', f'{Fore.RED}Critical{Style.RESET_ALL}')
    safe_print(colored_text)

# --- Configuration Constants ---
REPO_SHEET_NAME = 'Snyk all repositories'
WORKING_SHEET_NAME = 'Working sheet'
TRACKER_SHEET_NAME = 'Vulnerability Tracker'
TRACKER_DATA_SHEET_NAME = 'Tickets' # Preferred sheet to read from in the tracker file
UNIQUE_ID_COLUMN = 'ISSUE_URL'
# --- Directory Setup ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Working directory is the Snyk folder in the parent directory; allow env override
WORKING_DIR = os.getenv('WORKING_DIR') or os.path.join(os.path.dirname(SCRIPT_DIR), 'Snyk Report Compare')
ARCHIVE_DIR = os.getenv('ARCHIVE_DIR') or os.path.join(WORKING_DIR, '_archive')

def setup_directories():
    """Create the archive directory if it doesn't exist and check write permissions."""
    try:
        os.makedirs(ARCHIVE_DIR, exist_ok=True)
    except Exception as e:
        safe_print(f"[!] Warning: Could not create archive directory '{ARCHIVE_DIR}': {e}")
    # Check write permission by attempting to create and remove a temp file
    try:
        test_path = os.path.join(ARCHIVE_DIR, f".perm_check_{int(datetime.now().timestamp())}")
        with open(test_path, 'w') as f:
            f.write('ok')
        os.remove(test_path)
        safe_print(f"[✓] Archive directory ready: {ARCHIVE_DIR}")
        return True
    except Exception as e:
        safe_print(f"[!] Warning: Archive directory not writable: {ARCHIVE_DIR} ({e})")
        return False

def find_sheet_name(book, target_name):
    """Finds a sheet name in a workbook object case-insensitively."""
    for sheet_name in book.sheetnames:
        if sheet_name.lower() == target_name.lower():
            return sheet_name
    return None

def extract_snyk_id(url):
    """Extracts and lowercases the unique SNYK-ID from a URL for robust, case-insensitive matching."""
    if isinstance(url, str):
        lower_url = url.lower()
        if '#issue-snyk-' in lower_url:
            return lower_url.split('#issue-')[-1].strip()
        if 'snyk-' in lower_url:
            return lower_url[lower_url.find('snyk-'):].strip()
    return ''

def extract_url_from_hyperlink(hyperlink_data):
    """Extract the actual URL from either a HYPERLINK formula or native hyperlink tuple."""
    # Handle native hyperlink tuples (display_text, url)
    if isinstance(hyperlink_data, tuple) and len(hyperlink_data) == 2:
        display_text, url = hyperlink_data
        return url if url else display_text
    
    # Handle old HYPERLINK formula format
    if isinstance(hyperlink_data, str) and hyperlink_data.strip().upper().startswith('=HYPERLINK('):
        try:
            # Extract content between =HYPERLINK( and )
            inner = hyperlink_data[len('=HYPERLINK('):-1]
            # Split by comma and take the first part (the URL)
            url_part = inner.split(',')[0].strip()
            # Remove quotes
            if url_part.startswith('"') and url_part.endswith('"'):
                url_part = url_part[1:-1]
            return url_part
        except:
            return hyperlink_data
    
    # Return as-is for plain strings or other formats
    return hyperlink_data

def _parse_ticket_cell_value(cell):
    """Extract display text and URL from a tracker 'Ticket link' cell.
    Supports real hyperlinks and HYPERLINK() formulas, and plain URLs.
    Returns tuple (display_text, url or None).
    """
    if cell is None:
        return ('', None)
    value = cell.value
    text = str(value) if value is not None else ''
    # If true hyperlink object present
    if getattr(cell, 'hyperlink', None) and cell.hyperlink.target:
        return (text, cell.hyperlink.target)
    # If the cell stores an Excel formula like =HYPERLINK("url","text")
    if isinstance(value, str) and value.strip().upper().startswith('=HYPERLINK('):
        formula = value.strip()
        try:
            inner = formula[len('=HYPERLINK('):-1]
            # split on first comma that is not inside quotes
            parts = []
            current = ''
            in_quotes = False
            for ch in inner:
                if ch == '"':
                    in_quotes = not in_quotes
                    current += ch
                elif ch == ',' and not in_quotes:
                    parts.append(current.strip())
                    current = ''
                else:
                    current += ch
            if current:
                parts.append(current.strip())
            if len(parts) >= 1:
                url_part = parts[0].strip()
                if url_part.startswith('"') and url_part.endswith('"'):
                    url = url_part[1:-1]
                else:
                    url = url_part
            else:
                url = None
            display = ''
            if len(parts) >= 2:
                text_part = parts[1].strip()
                if text_part.startswith('"') and text_part.endswith('"'):
                    display = text_part[1:-1]
                else:
                    display = text_part
            return (display or text, url)
        except Exception:
            return (text, None)
    # Plain URL in the cell value
    if isinstance(value, str) and value.strip().lower().startswith('http'):
        return (value.strip(), value.strip())
    return (text, None)

def extract_report_date_from_filename(file_path):
    """Extract a date from the filename. Supports patterns like YYYY-MM-DD or YYYY_MM_DD.
    Returns a date object if found, else None.
    """
    try:
        filename = os.path.basename(file_path)
        # Look for 4-digit year with - or _ separators
        m = re.search(r"(20\d{2})[-_](\d{2})[-_](\d{2})", filename)
        if m:
            year, month, day = int(m.group(1)), int(m.group(2)), int(m.group(3))
            return date(year, month, day)
    except Exception:
        pass
    return None

def find_snyk_reports(directory, identifier="snyk"):
    """Finds the two most recent Snyk reports in a directory based on dates in their filenames."""
    report_files = []
    for filename in os.listdir(directory):
        if identifier.lower() in filename.lower() and filename.endswith('.xlsx') and not filename.startswith('~'):
            file_path = os.path.join(directory, filename)
            report_date = extract_report_date_from_filename(file_path)
            if report_date:
                report_files.append((report_date, file_path))

    if not report_files:
        return None, None

    # Sort by date (newest first), which correctly handles dates like 11/09/2025 vs 04/09/2025.
    report_files.sort(key=lambda x: x[0], reverse=True)

    newest_file = report_files[0][1]
    older_file = report_files[1][1] if len(report_files) > 1 else None

    return older_file, newest_file

def find_latest_tracker_file(directory, identifier="tracker"):
    """Finds the most recently modified tracker file in a directory."""
    latest_file = None
    latest_time = 0
    for filename in os.listdir(directory):
        if identifier.lower() in filename.lower() and filename.endswith('.xlsx') and not filename.startswith('~'):
            file_path = os.path.join(directory, filename)
            try:
                mod_time = os.path.getmtime(file_path)
                if mod_time > latest_time:
                    latest_time = mod_time
                    latest_file = file_path
            except OSError:
                continue # Ignore files that might be deleted during script run
    return latest_file

def validate_required_sheets(old_file, new_file, tracker_file):
    """Validate that all required sheets exist before processing.
    Returns True if all validations pass, False otherwise.
    """
    print("\n--- Pre-flight Validation: Checking Required Sheets ---")
    
    # Check new report file
    try:
        book_new = load_workbook(new_file, read_only=True, data_only=True)
        new_sheet_name = find_sheet_name(book_new, REPO_SHEET_NAME)
        book_new.close()
        
        if not new_sheet_name:
            colored_print(f"\n[-] Validation Failed: Required sheet '{REPO_SHEET_NAME}' not found in new report '{os.path.basename(new_file)}'.", Fore.RED)
            colored_print(f"    Available sheets: {', '.join([name for name in load_workbook(new_file, read_only=True, data_only=True).sheetnames])}", Fore.YELLOW)
            return False
        else:
            safe_print(f"  ✓ New report sheet '{REPO_SHEET_NAME}' found")
    except Exception as e:
        colored_print(f"\n[-] Validation Failed: Could not read new report file '{os.path.basename(new_file)}'. Error: {e}", Fore.RED)
        return False
    
    # Check old report file (if provided)
    if old_file:
        try:
            book_old = load_workbook(old_file, read_only=True, data_only=True)
            old_sheet_name = find_sheet_name(book_old, REPO_SHEET_NAME)
            book_old.close()
            
            if not old_sheet_name:
                colored_print(f"\n[-] Validation Failed: Required sheet '{REPO_SHEET_NAME}' not found in old report '{os.path.basename(old_file)}'.", Fore.RED)
                colored_print(f"    Available sheets: {', '.join([name for name in load_workbook(old_file, read_only=True, data_only=True).sheetnames])}", Fore.YELLOW)
                return False
            else:
                safe_print(f"  ✓ Old report sheet '{REPO_SHEET_NAME}' found")
        except Exception as e:
            colored_print(f"\n[-] Validation Failed: Could not read old report file '{os.path.basename(old_file)}'. Error: {e}", Fore.RED)
            return False
    
    # Check tracker file (if provided)
    if tracker_file:
        try:
            book_tracker = load_workbook(tracker_file, read_only=True, data_only=True)
            tracker_sheet_name = find_sheet_name(book_tracker, TRACKER_DATA_SHEET_NAME) or \
                                 find_sheet_name(book_tracker, TRACKER_SHEET_NAME)
            available_sheets = book_tracker.sheetnames
            book_tracker.close()
            
            if not tracker_sheet_name:
                colored_print(f"\n[-] Validation Failed: Required tracker sheet '{TRACKER_DATA_SHEET_NAME}' or '{TRACKER_SHEET_NAME}' not found in tracker file '{os.path.basename(tracker_file)}'.", Fore.RED)
                colored_print(f"    Available sheets: {', '.join(available_sheets)}", Fore.YELLOW)
                return False
            else:
                safe_print(f"  ✓ Tracker sheet '{tracker_sheet_name}' found")
        except Exception as e:
            colored_print(f"\n[-] Validation Failed: Could not read tracker file '{os.path.basename(tracker_file)}'. Error: {e}", Fore.RED)
            return False
    
    colored_print("  ✓ All required sheets validated successfully!", Fore.GREEN)
    return True

def process_reports(old_file, new_file, tracker_file):
    """Main logic to compare reports, process data, and write the output file."""
    warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')
    
    # Validate all required sheets before proceeding
    if not validate_required_sheets(old_file, new_file, tracker_file):
        colored_print("\n[-] Script execution aborted due to validation failures.", Fore.RED)
        colored_print("    Please ensure all required sheets exist in the input files before running the script.", Fore.YELLOW)
        return
    
    original_renamed_path = None
    selected_new_file_path = new_file  # Preserve the originally selected NEW file path for date extraction
    try:
        print("\n--- Step 1: Initializing and Backing Up Files ---")
        base, ext = os.path.splitext(new_file)
        original_renamed_path = f"{base}-original{ext}"
        if os.path.exists(original_renamed_path):
            os.remove(original_renamed_path)
        os.rename(new_file, original_renamed_path)
        print(f"  - Success: Backed up original report to '{original_renamed_path}'")

        print("\n--- Step 2: Reading Excel Reports ---")
        book_new = load_workbook(original_renamed_path, read_only=True, data_only=True)
        new_sheet_name = find_sheet_name(book_new, REPO_SHEET_NAME)
        book_new.close()
        
        df_old = pd.DataFrame()
        if old_file:
            book_old = load_workbook(old_file, read_only=True, data_only=True)
            old_sheet_name = find_sheet_name(book_old, REPO_SHEET_NAME)
            book_old.close()
            print(f"  - Reading old report: '{old_file}'")
            if old_sheet_name:
                df_old = pd.read_excel(old_file, sheet_name=old_sheet_name, engine='openpyxl')

        print(f"  - Reading new report: '{original_renamed_path}'")

        # These checks are now redundant due to pre-flight validation, but kept for safety
        if not new_sheet_name:
            print(f"\n[-] Error: Could not find sheet '{REPO_SHEET_NAME}' in '{original_renamed_path}'.")
            os.rename(original_renamed_path, new_file)
            return

        df_new = pd.read_excel(original_renamed_path, sheet_name=new_sheet_name, engine='openpyxl')
        if df_old.empty:
            df_old = pd.DataFrame(columns=df_new.columns)

        print("  - Success: Data loaded into memory.")

        for df, path in [(df_new, new_file), (df_old, old_file)]:
            if path and UNIQUE_ID_COLUMN not in df.columns:
                 print(f"\n[-] Format Error: Required column '{UNIQUE_ID_COLUMN}' not found in '{path}'.")
                 os.rename(original_renamed_path, new_file)
                 return

        print("\n--- Step 3: Comparing Reports ---")
        old_urls = set(df_old[UNIQUE_ID_COLUMN].astype(str).str.strip())
        df_new[UNIQUE_ID_COLUMN] = df_new[UNIQUE_ID_COLUMN].astype(str).str.strip()
        new_items_df = df_new[~df_new[UNIQUE_ID_COLUMN].isin(old_urls)].copy()
        if new_items_df.empty:
            print("\n[+] No New Items: No new vulnerabilities were found.")
            os.rename(original_renamed_path, new_file)
            return
        
        print(f"  - Success: Found {len(new_items_df)} new vulnerabilities.")

        print("\n--- Step 4: Processing New Vulnerabilities ---")
        
        critical_count = 0
        if 'TR SEVERITY' in new_items_df.columns:
            critical_count = len(new_items_df[new_items_df['TR SEVERITY'] == 'Critical'])
        print(f"  - Found {critical_count} new 'Critical' vulnerabilities.")

        if 'NAME' in new_items_df.columns:
            new_items_df = new_items_df.sort_values('NAME', ascending=True)
            print("  - Sorted items by 'NAME' alphabetically.")
        else:
            print("  - Warning: 'NAME' column not found, skipping sort.")
        
        # Prepare default empty ticket series aligned to new items
        ticket_data = pd.Series([''] * len(new_items_df), index=new_items_df.index)
        if tracker_file:
            print("  - Cross-referencing with Vulnerability Tracker file...")
            try:
                # Identify tracker sheet (prefer 'Tickets', fall back to 'Vulnerability Tracker')
                book_tracker = load_workbook(tracker_file, data_only=False)
                tracker_sheet_name = find_sheet_name(book_tracker, TRACKER_DATA_SHEET_NAME) or \
                                     find_sheet_name(book_tracker, TRACKER_SHEET_NAME)
                if tracker_sheet_name:
                    ws = book_tracker[tracker_sheet_name]
                    headers = [cell.value for cell in ws[1]]
                    if 'Issue URL' in headers and 'Ticket link' in headers:
                        issue_url_col_idx = headers.index('Issue URL') + 1
                        ticket_link_col_idx = headers.index('Ticket link') + 1
                        # Build exact URL -> (display_text, hyperlink_url) map, case-insensitive on URL
                        ticket_map = {}
                        for row_cells in ws.iter_rows(min_row=2):
                            issue_cell = row_cells[issue_url_col_idx - 1]
                            ticket_cell = row_cells[ticket_link_col_idx - 1]
                            issue_value = str(issue_cell.value).strip() if issue_cell.value else ''
                            if not issue_value:
                                continue
                            key = issue_value.lower()
                            display_text, link_target = _parse_ticket_cell_value(ticket_cell)
                            if display_text and (link_target or str(display_text).strip()):
                                ticket_map[key] = (display_text, link_target)

                        # Map by exact Issue URL (case-insensitive)
                        issue_keys = new_items_df['ISSUE_URL'].astype(str).str.strip().str.lower()
                        ticket_data = issue_keys.map(ticket_map)
                        print(f"  - Success: Found and mapped {ticket_data.notna().sum()} existing tickets from the tracker.")
                    else:
                        print("\n[!] Tracker Warning: Tracker file is missing 'Issue URL' or 'Ticket link' columns.")
                else:
                    print(f"\n[!] Tracker Warning: Could not find '{TRACKER_DATA_SHEET_NAME}' or '{TRACKER_SHEET_NAME}' sheet in tracker file.")
                book_tracker.close()
            except Exception as e:
                print(f"\n[-] Tracker Error: Could not read or process the tracker file.\nError: {e}")

        # Convert mapped data (tuples/strings) into Excel HYPERLINK formulas
        def create_hyperlink_from_tuple(data):
            """Returns tuple (display_text, url) for native Excel hyperlinks, or just text for non-links"""
            if isinstance(data, tuple):
                text, link = data
                if link and str(link).strip().lower().startswith('http'):
                    return (str(text) if text is not None else str(link), str(link).strip())
                # If no explicit link but text looks like a URL, link to itself
                if isinstance(text, str) and text.strip().lower().startswith('http'):
                    s = text.strip()
                    return (str(text), s)
                return str(text) if text is not None else ''
            if isinstance(data, str):
                s = data.strip()
                if not s:
                    return ''
                if s.lower().startswith('http'):
                    return (s, s)
                return s
            return '' # Return empty string for NaN/no match

        # Convert URLs to hyperlinks for Issue URL columns
        def create_url_hyperlink(url):
            """Returns tuple (display_text, url) for native Excel hyperlinks, or just text for non-links"""
            if not url or not isinstance(url, str):
                return url
            url = str(url).strip()
            if not url or not url.lower().startswith('http'):
                return url
            return (url, url)

        # Remove helper key if present before writing
        # Ensure no leftover helper keys
        if '__IssueKey' in new_items_df.columns:
            new_items_df = new_items_df.drop(columns=['__IssueKey'])
        ticket_col_pos = new_items_df.columns.get_loc('ID') + 1 if 'ID' in new_items_df.columns else 0
        new_items_df.insert(ticket_col_pos, 'Ticket', ticket_data.apply(create_hyperlink_from_tuple))
        
        # Convert Issue URL column to hyperlinks
        if 'ISSUE_URL' in new_items_df.columns:
            new_items_df['ISSUE_URL'] = new_items_df['ISSUE_URL'].apply(create_url_hyperlink)
        
        print("  - Added 'Ticket' column and converted ticket info to hyperlinks.")
        print("  - Converted Issue URL column to hyperlinks.")
        
        # Apply hyperlink formatting to cells with HYPERLINK formulas
        def apply_hyperlink_formatting(sheet, df, ticket_col_name='Ticket', issue_url_col_name='ISSUE_URL'):
            """Apply native Excel hyperlinks to cells that contain hyperlink tuples"""
            hyperlink_font = Font(color="3465a4", underline="single")  # Custom color with underline
            
            # Process Ticket column
            if ticket_col_name in df.columns:
                ticket_col_idx = df.columns.get_loc(ticket_col_name) + 1
                for row_idx in range(2, len(df) + 2):  # Start from row 2 (after header)
                    cell = sheet.cell(row=row_idx, column=ticket_col_idx)
                    df_row_idx = row_idx - 2  # Convert to DataFrame index
                    if df_row_idx < len(df):
                        original_value = df.iloc[df_row_idx][ticket_col_name]
                        if isinstance(original_value, tuple) and len(original_value) == 2:
                            display_text, url = original_value
                            cell.value = display_text
                            cell.hyperlink = url
                            cell.font = hyperlink_font
            
            # Process Issue URL column
            if issue_url_col_name in df.columns:
                url_col_idx = df.columns.get_loc(issue_url_col_name) + 1
                for row_idx in range(2, len(df) + 2):  # Start from row 2 (after header)
                    cell = sheet.cell(row=row_idx, column=url_col_idx)
                    df_row_idx = row_idx - 2  # Convert to DataFrame index
                    if df_row_idx < len(df):
                        original_value = df.iloc[df_row_idx][issue_url_col_name]
                        if isinstance(original_value, tuple) and len(original_value) == 2:
                            display_text, url = original_value
                            cell.value = display_text
                            cell.hyperlink = url
                            cell.font = hyperlink_font

        print("\n--- Step 5: Creating 'Working sheet' ---")
        book = load_workbook(original_renamed_path, data_only=False)
        source_sheet = book[new_sheet_name]

        existing_working_sheet_name = find_sheet_name(book, WORKING_SHEET_NAME)
        if existing_working_sheet_name:
            book.remove(book[existing_working_sheet_name])
        
        target_sheet = book.copy_worksheet(source_sheet)
        target_sheet.title = WORKING_SHEET_NAME
        target_sheet.sheet_properties.tabColor = "00FF00"  # Green color
        target_sheet.delete_rows(2, target_sheet.max_row + 1)
        target_sheet.insert_cols(ticket_col_pos + 1)
        target_sheet.cell(row=1, column=ticket_col_pos + 1).value = 'Ticket'

        # Create a display version of the DataFrame for writing to Excel
        display_df = new_items_df.copy()
        for col in display_df.columns:
            display_df[col] = display_df[col].apply(lambda x: x[0] if isinstance(x, tuple) and len(x) == 2 else x)
        
        for r in dataframe_to_rows(display_df, index=False, header=False):
            target_sheet.append(r)
        print(f"  - Wrote {len(new_items_df)} items to the sheet.")
        
        if not new_items_df.empty and 'TR SEVERITY' in new_items_df.columns:
            red_font = Font(color="9C0006")
            dxf = DifferentialStyle(font=red_font)
            severity_col_letter = get_column_letter(new_items_df.columns.get_loc('TR SEVERITY') + 1)
            rule_range = f"{severity_col_letter}2:{severity_col_letter}{len(new_items_df) + 1}"
            critical_rule = Rule(type="cellIs", operator="equal", formula=['"Critical"'], dxf=dxf)
            target_sheet.conditional_formatting.add(rule_range, critical_rule)
            print("  - Applied conditional formatting for 'Critical' severity.")

        if 'PROJECT_NAME' in new_items_df.columns:
            project_col_idx = new_items_df.columns.get_loc('PROJECT_NAME')
            hidden_count = 0
            for row in target_sheet.iter_rows(min_row=2, max_row=len(new_items_df) + 1):
                if 'docker' in str(row[project_col_idx].value).lower():
                    target_sheet.row_dimensions[row[0].row].hidden = True
                    hidden_count += 1
            print(f"  - Hid {hidden_count} 'docker' related projects.")

        target_sheet.auto_filter.ref = target_sheet.dimensions
        
        print("  - Adjusting column widths and formats for 'Working sheet'...")
        columns_to_autosize = [
            'STATUS', 'GRACE PERIOD', 'NAME', 'TR SEVERITY', 'PROJECT_NAME', 
            'PROBLEM_TITLE', 'CWE', 'CVE', 'PACKAGE_NAME_AND_VERSION', 
            'PROJECT_TARGET', 'ISSUE_URL'
        ]
        
        def _display_len(val):
            try:
                s = '' if val is None else str(val)
                s = s.strip()
                # For HYPERLINK formulas, extract the display text (second parameter)
                if s.upper().startswith('=HYPERLINK('):
                    try:
                        # Extract the display text from =HYPERLINK("url","text")
                        inner = s[len('=HYPERLINK('):-1]
                        parts = []
                        current = ''
                        in_quotes = False
                        for ch in inner:
                            if ch == '"':
                                in_quotes = not in_quotes
                                current += ch
                            elif ch == ',' and not in_quotes:
                                parts.append(current.strip())
                                current = ''
                            else:
                                current += ch
                        if current:
                            parts.append(current.strip())
                        # Use display text (2nd parameter) if available, otherwise URL (1st parameter)
                        if len(parts) >= 2:
                            text_part = parts[1]
                            if text_part.startswith('"') and text_part.endswith('"'):
                                text_part = text_part[1:-1]
                            return max(len(text_part), 0)
                        elif len(parts) >= 1:
                            url_part = parts[0]
                            if url_part.startswith('"') and url_part.endswith('"'):
                                url_part = url_part[1:-1]
                            return max(len(url_part), 0)
                    except:
                        pass
                return max(len(s), 0)
            except Exception:
                return 0

        for col_idx, column_header in enumerate(new_items_df.columns, 1):
            column_letter = get_column_letter(col_idx)
            
            if column_header == 'GRACE PERIOD':
                for cell in target_sheet[column_letter][1:]:
                    cell.number_format = 'MM/DD/YYYY'
                    cell.alignment = Alignment(horizontal='center')

            if column_header in columns_to_autosize:
                max_length = _display_len(column_header)
                for cell in target_sheet[column_letter]:
                    try:
                        l = _display_len(cell.value)
                        if l > max_length:
                            max_length = l
                    except:
                        pass
                # Standard padding for Excel/Google Sheets
                adjusted_width = (max_length + 2)
                target_sheet.column_dimensions[column_letter].width = adjusted_width
        
        # Apply hyperlink formatting to Working sheet
        apply_hyperlink_formatting(target_sheet, new_items_df)
        
        # Hide empty CVE_URL column if it exists and is empty, but ensure CVE column stays visible
        if 'CVE_URL' in new_items_df.columns:
            cve_url_col_idx = new_items_df.columns.get_loc('CVE_URL') + 1
            cve_url_col_letter = get_column_letter(cve_url_col_idx)
            # Check if CVE_URL column is mostly empty
            cve_url_values = new_items_df['CVE_URL'].dropna()
            if len(cve_url_values) == 0:  # Column is completely empty
                target_sheet.column_dimensions[cve_url_col_letter].hidden = True
                print("  - Hid empty CVE_URL column to avoid confusion.")
        
        # Ensure CVE column is always visible
        if 'CVE' in new_items_df.columns:
            cve_col_idx = new_items_df.columns.get_loc('CVE') + 1
            cve_col_letter = get_column_letter(cve_col_idx)
            target_sheet.column_dimensions[cve_col_letter].hidden = False
            print("  - Ensured CVE column is visible.")
        
        print("  - Success: 'Working sheet' created and formatted.")

        print(f"\n--- Step 6: Creating '{TRACKER_SHEET_NAME}' sheet ---")
        
        if 'PROJECT_NAME' in new_items_df.columns:
            tracker_source_df = new_items_df[~new_items_df['PROJECT_NAME'].str.contains('docker', case=False, na=False)].copy()
            print(f"  - Filtered out docker items. {len(tracker_source_df)} items will be added to the tracker.")
        else:
            tracker_source_df = new_items_df.copy()

        def format_cve_cwe(row):
            cve = str(row.get('CVE', ''))
            cwe = str(row.get('CWE', ''))
            
            # Clean up CVE - remove existing brackets if present, then add them back
            if cve not in ['nan', '']:
                cve_clean = cve.strip()
                if cve_clean.startswith('["') and cve_clean.endswith('"]'):
                    cve_clean = cve_clean[2:-2]  # Remove existing brackets
                cve = f'["{cve_clean}"]'
            else:
                cve = ''
            
            # Clean up CWE - remove existing brackets if present, then add them back
            if cwe not in ['nan', '']:
                cwe_clean = cwe.strip()
                if cwe_clean.startswith('["') and cwe_clean.endswith('"]'):
                    cwe_clean = cwe_clean[2:-2]  # Remove existing brackets
                cwe = f'["{cwe_clean}"]'
            else:
                cwe = ''
            
            if cve and cwe:
                return f"{cve} / {cwe}"
            return cve or cwe



        pending_tracker_df = pd.DataFrame()
        if not tracker_source_df.empty:
            tracker_df = pd.DataFrame()
            # Determine report date (prefer from originally selected filename)
            # Prefer date from filename; fallback to file modified date; then today's date
            report_date_dt = (
                extract_report_date_from_filename(selected_new_file_path)
                or extract_report_date_from_filename(original_renamed_path or new_file)
                or extract_report_date_from_filename(new_file)
                or None
            )
            if not report_date_dt:
                try:
                    report_ts_source = selected_new_file_path if os.path.exists(selected_new_file_path) else (original_renamed_path if original_renamed_path and os.path.exists(original_renamed_path) else new_file)
                    report_date_dt = datetime.fromtimestamp(os.path.getmtime(report_ts_source)).date()
                except Exception:
                    report_date_dt = date.today()

            tracker_df['Report date'] = report_date_dt
            tracker_df['Ticket created on'] = ''
            tracker_df['Grace Period'] = pd.to_datetime(tracker_source_df['GRACE PERIOD'], errors='coerce').dt.date
            tracker_df['GitHub Repository'] = tracker_source_df['PROJECT_NAME']
            tracker_df['Ticket link'] = tracker_source_df['Ticket']
            tracker_df['Library affected'] = tracker_source_df['PACKAGE_NAME_AND_VERSION']
            tracker_df['CVE/CWE'] = tracker_source_df.apply(format_cve_cwe, axis=1)
            tracker_df['Notes'] = ''
            tracker_df['Current Status'] = ''
            tracker_df['Team'] = ''
            tracker_df['Issue URL'] = tracker_source_df['ISSUE_URL'].apply(create_url_hyperlink)

            existing_tracker_sheet_name = find_sheet_name(book, TRACKER_SHEET_NAME)
            if existing_tracker_sheet_name:
                book.remove(book[existing_tracker_sheet_name])
            
            tracker_sheet = book.create_sheet(TRACKER_SHEET_NAME)
            tracker_sheet.sheet_properties.tabColor = "ADD8E6"  # Light blue color
            
            # Create a display version of the tracker DataFrame for writing to Excel
            tracker_display_df = tracker_df.copy()
            for col in tracker_display_df.columns:
                tracker_display_df[col] = tracker_display_df[col].apply(lambda x: x[0] if isinstance(x, tuple) and len(x) == 2 else x)
            
            for r in dataframe_to_rows(tracker_display_df, index=False, header=True):
                tracker_sheet.append(r)
            print("  - Populated tracker with data.")
            
            bold_font = Font(bold=True)
            for cell in tracker_sheet[1]:
                cell.font = bold_font
            
            # Ensure 'Report date' cells are populated and formatted (MM/DD/YYYY, centered)
            if 'Report date' in tracker_df.columns:
                rd_col_idx = tracker_df.columns.get_loc('Report date') + 1
                for row_idx in range(2, tracker_sheet.max_row + 1):
                    rd_cell = tracker_sheet.cell(row=row_idx, column=rd_col_idx)
                    # Always set the report date, don't check if empty
                    rd_cell.value = report_date_dt
                    rd_cell.number_format = 'MM/DD/YYYY'
                    rd_cell.alignment = Alignment(horizontal='center')

            def _display_len(val):
                try:
                    # Handle tuple values (display_text, url) from native hyperlinks
                    if isinstance(val, tuple) and len(val) == 2:
                        display_text, url = val
                        return max(len(str(display_text)), 0)
                    
                    s = '' if val is None else str(val)
                    s = s.strip()
                    return max(len(s), 0)
                except Exception:
                    return 0

            for col_idx, header in enumerate(tracker_df.columns, 1):
                column_letter = get_column_letter(col_idx)
                if header == 'Grace Period':
                    for cell in tracker_sheet[column_letter][1:]:
                         cell.number_format = 'MM/DD/YYYY'
                         cell.alignment = Alignment(horizontal='center')
                elif header == 'Report date':
                    for cell in tracker_sheet[column_letter][1:]:
                        cell.number_format = 'MM/DD/YYYY'
                        cell.alignment = Alignment(horizontal='center')
                elif header != 'Issue URL':  # Center align all columns except Issue URL
                    for cell in tracker_sheet[column_letter][1:]:
                        cell.alignment = Alignment(horizontal='center')
                
                max_length = _display_len(header)
                for cell in tracker_sheet[column_letter]:
                    try:
                        l = _display_len(cell.value)
                        if l > max_length:
                            max_length = l
                    except:
                        pass
                
                # Standard width calculation for all columns
                adjusted_width = (max_length + 2)
                
                tracker_sheet.column_dimensions[column_letter].width = adjusted_width
            # Apply hyperlink formatting to Vulnerability Tracker sheet
            apply_hyperlink_formatting(tracker_sheet, tracker_df, 'Ticket link', 'Issue URL')
            
            print("  - Formatted tracker sheet.")
            print(f"  - Success: '{TRACKER_SHEET_NAME}' created.")
            # Compute the subset of tracker rows that still need tickets
            try:
                needs_ticket_mask = tracker_source_df['Ticket'].astype(str).str.strip() == ''
                pending_tracker_df = tracker_df[needs_ticket_mask].copy()
                print(f"  - Identified {len(pending_tracker_df)} tracker rows needing tickets for external append.")
            except Exception:
                pending_tracker_df = pd.DataFrame()
        else:
            print("  - Skipped: No non-docker vulnerabilities to add to tracker.")

        print("\n--- Step 7: Saving Final Excel File ---")
        book.save(new_file)
        print(f"  - Success: Saved workbook to '{new_file}'")
        
        # Backup the original tracker file if provided
        tracker_original_path = None
        if tracker_file:
            tracker_base, tracker_ext = os.path.splitext(tracker_file)
            tracker_original_path = f"{tracker_base}-original{tracker_ext}"
            if os.path.exists(tracker_original_path):
                os.remove(tracker_original_path)
            shutil.copy2(tracker_file, tracker_original_path)
            print(f"  - Backed up original tracker to '{tracker_original_path}'")

        # Append missing-ticket rows to the selected external tracker file (if provided)
        if tracker_file and not pending_tracker_df.empty:
            try:
                print("\n--- Step 7b: Appending new items without tickets to external tracker ---")
                book_ext = load_workbook(tracker_file, data_only=False)
                tracker_sheet_name_ext = find_sheet_name(book_ext, TRACKER_DATA_SHEET_NAME) or \
                                         find_sheet_name(book_ext, TRACKER_SHEET_NAME)
                if not tracker_sheet_name_ext:
                    tracker_sheet_name_ext = TRACKER_DATA_SHEET_NAME
                    ws_ext = book_ext.create_sheet(tracker_sheet_name_ext)
                    ws_ext.append(list(tracker_df.columns))
                else:
                    ws_ext = book_ext[tracker_sheet_name_ext]

                # Build existing Issue URL set to avoid duplicates
                headers_ext = [cell.value for cell in ws_ext[1]] if ws_ext.max_row >= 1 else list(tracker_df.columns)
                def _header_idx(headers, name):
                    try:
                        lowered = [str(h).strip().lower() if h is not None else '' for h in headers]
                        return lowered.index(name.strip().lower()) + 1 if name.strip().lower() in lowered else None
                    except Exception:
                        return None
                issue_col_idx_ext = _header_idx(headers_ext, 'Issue URL')
                if issue_col_idx_ext:
                    existing_urls = set()
                    for row_cells in ws_ext.iter_rows(min_row=2, max_row=ws_ext.max_row):
                        cell = row_cells[issue_col_idx_ext - 1]
                        if cell.value:
                            existing_urls.add(str(cell.value).strip().lower())
                else:
                    existing_urls = set()

                # Ensure column order matches external sheet headers
                ordered_cols = headers_ext if set(headers_ext) == set(tracker_df.columns) else list(tracker_df.columns)
                appended = 0
                # Center align and format date columns in external tracker if present
                gp_idx = _header_idx(headers_ext, 'Grace Period')
                if gp_idx:
                    gp_letter = get_column_letter(gp_idx)
                    for cell in ws_ext[gp_letter][1:]:
                        cell.alignment = Alignment(horizontal='center')
                        cell.number_format = 'MM/DD/YYYY'
                rd_idx = _header_idx(headers_ext, 'Report date')
                if rd_idx:
                    rd_letter = get_column_letter(rd_idx)
                    for cell in ws_ext[rd_letter][1:]:
                        cell.alignment = Alignment(horizontal='center')
                        cell.number_format = 'MM/DD/YYYY'
                for _, r in pending_tracker_df.iterrows():
                    issue_url_val = str(r.get('Issue URL', '')).strip().lower()
                    if issue_url_val and issue_url_val in existing_urls:
                        continue
                    # Ensure Report date is set from filename-derived date and convert Issue URL to hyperlink
                    row_vals = []
                    issue_url_hyperlink_data = None
                    for col in ordered_cols:
                        if col == 'Report date':
                            row_vals.append(report_date_dt)
                        elif col == 'Issue URL':
                            hyperlink_data = create_url_hyperlink(r.get(col, ''))
                            if isinstance(hyperlink_data, tuple):
                                issue_url_hyperlink_data = hyperlink_data
                                row_vals.append(hyperlink_data[0])  # Display text
                            else:
                                row_vals.append(hyperlink_data)
                        else:
                            row_vals.append(r.get(col, ''))
                    ws_ext.append(row_vals)
                    # Apply formatting to the just-appended row
                    new_row_idx = ws_ext.max_row
                    # Center all cells in the appended row except Issue URL
                    issue_url_col_idx = _header_idx(ordered_cols, 'Issue URL')

                    # Apply native hyperlink to the Issue URL cell if it's a hyperlink
                    if issue_url_col_idx and issue_url_hyperlink_data:
                        issue_url_cell = ws_ext.cell(row=new_row_idx, column=issue_url_col_idx)
                        display_text, url = issue_url_hyperlink_data
                        issue_url_cell.value = display_text
                        issue_url_cell.hyperlink = url
                        issue_url_cell.font = Font(color="3465a4", underline="single")

                    for c in range(1, len(ordered_cols) + 1):
                        if c != issue_url_col_idx:  # Skip centering Issue URL column
                            ws_ext.cell(row=new_row_idx, column=c).alignment = Alignment(horizontal='center')
                    # Apply date formats to date columns
                    if gp_idx:
                        new_row_idx = ws_ext.max_row
                        gp_cell = ws_ext.cell(row=new_row_idx, column=gp_idx)
                        gp_cell.alignment = Alignment(horizontal='center')
                        gp_cell.number_format = 'MM/DD/YYYY'
                    if rd_idx:
                        new_row_idx = ws_ext.max_row
                        rd_cell = ws_ext.cell(row=new_row_idx, column=rd_idx)
                        rd_cell.alignment = Alignment(horizontal='center')
                        rd_cell.number_format = 'MM/DD/YYYY'
                    appended += 1
                    if issue_url_val:
                        existing_urls.add(issue_url_val)

                book_ext.save(tracker_file)
                book_ext.close()
                print(f"  - Success: Appended {appended} rows to external tracker '{tracker_sheet_name_ext}'.")
                    
            except Exception as e:
                print(f"  - Warning: Could not append to external tracker: {e}")
        
        print("\n--- Step 8: Creating Ticket Template File ---")
        report_filename = f"{base}-Ticket-Template.txt"
        vulnerability_texts = []

        # Only include items that do NOT already have a ticket link
        pending_tickets_df = pd.DataFrame()
        if 'Ticket' in tracker_source_df.columns and not tracker_source_df.empty:
            pending_tickets_df = tracker_source_df[tracker_source_df['Ticket'].astype(str).str.strip() == '']

        if not pending_tickets_df.empty:
            for index, row in pending_tickets_df.iterrows():
                gp_dt = pd.to_datetime(row.get('GRACE PERIOD'), errors='coerce')
                grace_period_str = gp_dt.strftime('%m/%d/%Y') if pd.notna(gp_dt) else 'N/A'
                cve_cwe_text = format_cve_cwe(row)
                
                # Extract clean URL from HYPERLINK formula if present
                issue_url = extract_url_from_hyperlink(row.get('ISSUE_URL', 'N/A'))
                
                text_block = f"""A recent Snyk scan, uncovered a vulnerability within the {row.get('PROJECT_NAME', 'N/A')} GitHub repo, which has now been labelled {row.get('TR SEVERITY', 'N/A')} by the Applied Security Team. The details from their report said the following: 

        - Library: {row.get('PACKAGE_NAME_AND_VERSION', 'N/A')}
        - Grace period: {grace_period_str}
        - CVE / CWE: {cve_cwe_text}
        - Flaw name: {row.get('PROBLEM_TITLE', 'N/A')}
        - More information and how to fix this can be found at: {issue_url}"""
                vulnerability_texts.append(text_block)
        
        if vulnerability_texts:
            with open(report_filename, 'w', encoding='utf-8') as f:
                f.write("\n\n\n".join(vulnerability_texts))
            print(f"  - Success: Saved ticket templates to '{report_filename}'")
            final_message_details = f"Original file renamed to:\n'{original_renamed_path}'\n\n" \
                                    f"Ticket template file created at:\n'{report_filename}'"
            ticket_status_message = ""
        else:
            print("  - Skipped: No vulnerabilities without existing tickets; no template file needed.")
            final_message_details = f"Original file renamed to:\n'{original_renamed_path}'"
            ticket_status_message = "\n\nAll new vulnerabilities already have tickets. No ticket template required."

        # Post-processing: archive input files into a folder
        try:
            # Prefer date parsed from the originally selected NEW report filename
            parsed = extract_report_date_from_filename(selected_new_file_path)
            if parsed:
                ts = parsed.strftime('%Y-%m-%d')
            else:
                timestamp_source = selected_new_file_path if os.path.exists(selected_new_file_path) else (original_renamed_path if original_renamed_path and os.path.exists(original_renamed_path) else new_file)
                ts = datetime.fromtimestamp(os.path.getmtime(timestamp_source)).strftime('%Y-%m-%d')
        except Exception:
            ts = datetime.now().strftime('%Y-%m-%d')
        
        archive_dir = os.path.join(ARCHIVE_DIR, f"Snyk Report - {ts}")
        # Ensure archive folder exists
        try:
            os.makedirs(archive_dir, exist_ok=True)
        except Exception as e:
            print(f"  - Warning: Could not ensure archive folder '{archive_dir}': {e}")

        # Move old report if it exists and is not the tracker
        if old_file and os.path.exists(old_file) and (not tracker_file or os.path.abspath(old_file) != os.path.abspath(tracker_file)):
            dest = os.path.join(archive_dir, os.path.basename(old_file))
            if os.path.abspath(old_file) != os.path.abspath(new_file):
                try:
                    shutil.move(old_file, dest)
                except Exception as e:
                    print(f"  - Warning: Could not archive old report '{old_file}': {e}")

        # Move the original new report that we backed up earlier
        if original_renamed_path and os.path.exists(original_renamed_path):
            # Use the original filename for the archived copy, not the '-original' version
            original_basename = os.path.basename(new_file)
            dest = os.path.join(archive_dir, original_basename)
            if os.path.abspath(original_renamed_path) != os.path.abspath(new_file):
                try:
                    shutil.move(original_renamed_path, dest)
                except Exception as e:
                    print(f"  - Warning: Could not archive original new report '{original_renamed_path}': {e}")
        
        # Move the original tracker backup to the archive folder
        if tracker_original_path and os.path.exists(tracker_original_path):
            # Use the original filename for the archived copy, not the '-original' version
            original_basename = os.path.basename(tracker_file)
            dest = os.path.join(archive_dir, original_basename)
            try:
                shutil.move(tracker_original_path, dest)
                print(f"  - Moved original tracker backup to archive: '{dest}'")
            except Exception as e:
                print(f"  - Warning: Could not archive tracker backup '{tracker_original_path}': {e}")

        # Calculate detailed vulnerability statistics
        total_new = len(new_items_df)
        docker_count = 0
        non_docker_count = 0
        critical_docker_count = 0
        critical_non_docker_count = 0
        
        if 'PROJECT_NAME' in new_items_df.columns and not new_items_df.empty:
            docker_mask = new_items_df['PROJECT_NAME'].str.contains('docker', case=False, na=False)
            docker_count = docker_mask.sum()
            non_docker_count = total_new - docker_count
            
            # Calculate critical vulnerability breakdown
            if 'TR SEVERITY' in new_items_df.columns:
                critical_mask = new_items_df['TR SEVERITY'] == 'Critical'
                critical_docker_count = (docker_mask & critical_mask).sum()
                critical_non_docker_count = critical_count - critical_docker_count
        else:
            non_docker_count = total_new
            critical_non_docker_count = critical_count
        
        print("\n" + Fore.GREEN + "="*60)
        print("     PROCESS COMPLETE!")
        print("="*60 + Style.RESET_ALL)
        
        # Enhanced vulnerability summary
        colored_print(f"\nVulnerability Summary:", Fore.YELLOW)
        safe_print(f"  • Total new vulnerabilities: {total_new}")
        
        if critical_count > 0:
            if docker_count > 0 and critical_docker_count > 0:
                print_critical_line(f"  • Critical vulnerabilities: {critical_count} ({critical_non_docker_count} non-Docker, {critical_docker_count} Docker)")
            else:
                print_critical_line(f"  • Critical vulnerabilities: {critical_count}")
        
        if docker_count > 0:
            safe_print(f"  • Docker-related (hidden): {docker_count}")
        safe_print(f"  • Non-Docker (visible in Working sheet): {non_docker_count}")
        
        print(f"\nResults written to: {new_file}")
        print(f"\n{final_message_details}")
        print(f"\nArchived input files to folder: {archive_dir}")
        if ticket_status_message:
            print(ticket_status_message)

    except Exception as e:
        print(f"\n[-] An Error Occurred: An unexpected error occurred:\n{e}")
        import traceback
        traceback.print_exc()
        if original_renamed_path and os.path.exists(original_renamed_path):
            if os.path.exists(new_file):
                os.remove(new_file)
            os.rename(original_renamed_path, new_file)
            print(f"\n--- ERROR: Script failed. Original file '{new_file}' has been restored. ---")


def main():
    """GUI setup and file selection."""
    root = Tk()
    root.withdraw()
    warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')
    setup_directories()

    # --- Automatic File Discovery ---
    colored_print("-> Searching for the latest Snyk report files in the script's directory...", Fore.CYAN)
    old_file, new_file = find_snyk_reports(WORKING_DIR, identifier="snyk")

    if not new_file:
        print("\n[-] Error: Could not find any Snyk report files in the script's folder. Please make sure they are present and contain a date (YYYY-MM-DD).")
        return

    # The find_snyk_reports function sorts by date descending, ensuring the newest is 'new_file'
    print(f"  - Using NEW report (most recent): {os.path.basename(new_file)}")
    if old_file:
        print(f"  - Using OLD report (previous): {os.path.basename(old_file)}")
    else:
        print("  - No older report found. Running in initial mode.")

    colored_print("\n-> Searching for the Vulnerability Tracker file...", Fore.CYAN)
    tracker_file = find_latest_tracker_file(WORKING_DIR, identifier="tracker")

    if tracker_file:
        print(f"  - Using Tracker file: {os.path.basename(tracker_file)}")
    else:
        print("  - No tracker file found. Proceeding without cross-referencing.")
        
    process_reports(old_file, new_file, tracker_file)

if __name__ == '__main__':
    main()
