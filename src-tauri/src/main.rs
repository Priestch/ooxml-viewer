#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

fn main() {
  // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
  let open = CustomMenuItem::new("open".to_string(), "Open");
  let export = CustomMenuItem::new("export".to_string(), "Export");
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let file_menu = Menu::new()
      .add_item(open)
      .add_item(export)
      .add_item(quit);

  let maximum = CustomMenuItem::new("maximum".to_string(), "Maximum");
  let minimum = CustomMenuItem::new("minimum".to_string(), "Minimum");

  let window_menu = Menu::new()
      .add_item(maximum)
      .add_item(minimum);

  let file_submenu = Submenu::new("File", file_menu);
  let window_submenu = Submenu::new("Window", window_menu);
  let menu = Menu::new()
      // .add_native_item(MenuItem::Copy)
      // .add_item(CustomMenuItem::new("hide", "Hide"))
      .add_submenu(file_submenu);
      // .add_submenu(window_submenu);

  tauri::Builder::default()
    .menu(menu)
    .on_menu_event(|event| {
      let window = event.window();

      match event.menu_item_id() {
        "open" => {
          window.emit("open", "");
        }
        "export" => {
          window.emit("export", "");
        }
        "quit" => {
          std::process::exit(0);
        }
        _ => {}
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
