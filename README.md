# Zeonta

## Personal Script Manager: A Wails-Powered GUI for Scripts and Go Functions

Zeonta is a desktop application for users who frequently work with shell scripts or Go functions. Instead of jumping to the terminal each time, you write your scripts or Go functions directly in the app, store them as named tools, configure parameters and environment variables, and run them with a single click.

> **Platform:** Windows only (v1)

## ✨ Key Features
- 📝 **Script & Function Storage:** Write and store PowerShell/batch scripts or Go functions as reusable named tools.
- ⚙️ **Parameterization:** Define input parameters and environment variables per tool, editable at runtime before each run.
- 🚀 **One-Click Execution:** Run any stored tool instantly from the UI — output streams live in a dedicated output panel.
- 🛠 **Full Tool Management:** Add, modify, and delete tools at any time.
- 📦 **Offline & Self-Contained:** Runs entirely offline. All tool data is stored locally in `%APPDATA%\Zeonta\zeonta.db`.

## 💡 Using Zeonta

### Creating a Tool
1. Click **+ New Tool** in the sidebar.
2. Fill in the tool name, select the type (Shell or Go), and write the script body.
3. Optionally add **Parameters** and **Environment Variables**.
4. Click **Save** — the tool appears in the sidebar immediately.

### Variable Substitution
Use `{{VARIABLE_NAME}}` syntax in your script body to reference parameters or environment variables:

```powershell
# Example shell tool with a parameter {{TARGET}} and env var {{BASE_URL}}
curl {{BASE_URL}}/api/{{TARGET}}
```

**Resolution order at runtime:**
1. `{{ENV_VAR}}` references are resolved first — including inside parameter values.
2. `{{PARAM}}` references are resolved in the script body.
3. Environment variables are also injected into the subprocess environment (accessible as `$env:KEY` in PowerShell).

### Running a Tool
- Click **Run** on a selected tool.
- If the tool has parameters or environment variables, a run panel slides in with all values pre-filled from their defaults. Edit as needed, then click **Run Now**.
- Output streams live in the output panel at the bottom. Exit code is shown on completion.

> Run-time edits to parameter and env var values are **not** saved back to the tool. To change defaults, use the **Edit** action.

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