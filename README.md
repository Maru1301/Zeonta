# Zeonta

## Personal Script Manager: A Wails-Powered GUI for Scripts and Go Functions

Zeonta is a desktop application for users who frequently work with shell scripts or Go functions. Instead of jumping to the terminal each time, you write your scripts or Go functions directly in the app, store them as named tools, configure parameters and environment variables, and run them with a single click.

## ✨ Key Features
- 📝 Script & Function Storage: Write and store shell scripts or Go functions as reusable named tools.
- ⚙️ Parameterization: Define input parameters and environment variables per tool, configurable at runtime.
- 🚀 One-Click Execution: Run any stored tool instantly from the UI.
- 🛠 Full Tool Management: Add, modify, and delete tools at any time.
- 📦 Offline & Lightweight: Runs entirely offline as a single lightweight executable.

## 🛠 Tech Stack
- Backend: Go (script execution and tool management)
- Frontend: React.js + MUI (component library) + Tailwind CSS (utility styling)
- Framework: Wails v2 (bridging Go and web technologies)

## 🚀 Getting Started

### Prerequisites
To build and run this project, you need the following installed:
1. Go (1.21+)
2. Node.js (18+) & NPM/PNPM
3. Wails CLI:
   ```
   go install github.com/wailsapp/wails/v2/cmd/wails@latest
   ```

### Installation & Development
1. Clone the repository:
   ```
   git clone https://github.com/Maru1301/Zeonta.git
   cd zeonta
   ```
2. Run in development mode:
   ```
   wails dev
   ```
   This will start the Go backend and the React frontend with hot-reload enabled.
3. Build for production:
   ```
   wails build
   ```
   The compiled binary will be available in the `build/bin` directory.

## 📂 Project Structure
```
zeonta/
├── main.go            # Entry point for the Go application
├── app.go             # Backend logic and bridge functions
├── frontend/          # React frontend application
│   ├── src/           # UI Components and state management
│   └── wailsjs/       # Auto-generated Go-to-JS bindings
├── build/             # Application icons and compiled binaries
└── scripts/           # Storage for user-defined shell scripts
```

## 💡 How to Add a New Tool
Zeonta makes it easy to add new functionality:
1. Define the Go Function: Add a new method in app.go.
   ```go
   func (a *App) RunMyScript(param string) string {
    // Your Go logic or shell script execution here
    return "Task Completed"
   }
   ```

2. Call from React: Import the generated binding in your React component.
   ```js
   import { RunMyScript } from "../wailsjs/go/main/App";

   const handleAction = async () => {
     const result = await RunMyScript("input");
     console.log(result);
   };
   ```

## 🤝 Contributing
Contributions are welcome! Whether it's adding a new utility, fixing a bug, or improving the UI, feel free to open a Pull Request.

## 📄 License
This project is licensed under the MIT License.