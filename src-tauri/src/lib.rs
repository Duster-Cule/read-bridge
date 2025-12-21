#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![kv_get, kv_set, kv_remove])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn kv_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let dir = app
    .path()
    .app_config_dir()
    .map_err(|e| format!("failed to resolve app_config_dir: {e}"))?;
  Ok(dir.join("settings-kv.json"))
}

fn read_kv_file(path: &PathBuf) -> Result<HashMap<String, String>, String> {
  if !path.exists() {
    return Ok(HashMap::new());
  }
  let raw = fs::read_to_string(path).map_err(|e| format!("failed to read kv file: {e}"))?;
  if raw.trim().is_empty() {
    return Ok(HashMap::new());
  }
  let json: Value = match serde_json::from_str(&raw) {
    Ok(v) => v,
    Err(_e) => {
      // If corrupted, back it up and recover.
      let backup = path.with_extension(format!(
        "json.corrupt.{}",
        std::time::SystemTime::now()
          .duration_since(std::time::UNIX_EPOCH)
          .map(|d| d.as_millis())
          .unwrap_or(0)
      ));
      let _ = fs::rename(path, backup);
      return Ok(HashMap::new());
    }
  };
  let obj = json
    .as_object()
    .ok_or_else(|| "kv file is not a json object".to_string())?;
  let mut map = HashMap::new();
  for (k, v) in obj {
    if let Some(s) = v.as_str() {
      map.insert(k.to_string(), s.to_string());
    }
  }
  Ok(map)
}

fn write_kv_file(path: &PathBuf, map: &HashMap<String, String>) -> Result<(), String> {
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("failed to create config dir: {e}"))?;
  }

  let json = serde_json::to_string_pretty(map).map_err(|e| format!("failed to serialize kv map: {e}"))?;
  let tmp = path.with_extension("json.tmp");
  fs::write(&tmp, json).map_err(|e| format!("failed to write tmp kv file: {e}"))?;
  fs::rename(&tmp, path).map_err(|e| format!("failed to rename kv file: {e}"))?;
  Ok(())
}

#[tauri::command]
fn kv_get(app: tauri::AppHandle, key: String) -> Result<Option<String>, String> {
  let path = kv_file_path(&app)?;
  let map = read_kv_file(&path)?;
  Ok(map.get(&key).cloned())
}

#[tauri::command]
fn kv_set(app: tauri::AppHandle, key: String, value: String) -> Result<(), String> {
  let path = kv_file_path(&app)?;
  let mut map = read_kv_file(&path)?;
  map.insert(key, value);
  write_kv_file(&path, &map)
}

#[tauri::command]
fn kv_remove(app: tauri::AppHandle, key: String) -> Result<(), String> {
  let path = kv_file_path(&app)?;
  let mut map = read_kv_file(&path)?;
  map.remove(&key);
  write_kv_file(&path, &map)
}
