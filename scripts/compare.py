import pandas as pd

# --- Step 1: Compare newFile with oldFile and update Ticket column ---

old_file = "oldFile.xlsx"
new_file = "newFile.xlsx"
sheet_name = "Working sheet"

old_df = pd.read_excel(old_file, sheet_name=sheet_name)
new_df = pd.read_excel(new_file, sheet_name=sheet_name)

# Clean up ISSUE_URL columns for reliable matching
old_df['ISSUE_URL'] = old_df['ISSUE_URL'].astype(str).str.strip().str.lower()
new_df['ISSUE_URL'] = new_df['ISSUE_URL'].astype(str).str.strip().str.lower()

# Create a lookup for ISSUE_URL -> Ticket in old file
old_lookup = dict(zip(old_df['ISSUE_URL'], old_df['Ticket']))

# Update Ticket column in new_df
def process_row(row):
    unique_id = row['ISSUE_URL']
    if unique_id in old_lookup:
        return old_lookup[unique_id]
    return 'new'

new_df['Ticket'] = new_df.apply(process_row, axis=1)

# Handle docker-image case (matches 'docker-image' and anything starting with it)
docker_mask = (new_df['Ticket'] == 'new') & (new_df['PROJECT_TARGET_REFERENCE'].str.startswith('docker-image'))
new_df.loc[docker_mask, 'Ticket'] = 'ignore-docker-image'

# Save intermediate result
new_df.to_excel("newFile_modified.xlsx", index=False)

# --- Step 2: Compare newFile_modified.xlsx with referenceFile and update Ticket column if match found ---

reference_file = "newFile_modified.xlsx"
newFile_modified_sheet = "Sheet1"
reference_file = "referenceFile.xlsx"
reference_sheet = "Tickets"

mod_df = pd.read_excel("newFile_modified.xlsx", sheet_name=newFile_modified_sheet)
ref_df = pd.read_excel(reference_file, sheet_name=reference_sheet)

mod_df['ISSUE_URL'] = mod_df['ISSUE_URL'].astype(str).str.strip().str.lower()
ref_df['Issue URL'] = ref_df['Issue URL'].astype(str).str.strip().str.lower()

ref_lookup = dict(zip(ref_df['Issue URL'], ref_df['Ticket link']))

def copy_ticket(row):
    issue_url = row['ISSUE_URL']
    if issue_url in ref_lookup:
        return ref_lookup[issue_url]
    return row.get('Ticket', '')  # Keep existing value if no match

mod_df['Ticket'] = mod_df.apply(copy_ticket, axis=1)

# Save final result
mod_df.to_excel("newFile_with_ticket_links.xlsx", index=False)

# --- Step 3: Extract template data for rows where Ticket == "new" and write to txt ---

template_rows = mod_df[mod_df['Ticket'] == 'new']

with open("snyk_report.txt", "w", encoding="utf-8") as f:
    for _, row in template_rows.iterrows():
        txt = (
            f"A recent Snyk scan, uncovered a vulnerability within the {row['PROJECT_NAME']} GitHub repo, "
            f"which has now been labelled {row['TR SEVERITY']} by the Applied Security Team. "
            "The details from their report said the following:\n\n"
            f"    - Library: {row['PACKAGE_NAME_AND_VERSION']}\n"
            f"    - Grace period: {row['GRACE PERIOD']}\n"
            f"    - {row['CVE']}/{row['CWE']}\n"
            f"    - Flaw name: {row['PROBLEM_TITLE']}\n"
            f"    - More information and how to fix this can be found at: {row['ISSUE_URL']}\n\n"
        )
        f.write(txt)


# --- Step 4: Add 'Tracker template' sheet to newFile_with_ticket_links.xlsx ---

# 1. Read the template columns from oldFile.xlsx
tracker_template_df = pd.read_excel(old_file, sheet_name='Tracker template')
template_columns = tracker_template_df.columns.tolist()

# 2. Read the final output file and filter rows where Ticket == 'new'
final_df = pd.read_excel("newFile_with_ticket_links.xlsx", sheet_name=0)
new_rows = final_df[final_df['Ticket'] == 'new']

# 3. Prepare the data for the template sheet
tracker_data = pd.DataFrame(columns=template_columns)
if not new_rows.empty:
    tracker_data['Grace Period'] = new_rows['GRACE PERIOD']
    tracker_data['GitHub Repository'] = new_rows['PROJECT_NAME']
    tracker_data['Library affected'] = new_rows['PACKAGE_NAME_AND_VERSION']
    tracker_data['CVE/CWE'] = new_rows['CVE'].astype(str) + '/' + new_rows['CWE'].astype(str)
    tracker_data['Issue URL'] = new_rows['ISSUE_URL']
    # The following columns are left empty for manual fill:
    # 'Report date', 'Ticket created on', 'Ticket link', 'Notes', 'Current Status', 'Team'

# 4. Write the new sheet to the existing Excel file
with pd.ExcelWriter("newFile_with_ticket_links.xlsx", mode='a', engine='openpyxl', if_sheet_exists='replace') as writer:
    tracker_data.to_excel(writer, sheet_name='Tracker template', index=False)

print("All steps completed. Output files: newFile_modified.xlsx, newFile_with_ticket_links.xlsx, snyk_report.txt (with Tracker template sheet added)")