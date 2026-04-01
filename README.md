# Zeonta

## Personal Script Manager: A Wails-Powered GUI for Scripts and Go Functions

Zeonta is a desktop application for users who frequently work with shell scripts or Go functions. Instead of jumping to the terminal each time, you write your scripts or Go functions directly in the app, store them as named tools, configure parameters and environment variables, and run them with a single click.

> **Platform:** Windows · macOS · Linux

## ✨ Key Features
- 📝 **Script & Function Storage:** Write and store scripts or Go functions as reusable named tools. Supported types: PowerShell, CMD/Batch, Bash, AppleScript, Python, Go.
- ⚙️ **Parameterization:** Define input parameters per tool, editable at runtime before each run.
- 🌐 **Global Environment Sets:** Create named sets of environment variables (e.g. "Dev", "Prod") and activate one globally — all tools run against it automatically.
- 🚀 **One-Click Execution:** Run any stored tool instantly from the UI — output streams live in a dedicated output panel.
- 🛠 **Full Tool Management:** Add, modify, and delete tools at any time.
- 🕒 **Version History:** Every tool save is snapshotted automatically. Browse past versions, run old versions directly, or restore any previous state.
- 🗑 **Trash & Restore:** Deleted tools are kept in a Trash panel. Restore individual versions or bulk-restore multiple tools. Permanently delete when ready.
- 📋 **Run History:** Every execution is logged with output, exit code, and a link to the exact version that was run.
- 📦 **Offline & Self-Contained:** Runs entirely offline. All tool data is stored locally in the platform config directory (`%APPDATA%\Zeonta` on Windows, `~/Library/Application Support/Zeonta` on macOS, `~/.config/Zeonta` on Linux).

## 💡 Using Zeonta

### Creating a Tool
1. Click the **Tools** icon in the left function bar to open the tool list.
2. Click **+ New Tool** — a new tab opens in the main area with a blank form.
3. Fill in the tool name, select the type (filtered to types supported on your platform), and write the script body.
4. Optionally add **Parameters**.
5. Click **Save** — the tool tab opens automatically and the tool list refreshes.

### Variable Substitution
Use `{{KEY}}` syntax to reference environment variables, and `[[PARAM]]` syntax to reference parameters:

```powershell
# Example shell tool with a parameter [[TARGET]] and env var {{BASE_URL}}
curl {{BASE_URL}}/api/[[TARGET]]
```

**Resolution order at runtime:**
1. `{{ENV_VAR}}` references are resolved first using the active environment set — including inside parameter default values.
2. `[[PARAM]]` references are resolved in the script body with the user-supplied values.
3. Environment variables are also injected into the subprocess environment (accessible as `$env:KEY` in PowerShell, `$KEY` in Bash/Python, etc.).

### Environment Sets
Instead of per-tool environment variables, Zeonta uses **global environment sets**. Create a named set (e.g. "Dev", "Prod") with any number of key-value pairs, then mark one as active. All tools automatically run against the active environment. Switch environments without touching individual tools.

### Running a Tool
- Click **Run** on a selected tool.
- If the tool has parameters, editable inputs are shown inline in the tool detail view, pre-filled with their defaults. Edit as needed and click **Run**.
- Output streams live in the output panel at the bottom. Exit code is shown on completion.

> Run-time edits to parameter values are **not** saved back to the tool. To change defaults, use the **Edit** action.

### Viewing Tool Versions
The **Versions panel** opens automatically in the right sidebar whenever a tool tab is active. It lists every saved snapshot of the tool, newest first. From the panel you can:
- Preview the script body at any point in time.
- **Run this version** — execute an old snapshot directly without changing the live tool.
- **Restore to current** — update the live tool to match that snapshot.

Each run in the History panel also links back to the exact version that was executed — clicking a history entry automatically pre-selects that version in the right sidebar.

### Using Trash
Deleted tools are not permanently removed — they move to the **Trash**. A badge on the Trash icon in the function bar shows how many deleted tools are waiting. From the Trash panel you can:
- Restore individual tools (from any saved version) or bulk-restore multiple tools at once.
- Permanently delete tools when you are sure you no longer need them.

## 🛠 Tech Stack
| Layer | Technology |
|---|---|
| Backend | Go 1.21+ |
| Frontend | React.js + MUI + Tailwind CSS |
| Framework | Wails v2 |
| Storage | SQLite (`modernc.org/sqlite`) |

## 🚀 Getting Started (Development)

### Prerequisites
1. Go (1.21+)
2. Node.js (18+) & NPM
3. Wails CLI:
   ```
   go install github.com/wailsapp/wails/v2/cmd/wails@latest
   ```
4. **Linux only:** `sudo apt-get install -y libwebkit2gtk-4.0-37 libgtk-3-0`

### Run in Development Mode
```bash
git clone https://github.com/Maru1301/Zeonta.git
cd Zeonta
wails dev
```
This starts the Go backend and React frontend with hot-reload enabled.

### Build for Production
```bash
wails build
```
The compiled binary will be in `build/bin/`.

## 📂 Project Structure
```
zeonta/
├── main.go              # Wails entry point
├── app.go               # All Go methods exposed to the frontend
├── internal/
│   ├── store/           # SQLite read/write (tool CRUD)
│   └── executor/        # Variable resolution and script execution
├── frontend/
│   └── src/             # React components and state
├── wailsjs/             # Auto-generated Wails bindings — do not edit
├── build/               # Icons and compiled binaries
└── docs/                # SDD specification documents
```

## 🤝 Contributing
Contributions are welcome! Feel free to open a Pull Request.

## 📄 License
This project is licensed under the MIT License.