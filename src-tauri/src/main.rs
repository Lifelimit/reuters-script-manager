// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::path::{Path, PathBuf};
use std::fs;
mod read_doc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::api::dialog::blocking::FileDialogBuilder;
use tauri::{AppHandle, Manager};
use regex::Regex;
use std::sync::Mutex;
use notify::{RecommendedWatcher, RecursiveMode, Watcher, Config};
use std::path::PathBuf as StdPathBuf;

#[derive(Default)]
struct FileWatchState {
    watcher: Option<RecommendedWatcher>,
    watched: Option<StdPathBuf>,
}

/// Resolve a base directory intended to hold user-visible data folders
/// next to the launcher. On macOS, this resolves to the folder containing
/// the .app bundle; on other platforms, it resolves to the executable's
/// directory. Falls back to current_dir if resolution fails.
fn launcher_visible_base_dir() -> PathBuf {
    let exe = std::env::current_exe().unwrap_or_else(|_| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    let mut base = exe.parent().map(|p| p.to_path_buf()).unwrap_or_else(|| PathBuf::from("."));
    // Detect macOS app bundle structure: <App>.app/Contents/MacOS/<bin>
    // If so, move up to the directory that contains the .app bundle
    if base.ends_with("MacOS") {
        if let Some(contents) = base.parent() { // Contents
            if let Some(app_bundle) = contents.parent() { // <App>.app
                if let Some(parent_of_app) = app_bundle.parent() {
                    base = parent_of_app.to_path_buf();
                }
            }
        }
        return base;
    }

    // Development executable lives under: <workspace>/src-tauri/target/{debug|release}
    // For a better user experience, place visible data folders at the workspace root
    // rather than inside the target directory.
    // If the path matches that layout, step up to the workspace root.
    let is_cargo_target = base.ends_with("debug") || base.ends_with("release");
    if is_cargo_target {
        if let Some(target_dir) = base.parent() { // .../src-tauri/target
            if let Some(src_tauri_dir) = target_dir.parent() { // .../src-tauri
                if let Some(workspace_root) = src_tauri_dir.parent() { // .../<workspace>
                    return workspace_root.to_path_buf();
                }
            }
        }
    }

    // Fallback: use the executable directory
    base
}

/// Ensure the two visible data directories exist next to the launcher.
/// Returns (snyk_dir, datadome_dir)
fn ensure_visible_data_dirs() -> (PathBuf, PathBuf) {
    let base = launcher_visible_base_dir();
    let snyk = base.join("Snyk Report Compare");
    let datadome = base.join("DataDome Verified Bots Compare");
    let _ = std::fs::create_dir_all(&snyk);
    let _ = std::fs::create_dir_all(&datadome);
    (snyk, datadome)
}

// Start watching a directory and emit "files-changed" on any fs event
#[allow(non_snake_case)]
#[tauri::command]
async fn start_file_watch(
    app_handle: AppHandle,
    state: tauri::State<'_, Mutex<FileWatchState>>,
    dir: Option<String>,
    dirPath: Option<String>,
    directory: Option<String>,
    args: Option<serde_json::Value>,
) -> Result<String, String> {
    let target = dir
        .or(dirPath)
        .or(directory)
        .or_else(|| args.as_ref().and_then(|a| a.get("dir").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .or_else(|| args.as_ref().and_then(|a| a.get("dirPath").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .or_else(|| args.as_ref().and_then(|a| a.get("directory").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .ok_or_else(|| "missing directory path".to_string())?;

    let path = StdPathBuf::from(&target);
    if !path.exists() {
        return Err(format!("watch path does not exist: {}", path.to_string_lossy()));
    }

    let mut guard = state.lock().map_err(|_| "watcher state poisoned".to_string())?;

    // If already watching a different path, unwatch (avoid borrow conflicts by cloning)
    let watched_clone = guard.watched.clone();
    if let (Some(watcher), Some(prev)) = (&mut guard.watcher, watched_clone.as_ref()) {
        if prev != &path {
            let _ = watcher.unwatch(prev);
        }
    }

    // Create watcher if missing
    if guard.watcher.is_none() {
        let handle = app_handle.clone();
        let watcher = RecommendedWatcher::new(
            move |res: notify::Result<notify::Event>| {
                match res {
                    Ok(event) => {
                        let paths: Vec<String> = event
                            .paths
                            .iter()
                            .map(|p| p.to_string_lossy().to_string())
                            .collect();
                        let kind = format!("{:?}", event.kind);
                        let _ = handle.emit_all(
                            "files-changed",
                            json!({ "paths": paths, "kind": kind }),
                        );
                    }
                    Err(e) => {
                        let _ = handle.emit_all(
                            "files-changed",
                            json!({ "error": e.to_string() }),
                        );
                    }
                }
            },
            Config::default(),
        )
        .map_err(|e| e.to_string())?;
        guard.watcher = Some(watcher);
    }

    // watch target non-recursively
    if let Some(watcher) = guard.watcher.as_mut() {
        watcher
            .watch(&path, RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;
        guard.watched = Some(path.clone());
    }

    Ok(format!("watching {}", path.to_string_lossy()))
}

#[tauri::command]
async fn stop_file_watch(state: tauri::State<'_, Mutex<FileWatchState>>) -> Result<String, String> {
    let mut guard = state.lock().map_err(|_| "watcher state poisoned".to_string())?;
    let watched_clone = guard.watched.clone();
    if let (Some(watcher), Some(prev)) = (&mut guard.watcher, watched_clone.as_ref()) {
        let _ = watcher.unwatch(prev);
    }
    guard.watched = None;
    Ok("stopped".to_string())
}

// Reveal a file or directory in the OS file manager
#[tauri::command]
async fn reveal_path(path: String) -> Result<String, String> {
    let p = PathBuf::from(&path);
    // If the path doesn't exist, fall back to its parent directory (if any)
    let (target, used_parent): (PathBuf, bool) = if p.exists() {
        (p.clone(), false)
    } else {
        match p.parent() {
            Some(parent) if parent.exists() => (parent.to_path_buf(), true),
            _ => return Err(format!("Path does not exist: {}", p.to_string_lossy())),
        }
    };
    let is_dir = target.is_dir();
    let success_msg = if used_parent { "opened_parent".to_string() } else { "ok".to_string() };
    #[cfg(target_os = "macos")]
    {
        let mut cmd = std::process::Command::new("open");
        if is_dir {
            cmd.arg(&target);
        } else {
            // Reveal file in Finder
            cmd.args(["-R", &target.to_string_lossy()]);
        }
        cmd.status().map_err(|e| e.to_string()).and_then(|s| if s.success() { Ok(success_msg) } else { Err(format!("open exited with status {:?}", s.code())) })
    }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        let mut cmd = std::process::Command::new("explorer");
        if is_dir {
            cmd.arg(target);
        } else {
            cmd.args(["/select,", &target.to_string_lossy()]);
        }
        // CREATE_NO_WINDOW
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.status().map_err(|e| e.to_string()).and_then(|s| if s.success() { Ok(success_msg) } else { Err(format!("explorer exited with status {:?}", s.code())) })
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let mut cmd = std::process::Command::new("xdg-open");
        cmd.arg(&target);
        cmd.status().map_err(|e| e.to_string()).and_then(|s| if s.success() { Ok(success_msg) } else { Err(format!("xdg-open exited with status {:?}", s.code())) })
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct DepStatus {
    name: String,
    requirement: Option<String>,
    installed: bool,
    version: Option<String>,
    error: Option<String>,
}

// Simple helper to check whether a path exists (used by frontend to enable/disable buttons reliably)
#[tauri::command]
async fn path_exists(path: String) -> Result<bool, String> {
    let p = PathBuf::from(path);
    Ok(p.exists())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct FileStatus {
    name: String,
    exists: bool,
    resolved_path: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct RequiredFileInfo {
    name: String,
    path: String,
}

fn default_packages() -> Vec<String> {
    vec![
        "pandas>=2.0.0".to_string(),
        "openpyxl>=3.1.0".to_string(),
        "colorama>=0.4.6".to_string(),
    ]
}

fn parse_requirements(contents: &str) -> Vec<String> {
    let mut pkgs = Vec::new();
    for line in contents.lines() {
        let l = line.trim();
        if l.is_empty() || l.starts_with('#') { continue; }
        pkgs.push(l.to_string());
    }
    pkgs
}

fn read_requirements(app_handle: &AppHandle) -> Option<Vec<String>> {
    // Prefer workspace file first
    let workspace_path = PathBuf::from("Documents").join("Main").join("requirements.txt");
    if workspace_path.exists() {
        if let Ok(contents) = std::fs::read_to_string(&workspace_path) {
            let pkgs = parse_requirements(&contents);
            if !pkgs.is_empty() { return Some(pkgs); }
        }
    }
    // Try resource dir (bundled file)
    if let Some(res_dir) = app_handle.path_resolver().resource_dir() {
        let res_path = res_dir.join("Documents").join("Main").join("requirements.txt");
        if res_path.exists() {
            if let Ok(contents) = std::fs::read_to_string(&res_path) {
                let pkgs = parse_requirements(&contents);
                if !pkgs.is_empty() { return Some(pkgs); }
            }
        }
    }
    // Try logical resource resolution
    if let Some(resolved) = app_handle.path_resolver().resolve_resource("Documents/Main/requirements.txt") {
        if let Ok(contents) = std::fs::read_to_string(&resolved) {
            let pkgs = parse_requirements(&contents);
            if !pkgs.is_empty() { return Some(pkgs); }
        }
    }
    None
}

fn home_venv_path() -> PathBuf {
    let home = dirs_next::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".reuters-script-manager").join(".venv")
}

fn venv_python_path(venv_dir: &Path) -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        venv_dir.join("Scripts").join("python.exe")
    }
    #[cfg(not(target_os = "windows"))]
    {
        let cand = venv_dir.join("bin");
        let py3 = cand.join("python3");
        if py3.exists() { py3 } else { cand.join("python") }
    }
}

fn ensure_venv() -> Result<PathBuf, String> {
    let venv_dir = home_venv_path();
    if !venv_dir.exists() {
        if let Some(parent) = venv_dir.parent() { fs::create_dir_all(parent).map_err(|e| e.to_string())?; }
        let venv_str = venv_dir.to_string_lossy().to_string();
        let (prog, args): (&str, Vec<String>) = if cfg!(target_os = "windows") {
            ("python", vec!["-m".into(), "venv".into(), venv_str.clone()])
        } else {
            ("python3", vec!["-m".into(), "venv".into(), venv_str.clone()])
        };
        let status = Command::new(prog)
            .args(args)
            .spawn()
            .map_err(|e| format!("Failed to create venv: {}", e))?
            .wait()
            .map_err(|e| format!("Failed to wait venv creation: {}", e))?;
        if !status.success() {
            return Err(format!("Venv creation failed with status: {}", status));
        }
    }
    Ok(venv_dir)
}

fn install_packages(venv_dir: &Path, packages: &[String]) -> Result<String, String> {
    let py = venv_python_path(venv_dir);
    // Upgrade pip first (best-effort)
    let _ = Command::new(&py)
        .args(["-m", "pip", "install", "--upgrade", "pip"]) 
        .spawn()
        .map_err(|e| format!("Failed to run pip upgrade: {}", e))?
        .wait();

    let mut output_summary = String::new();
    if !packages.is_empty() {
        let mut cmd = Command::new(&py);
        cmd.arg("-m").arg("pip").arg("install");
        for p in packages { cmd.arg(p); }
        let status = cmd.spawn()
            .map_err(|e| format!("Failed to spawn pip install: {}", e))?
            .wait()
            .map_err(|e| format!("pip install wait failed: {}", e))?;
        output_summary = format!("pip install exited with status: {}", status);
    }
    Ok(output_summary)
}

fn check_packages(venv_dir: &Path, packages: &[String]) -> Result<Vec<DepStatus>, String> {
    let py = venv_python_path(venv_dir);
    let script = r#"
import importlib, json
result = []
packages = __PACKAGES__
for spec in packages:
    name = spec.split('==')[0].split('>=')[0].strip()
    info = { 'name': name, 'requirement': spec, 'installed': False, 'version': None, 'error': None }
    try:
        m = importlib.import_module(name)
        ver = getattr(m, '__version__', None)
        info['installed'] = True
        info['version'] = ver
    except Exception as e:
        info['installed'] = False
        info['error'] = str(e)
    result.append(info)
print(json.dumps(result))
"#;
    let packages_json = serde_json::to_string(packages).map_err(|e| e.to_string())?;
    let code = script.replace("__PACKAGES__", &packages_json);
    let out = Command::new(&py)
        .arg("-c")
        .arg(code)
        .output()
        .map_err(|e| format!("Failed to run check script: {}", e))?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).to_string());
    }
    let txt = String::from_utf8_lossy(&out.stdout).to_string();
    let statuses: Vec<DepStatus> = serde_json::from_str(&txt).map_err(|e| format!("Parse error: {} | output: {}", e, txt))?;
    Ok(statuses)
}

// Check whether required files exist, resolving relative to a provided base directory and other sensible locations
// Accept flexible args: base_dir/baseDir and files at top-level or within an args object
#[allow(non_snake_case)]
#[tauri::command]
async fn check_required_files(
    app_handle: AppHandle,
    base_dir: Option<String>,
    baseDir: Option<String>,
    files: Option<Vec<String>>, 
    args: Option<serde_json::Value>,
) -> Result<String, String> {
    let mut results: Vec<FileStatus> = Vec::new();
    // Resolve arguments
    let base_dir = base_dir
        .or(baseDir)
        .or_else(|| args.as_ref().and_then(|a| a.get("base_dir").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .or_else(|| args.as_ref().and_then(|a| a.get("baseDir").and_then(|v| v.as_str()).map(|s| s.to_string())));
    let files: Vec<String> = if let Some(fs) = files {
        fs
    } else if let Some(a) = &args {
        if let Some(arr) = a.get("files").and_then(|v| v.as_array()) {
            arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()
        } else { Vec::new() }
    } else { Vec::new() };

    let base = base_dir.clone().map(PathBuf::from);
    let cwd = std::env::current_dir().ok();

    // Potential resource locations
    let res_dir = app_handle.path_resolver().resource_dir();

    for f in files {
        let mut resolved: Option<PathBuf> = None;
        let p = PathBuf::from(&f);
        if p.is_absolute() {
            resolved = Some(p.clone());
        } else {
            if let Some(ref b) = base { let cand = b.join(&f); if cand.exists() { resolved = Some(cand); } }
            if resolved.is_none() {
                if let Some(ref c) = cwd { let cand = c.join(&f); if cand.exists() { resolved = Some(cand); } }
            }
            if resolved.is_none() {
                if let Some(ref r) = res_dir { let cand = r.join(&f); if cand.exists() { resolved = Some(cand); } }
            }
            // Also try resolve_resource logical mapping
            if resolved.is_none() {
                if let Some(rr) = app_handle.path_resolver().resolve_resource(&f) { if rr.exists() { resolved = Some(rr); } }
            }
        }

        let exists = if let Some(ref rp) = resolved { rp.exists() } else { p.exists() };
        results.push(FileStatus {
            name: f.clone(),
            exists,
            resolved_path: resolved.map(|x| x.to_string_lossy().to_string()),
        });
    }

    Ok(serde_json::to_string(&results).map_err(|e| e.to_string())?)
}

fn find_latest_by_date_in_name(dir: &Path, ident: &str) -> Option<PathBuf> {
    // Matches YYYY-MM-DD with - or _ as separators
    let re = Regex::new(r"(20\d{2})[-_](\d{2})[-_](\d{2})").ok()?;
    let mut best: Option<(i32, i32, i32, PathBuf)> = None;
    if let Ok(rd) = std::fs::read_dir(dir) {
        for e in rd.flatten() {
            let p = e.path();
            let name = match p.file_name().and_then(|s| s.to_str()) { Some(s) => s, None => continue };
            if !name.to_lowercase().contains(&ident.to_lowercase()) { continue; }
            if !name.ends_with(".xlsx") || name.starts_with('~') { continue; }
            if let Some(caps) = re.captures(name) {
                if let (Ok(y), Ok(m), Ok(d)) = (caps[1].parse::<i32>(), caps[2].parse::<i32>(), caps[3].parse::<i32>()) {
                    let tuple = (y, m, d, p.clone());
                    if best.as_ref().map(|b| (y, m, d) > (b.0, b.1, b.2)).unwrap_or(true) {
                        best = Some(tuple);
                    }
                }
            }
        }
    }
    best.map(|t| t.3)
}

fn find_latest_by_mtime(dir: &Path, ident: &str) -> Option<PathBuf> {
    let mut best: Option<(std::time::SystemTime, PathBuf)> = None;
    if let Ok(rd) = std::fs::read_dir(dir) {
        for e in rd.flatten() {
            let p = e.path();
            let name = match p.file_name().and_then(|s| s.to_str()) { Some(s) => s, None => continue };
            if !name.to_lowercase().contains(&ident.to_lowercase()) { continue; }
            if !name.ends_with(".xlsx") || name.starts_with('~') { continue; }
            if let Ok(md) = p.metadata() {
                if let Ok(modt) = md.modified() {
                    if best.as_ref().map(|b| modt > b.0).unwrap_or(true) {
                        best = Some((modt, p.clone()));
                    }
                }
            }
        }
    }
    best.map(|t| t.1)
}

// Analyze a script to infer required files, mirroring logic in script_launcher2.py
// Accept flexible args for robustness across frontend callers
#[allow(non_snake_case)]
#[tauri::command]
async fn analyze_required_files(
    app_handle: AppHandle,
    script_path: Option<String>,
    scriptPath: Option<String>,
    working_dir: Option<String>,
    workingDir: Option<String>,
    args: Option<serde_json::Value>,
) -> Result<String, String> {
    // Arg resolution
    let script_path = script_path
        .or(scriptPath)
        .or_else(|| args.as_ref().and_then(|a| a.get("script_path").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .or_else(|| args.as_ref().and_then(|a| a.get("scriptPath").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .ok_or_else(|| "missing 'script_path'".to_string())?;
    let working_dir = working_dir
        .or(workingDir)
        .or_else(|| args.as_ref().and_then(|a| a.get("working_dir").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .or_else(|| args.as_ref().and_then(|a| a.get("workingDir").and_then(|v| v.as_str()).map(|s| s.to_string())));
    let (sp, _tried) = resolve_script_absolute_path(&app_handle, &script_path);
    // Prefer provided working_dir, else derive like read_script_metadata
    let mut wd = working_dir.map(PathBuf::from).unwrap_or_else(|| sp.parent().unwrap_or_else(|| Path::new(".")).to_path_buf());
    if let Some(fname) = sp.file_name().and_then(|s| s.to_str()) {
        use std::fs::read_dir;
        let script_dir = sp.parent().unwrap_or_else(|| Path::new(".")).to_path_buf();
        let app_way = script_dir.parent().unwrap_or(Path::new(".")).to_path_buf();
        let workspace_root = app_way.parent().unwrap_or(Path::new(".")).to_path_buf();
        let has_xlsx = |dir: &std::path::Path| read_dir(dir).map(|rd| rd.flatten().any(|e| {
            let n = e.file_name(); let s = n.to_string_lossy();
            s.ends_with(".xlsx") && !s.starts_with('~') && !s.starts_with('.') && !s.starts_with("._")
        })).unwrap_or(false);

        // Prefer portable layout: folders next to the launcher (dev: workspace root)
        let (snyk_portable, datadome_portable) = ensure_visible_data_dirs();

        if fname.to_lowercase().contains("snyk_compare.py") {
            let app_cand = app_way.join("Snyk Report Compare");
            let script_cand = workspace_root.join("Script Way").join("Snyk Report Compare");
            if has_xlsx(&snyk_portable) { wd = snyk_portable; }
            else if has_xlsx(&app_cand) { wd = app_cand; }
            else if has_xlsx(&script_cand) { wd = script_cand; }
            else if snyk_portable.exists() { wd = snyk_portable; }
            else if app_cand.exists() { wd = app_cand; }
            else if script_cand.exists() { wd = script_cand; }
        } else if fname.to_lowercase().contains("datadome_compare.py") {
            let app_cand = app_way.join("DataDome Verified Bots Compare");
            let script_cand = workspace_root.join("Script Way").join("DataDome Verified Bots Compare");
            if has_xlsx(&datadome_portable) { wd = datadome_portable; }
            else if has_xlsx(&app_cand) { wd = app_cand; }
            else if has_xlsx(&script_cand) { wd = script_cand; }
            else if datadome_portable.exists() { wd = datadome_portable; }
            else if app_cand.exists() { wd = app_cand; }
            else if script_cand.exists() { wd = script_cand; }
        }
    }

    let mut required: Vec<RequiredFileInfo> = Vec::new();

    let lower_name = sp.file_name().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
    if lower_name.contains("datadome_compare.py") {
        // DataDome: Block or Whitelist (by mtime), AI agents (by date), Verified bots (by date)
        let block = find_latest_by_mtime(&wd, "Block or Whitelist");
        let ai_agents = find_latest_by_date_in_name(&wd, "DataDome_Export_AI_agents");
        let verified = find_latest_by_date_in_name(&wd, "DataDome_Export_verified_bots");

        let reqs = vec![
            ("DataDome Bots - Block or Whitelist.xlsx", block),
            ("DataDome_Export_AI_agents_YYYY-MM-DD.xlsx", ai_agents),
            ("DataDome_Export_verified_bots_YYYY-MM-DD.xlsx", verified),
        ];
        for (label, found) in reqs {
            if let Some(p) = found {
                let name = p.file_name().and_then(|s| s.to_str()).unwrap_or(label).to_string();
                required.push(RequiredFileInfo { name, path: p.to_string_lossy().to_string() });
            } else {
                // missing placeholder path
                let miss = wd.join(format!("missing_{}", label));
                required.push(RequiredFileInfo { name: label.to_string(), path: miss.to_string_lossy().to_string() });
            }
        }
    } else if lower_name.contains("snyk_compare.py") {
        // Snyk: two latest reports with 'snyk' and date OR 'report' and 'snyk' (exclude tracker) + latest tracker
        let mut reports: Vec<PathBuf> = Vec::new();
        let mut trackers: Vec<PathBuf> = Vec::new();
        let date_re = Regex::new(r"\d{4}-\d{2}-\d{2}").map_err(|e| e.to_string())?;
        if let Ok(rd) = std::fs::read_dir(&wd) {
            for e in rd.flatten() {
                let p = e.path();
                let name = match p.file_name().and_then(|s| s.to_str()) { Some(s) => s.to_string(), None => continue };
                let lname = name.to_lowercase();
                if !name.ends_with(".xlsx") || name.starts_with('~') || name.starts_with('.') || name.starts_with("._") { continue; }
                if lname.contains("tracker") {
                    trackers.push(p.clone());
                    continue;
                }
                if lname.contains("snyk") && date_re.is_match(&name) {
                    reports.push(p.clone());
                    continue;
                }
                if lname.contains("report") && lname.contains("snyk") && !lname.contains("tracker") {
                    reports.push(p.clone());
                    continue;
                }
            }
        }
        // sort by mtime desc
        reports.sort_by_key(|p| p.metadata().and_then(|m| m.modified()).ok());
        reports.reverse();
        trackers.sort_by_key(|p| p.metadata().and_then(|m| m.modified()).ok());
        trackers.reverse();

        if reports.len() >= 2 {
            for i in 0..2 { 
                let p = &reports[i];
                let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
                required.push(RequiredFileInfo { name, path: p.to_string_lossy().to_string() });
            }
        } else if reports.len() == 1 {
            let p = &reports[0];
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
            required.push(RequiredFileInfo { name, path: p.to_string_lossy().to_string() });
            let miss = wd.join("missing_second_snyk_report.xlsx");
            required.push(RequiredFileInfo { name: "Second report is missing".to_string(), path: miss.to_string_lossy().to_string() });
        } else {
            required.push(RequiredFileInfo { name: "First Snyk report required".to_string(), path: wd.join("missing_first_snyk_report.xlsx").to_string_lossy().to_string() });
            required.push(RequiredFileInfo { name: "Second Snyk report required".to_string(), path: wd.join("missing_second_snyk_report.xlsx").to_string_lossy().to_string() });
        }

        if let Some(p) = trackers.get(0) {
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
            required.push(RequiredFileInfo { name, path: p.to_string_lossy().to_string() });
        } else {
            required.push(RequiredFileInfo { name: "Vulnerability Tracker.xlsx required".to_string(), path: wd.join("missing_tracker.xlsx").to_string_lossy().to_string() });
        }

        // Sort by name for consistency
        required.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    } else {
        // Generic: look for any .xlsx files with hints in name (snyk, tracker, block+whitelist, ai_agents, verified_bots)
        let hints = [
            ("snyk", None),
            ("tracker", None),
            ("block", Some("whitelist")),
            ("ai_agents", None),
            ("verified_bots", None),
        ];
        let mut seen: Vec<PathBuf> = Vec::new();
        if let Ok(rd) = std::fs::read_dir(&wd) {
            for e in rd.flatten() {
                let p = e.path();
                let name = match p.file_name().and_then(|s| s.to_str()) { Some(s) => s.to_string(), None => continue };
                let lname = name.to_lowercase();
                if !name.ends_with(".xlsx") || name.starts_with('~') || name.starts_with('.') || name.starts_with("._") { continue; }
                for (h1, h2) in hints.iter() {
                    if lname.contains(h1) && (h2.is_none() || lname.contains(h2.unwrap())) {
                        seen.push(p.clone());
                        break;
                    }
                }
            }
        }
        seen.sort_by_key(|p| p.metadata().and_then(|m| m.modified()).ok());
        seen.reverse();
        for p in seen {
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
            required.push(RequiredFileInfo { name, path: p.to_string_lossy().to_string() });
        }
    }

    serde_json::to_string(&required).map_err(|e| e.to_string())
}

// Command to create venv (if absent) and install packages
#[tauri::command]
async fn setup_python_env(app_handle: AppHandle, packages: Option<Vec<String>>) -> Result<String, String> {
    let pkgs = packages.or_else(|| read_requirements(&app_handle)).unwrap_or_else(default_packages);
    let venv = ensure_venv()?;
    let summary = install_packages(&venv, &pkgs)?;
    Ok(serde_json::json!({
        "venv_path": venv.to_string_lossy(),
        "installed": pkgs,
        "summary": summary
    }).to_string())
}

// Command to check package installation status in the venv
#[tauri::command]
async fn check_python_deps(app_handle: AppHandle, packages: Option<Vec<String>>) -> Result<String, String> {
    let pkgs = packages.or_else(|| read_requirements(&app_handle)).unwrap_or_else(default_packages);
    let venv = ensure_venv()?; // ensure path and python exist
    let statuses = check_packages(&venv, &pkgs)?;
    Ok(serde_json::to_string(&statuses).map_err(|e| e.to_string())?)
}

fn resolve_script_absolute_path(app_handle: &AppHandle, script_path: &str) -> (PathBuf, Vec<PathBuf>) {
    let mut tried: Vec<PathBuf> = Vec::new();

    let input_path = PathBuf::from(script_path);
    if input_path.is_absolute() {
        return (input_path.clone(), tried);
    }

    // Candidates to try for resolving relative paths
    let mut candidates: Vec<PathBuf> = Vec::new();

    // 1) Current working directory
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join(script_path));
        // Also try parent of cwd (useful when cwd is src-tauri during dev)
        if let Some(parent) = cwd.parent() {
            candidates.push(parent.join(script_path));
        }
    }

    // 2) Executable directory (useful in production)
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            candidates.push(exe_dir.join(script_path));
            // On macOS packaged apps, resources live in ../Resources
            if cfg!(target_os = "macos") {
                if let Some(app_contents) = exe_dir.parent() {
                    let resources = app_contents.join("Resources").join(script_path);
                    candidates.push(resources);
                }
            }
        }
    }

    // 3) Tauri resource directory if available (bundled files)
    // 3) Tauri resource directory (bundled files) via PathResolver
    if let Some(res_dir) = app_handle.path_resolver().resource_dir() {
        candidates.push(res_dir.join(script_path));
        if let Some(fname) = Path::new(script_path).file_name() {
            candidates.push(res_dir.join(fname));
        }
    }
    // Also try resolve_resource which maps logical resource paths
    if let Some(resolved) = app_handle.path_resolver().resolve_resource(script_path) {
        candidates.push(resolved);
    }

    // Return the first existing path, or the first candidate if none exist
    for cand in &candidates {
        tried.push(cand.clone());
        if cand.exists() {
            return (cand.clone(), tried);
        }
    }

    // Fallback: return input relative path joined to cwd (even if it doesn't exist)
    let fallback = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    (fallback.join(script_path), tried)
}

// Command to launch a Python script and stream output events
// Accept flexible args: script_path or scriptPath or nested in args
#[allow(non_snake_case)]
#[tauri::command]
async fn launch_script(
    app_handle: AppHandle,
    script_path: Option<String>,
    scriptPath: Option<String>,
    args: Option<serde_json::Value>,
) -> Result<String, String> {
    let script_path = script_path
        .or(scriptPath)
        .or_else(|| args.as_ref().and_then(|a| a.get("script_path").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .or_else(|| args.as_ref().and_then(|a| a.get("scriptPath").and_then(|v| v.as_str()).map(|s| s.to_string())))
        .ok_or_else(|| "missing 'script_path'".to_string())?;
    println!("Launching script: {}", script_path);

    // Resolve to absolute path using multiple strategies and set working directory to the script's folder
    let (abs_path, tried) = resolve_script_absolute_path(&app_handle, &script_path);
    if !abs_path.exists() {
        let mut msg = String::from("Script not found. Tried locations:\n");
        for p in tried {
            msg.push_str(&format!(" - {}\n", p.to_string_lossy()));
        }
        msg.push_str(&format!("Resolved final candidate: {}", abs_path.to_string_lossy()));
        eprintln!("{}", msg);
        return Err(msg);
    }

    let script_dir = abs_path
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    // Prefer venv python if present
    let venv_dir = home_venv_path();
    let venv_py = venv_python_path(&venv_dir);
    let mut cmd = if venv_py.exists() {
        let mut command = Command::new(venv_py);
        command.arg(abs_path.to_string_lossy().as_ref());
        command
    } else if cfg!(target_os = "windows") {
        let mut command = Command::new("cmd");
        command.args(["/C", "python", abs_path.to_string_lossy().as_ref()]);
        command
    } else {
        let mut command = Command::new("python3");
        command.arg(abs_path.to_string_lossy().as_ref());
        command
    };

    // Set working directory to the script's directory so relative file accesses work
    cmd.current_dir(&script_dir);

    // Derive preferred WORKING_DIR similar to metadata analyzer and pass via environment
    if let Some(fname) = abs_path.file_name().and_then(|s| s.to_str()) {
        use std::fs::read_dir;
        let has_xlsx = |dir: &std::path::Path| read_dir(dir).map(|rd| rd.flatten().any(|e| {
            let n = e.file_name(); let s = n.to_string_lossy();
            s.ends_with(".xlsx") && !s.starts_with('~') && !s.starts_with('.') && !s.starts_with("._")
        })).unwrap_or(false);

        // Portable layout folders next to the launcher
        let (snyk_portable, datadome_portable) = ensure_visible_data_dirs();

        // Dev fallbacks
        let app_way = script_dir.parent().unwrap_or(std::path::Path::new(".")).to_path_buf();
        let workspace_root = app_way.parent().unwrap_or(std::path::Path::new(".")).to_path_buf();
        let app_snyk = app_way.join("Snyk Report Compare");
        let app_datadome = app_way.join("DataDome Verified Bots Compare");
        let script_snyk = workspace_root.join("Script Way").join("Snyk Report Compare");
        let script_datadome = workspace_root.join("Script Way").join("DataDome Verified Bots Compare");

        let mut working_dir = script_dir.clone();
        let lower = fname.to_lowercase();
        if lower.contains("snyk_compare.py") {
            if has_xlsx(&snyk_portable) { working_dir = snyk_portable; }
            else if has_xlsx(&app_snyk) { working_dir = app_snyk; }
            else if has_xlsx(&script_snyk) { working_dir = script_snyk; }
            else if snyk_portable.exists() { working_dir = snyk_portable; }
            else if app_snyk.exists() { working_dir = app_snyk; }
            else if script_snyk.exists() { working_dir = script_snyk; }
        } else if lower.contains("datadome_compare.py") {
            if has_xlsx(&datadome_portable) { working_dir = datadome_portable; }
            else if has_xlsx(&app_datadome) { working_dir = app_datadome; }
            else if has_xlsx(&script_datadome) { working_dir = script_datadome; }
            else if datadome_portable.exists() { working_dir = datadome_portable; }
            else if app_datadome.exists() { working_dir = app_datadome; }
            else if script_datadome.exists() { working_dir = script_datadome; }
        }

        // Export as environment so Python can pick it up
        cmd.env("WORKING_DIR", &working_dir);
        let archive_dir = working_dir.join("_archive");
        cmd.env("ARCHIVE_DIR", &archive_dir);
    }

    // Spawn the process and stream output
    match cmd.stdout(std::process::Stdio::piped()).stderr(std::process::Stdio::piped()).spawn() {
        Ok(mut child) => {
            let handle = app_handle.clone();
            // Stream stdout on a blocking thread
            if let Some(stdout) = child.stdout.take() {
                std::thread::spawn(move || {
                    use std::io::{BufRead, BufReader};
                    let reader = BufReader::new(stdout);
                    for line_res in reader.lines() {
                        if let Ok(line) = line_res {
                            let _ = handle.emit_all("script-output", json!({ "line": line, "source": "stdout" }));
                        } else {
                            break;
                        }
                    }
                });
            }
            // Stream stderr on a blocking thread
            let handle_err = app_handle.clone();
            if let Some(stderr) = child.stderr.take() {
                std::thread::spawn(move || {
                    use std::io::{BufRead, BufReader};
                    let reader = BufReader::new(stderr);
                    for line_res in reader.lines() {
                        if let Ok(line) = line_res {
                            let _ = handle_err.emit_all("script-output", json!({ "line": line, "source": "stderr" }));
                        } else {
                            break;
                        }
                    }
                });
            }

            // Wait in background and emit exit
            tauri::async_runtime::spawn(async move {
                let status = child.wait().expect("failed to wait on child");
                let code = status.code();
                let _ = app_handle.emit_all("script-exit", json!({ "code": code }));
            });
            Ok(format!("Script '{}' launched successfully", abs_path.to_string_lossy()))
        }
        Err(e) => {
            eprintln!("Failed to launch script: {}", e);
            Err(format!("Failed to launch script: {}", e))
        }
    }
}

// Command to open a native file dialog for selecting script files
#[tauri::command]
async fn browse_file() -> Result<String, String> {
    match FileDialogBuilder::new()
        .add_filter("Python Scripts", &["py"])
        .add_filter("All Files", &["*"])
        .set_title("Select Script File")
        .pick_file()
    {
        Some(path) => Ok(path.to_string_lossy().to_string()),
        None => Err("No file selected".to_string()),
    }
}

// Command to read script metadata (returns dummy data for now)
// Accepts flexible args: script_path (snake) OR scriptPath (camel) OR inside an `args` object
#[allow(non_snake_case)]
#[tauri::command]
async fn read_script_metadata(
    app_handle: AppHandle,
    script_path: Option<String>,
    scriptPath: Option<String>,
    args: Option<serde_json::Value>,
) -> Result<String, String> {
    // Prefer top-level params; fall back to an `args` wrapper
    let script_path = script_path
        .or(scriptPath)
        .or_else(|| {
            args.as_ref()
                .and_then(|a| a.get("script_path").and_then(|v| v.as_str()).map(|s| s.to_string()))
        })
        .or_else(|| {
            args.as_ref()
                .and_then(|a| a.get("scriptPath").and_then(|v| v.as_str()).map(|s| s.to_string()))
        })
        .ok_or_else(|| "missing 'script_path'".to_string())?;
    // Extract script name from path
    let script_name = std::path::Path::new(&script_path)
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("Unknown Script");

    // Resolve script to an absolute path so parent calculations are reliable
    let (abs_script_path, _tried) = resolve_script_absolute_path(&app_handle, &script_path);
    // Derive a better working directory based on known script types and portable layout
    let mut working_dir = abs_script_path
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| std::path::PathBuf::from("."));
    if let Some(fname) = abs_script_path.file_name().and_then(|s| s.to_str()) {
        use std::fs::read_dir;
        let has_xlsx = |dir: &std::path::Path| read_dir(dir).map(|rd| rd.flatten().any(|e| {
            let n = e.file_name(); let s = n.to_string_lossy();
            s.ends_with(".xlsx") && !s.starts_with('~') && !s.starts_with('.') && !s.starts_with("._")
        })).unwrap_or(false);

        // 1) Prefer portable layout: folders next to the launcher
        let (snyk_portable, datadome_portable) = ensure_visible_data_dirs();

        // 2) Keep current workspace dev fallbacks for convenience
        let script_dir = abs_script_path.parent().map(|p| p.to_path_buf()).unwrap_or_else(|| std::path::PathBuf::from("."));
        let app_way = script_dir.parent().unwrap_or(std::path::Path::new(".")).to_path_buf();
        let workspace_root = app_way.parent().unwrap_or(std::path::Path::new(".")).to_path_buf();
        let app_snyk = app_way.join("Snyk Report Compare");
        let app_datadome = app_way.join("DataDome Verified Bots Compare");
        let script_snyk = workspace_root.join("Script Way").join("Snyk Report Compare");
        let script_datadome = workspace_root.join("Script Way").join("DataDome Verified Bots Compare");

        if fname.to_lowercase().contains("snyk_compare.py") {
            // Priority: portable snyk dir (if exists), then dev candidates
            if has_xlsx(&snyk_portable) { working_dir = snyk_portable; }
            else if has_xlsx(&app_snyk) { working_dir = app_snyk; }
            else if has_xlsx(&script_snyk) { working_dir = script_snyk; }
            else if snyk_portable.exists() { working_dir = snyk_portable; }
            else if app_snyk.exists() { working_dir = app_snyk; }
            else if script_snyk.exists() { working_dir = script_snyk; }
        } else if fname.to_lowercase().contains("datadome_compare.py") {
            if has_xlsx(&datadome_portable) { working_dir = datadome_portable; }
            else if has_xlsx(&app_datadome) { working_dir = app_datadome; }
            else if has_xlsx(&script_datadome) { working_dir = script_datadome; }
            else if datadome_portable.exists() { working_dir = datadome_portable; }
            else if app_datadome.exists() { working_dir = app_datadome; }
            else if script_datadome.exists() { working_dir = script_datadome; }
        }
    }

    // Log selected working directory for verification during development
    println!(
        "[read_script_metadata] script='{}' working_dir='{}'",
        abs_script_path.to_string_lossy(),
        working_dir.to_string_lossy()
    );

    // Build documentation list based on script type using Markdown files
    let is_datadome = abs_script_path
        .file_name()
        .and_then(|s| s.to_str())
        .map(|s| s.to_lowercase().contains("datadome_compare.py"))
        .unwrap_or(false);
    let docs = if is_datadome {
        vec!["README.md", "DataDome_Compare_Script_User_Guide.md"]
    } else {
        vec!["README.md", "Snyk_Compare_Script_User_Guide.md"]
    };

    // Return dummy metadata structured like the left panel in the screenshot
    let metadata = json!({
        "script_name": script_name,
        "file_status": "Script file exists",
        "paths": {
            "script": abs_script_path.to_string_lossy().to_string(),
            "working_dir": working_dir.to_string_lossy().to_string()
        },
        "documentation": docs,
        "dependencies": [
            "pandas",
            "openpyxl", 
            "colorama"
        ],
        // Leave required_files empty; it will be populated by analyzer
        "required_files": []
    });

    Ok(metadata.to_string())
}

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(FileWatchState::default()))
        .invoke_handler(tauri::generate_handler![
            launch_script,
            browse_file,
            read_script_metadata,
            setup_python_env,
            check_python_deps,
            check_required_files,
            analyze_required_files,
            read_doc::read_documentation_file,
            start_file_watch,
            stop_file_watch,
            reveal_path,
            path_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/* 
TODO: Future enhancements for more complex interactions:

1. Real metadata parsing:
   - Parse Python files for imports and dependencies
   - Read configuration files or docstrings
   - Check for required files in the script directory

2. Enhanced script execution:
   - Capture and stream script output in real-time
   - Support for different Python environments (venv, conda)
   - Script status monitoring and process management

3. File system operations:
   - Validate script paths and dependencies
   - Create working directories if needed
   - Handle file permissions and access rights

4. Error handling and logging:
   - Better error messages and user feedback
   - Logging system for debugging and troubleshooting
   - Recovery mechanisms for failed operations

5. Configuration management:
   - User preferences and settings
   - Script favorites and recent files
   - Custom Python interpreter paths
*/
