#[allow(non_snake_case)]
#[tauri::command]
pub async fn read_documentation_file(
    doc_path: Option<String>,
    docPath: Option<String>,
    args: Option<serde_json::Value>,
    app_handle: tauri::AppHandle
) -> Result<String, String> {
    use std::fs;
    use std::path::PathBuf;

    // Resolve argument: doc_path or docPath or inside args
    let doc = doc_path
        .or(docPath)
        .or_else(|| args.as_ref().and_then(|a| a.get("doc_path").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .or_else(|| args.as_ref().and_then(|a| a.get("docPath").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .ok_or_else(|| "missing 'doc_path'".to_string())?;

    // Prefer workspace Documents if exists, else resource dir, else resolve_resource mapping
    let mut bases: Vec<PathBuf> = Vec::new();
    // Workspace relative paths
    bases.push(PathBuf::from("Documents").join("Main"));
    bases.push(PathBuf::from("Documents").join("Snyk Report Compare"));
    bases.push(PathBuf::from("Documents").join("DataDome Verified Bots Compare"));
    // Derive App Way root from executable path in dev: .../src-tauri/target/<profile>/ -> up 3 levels
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            if let Some(app_way) = exe_dir.parent().and_then(|p| p.parent()).and_then(|p| p.parent()) {
                bases.push(app_way.join("Documents").join("Main"));
                bases.push(app_way.join("Documents").join("Snyk Report Compare"));
                bases.push(app_way.join("Documents").join("DataDome Verified Bots Compare"));
            }
        }
    }
    // Tauri resource dir
    if let Some(res_dir) = app_handle.path_resolver().resource_dir() {
        bases.push(res_dir.join("Documents").join("Main"));
        bases.push(res_dir.join("Documents").join("Snyk Report Compare"));
        bases.push(res_dir.join("Documents").join("DataDome Verified Bots Compare"));
    }
    // Logical resource mapping
    if let Some(resolved) = app_handle.path_resolver().resolve_resource("Documents/Main") {
        bases.push(resolved);
    }
    if let Some(resolved) = app_handle.path_resolver().resolve_resource("Documents/Snyk Report Compare") {
        bases.push(resolved);
    }
    if let Some(resolved) = app_handle.path_resolver().resolve_resource("Documents/DataDome Verified Bots Compare") {
        bases.push(resolved);
    }

    // Try each base
    let mut last_tried: Option<PathBuf> = None;
    for base in bases {
        let file_path = base.join(&doc);
        last_tried = Some(file_path.clone());
        println!("[DEBUG] Trying to read doc file: {}", file_path.display());
        if file_path.exists() {
            match fs::read_to_string(&file_path) {
                Ok(content) => return Ok(content),
                Err(e) => return Err(format!("Failed to read documentation: {} (tried: {})", e, file_path.display())),
            }
        }
    }
    Err(format!("Documentation file not found (tried: {})", last_tried.map(|p| p.display().to_string()).unwrap_or_else(|| "<none>".to_string())))
}
