# Zeonta

## Modern Tooling Suite: A Wails-Powered GUI for Scripts

This project is a comprehensive tools package built with Wails (Go + React.js). It is designed to simplify complex workflows by providing a clean Graphical User Interface for executing shell scripts and Go functions. By wrapping low-level command-line logic in an intuitive UI, this project aims to lower the barrier to entry for technical tasks and improve daily productivity.

## ✨ Key Features
- 🚀 Script Orchestration: Run complex shell scripts (.sh, .bat, .ps1) with a single click.
- 🐹 Go-Native Performance: Leverage the full power of Go for backend-heavy utility functions.
- 🎨 Modern UI/UX: A responsive React-based interface that makes technical tooling accessible.
- 📦 Cross-Platform: Package your tools into a single, lightweight executable for Windows, macOS, and Linux.
- 🛠 Extensible Architecture: Easily register new scripts or functions via a unified bridge.

## 🛠 Tech Stack
- Backend: Go (The engine for system-level operations)
- Frontend: React.js (The interface layer)
- Framework: Wails (Bridging Go and Web technologies)
- Styling: Tailwind CSS (Recommended for rapid UI development)

## 🚀 Getting Started
Prerequisites
To build and run this project, you need the following installed:
1. Go (1.21+)
2. Node.js (18+) & NPM/PNPM
3. Wails CLI:
   ```
   go install [github.com/wailsapp/wails/v2/cmd/wails@latest](https://github.com/wailsapp/wails/v2/cmd/wails@latest)
   ```
Installation & Development
1. Clone the repository:
   ```
   git clone [https://github.com/your-username/zeonta.git](https://github.com/your-username/zeonta.git)
   cd zeonta
   ```
2. Run in development mode:
   ```
   wails dev
   ```
   This will start the Go backend and the React frontend with hot-reload enabled.
3. Build for production:wails build
The compiled binary will be available in the build/bin directory.

## 📂 Project Structure
```
zeonta/
├── main.go            # Entry point for the Go application
├── app.go             # Backend logic and bridge functions
├── frontend/          # React frontend application
│   ├── src/           # UI Components and state management
│   └── wailsjs/       # Auto-generated Go-to-JS bindings
├── build/             # Application icons and compiled binaries
└── scripts/           # (Optional) Storage for bundled shell scripts
```

## 💡 How to Add a New Tool
Zeonta makes it easy to add new functionality:
1. Define the Go Function: Add a new method in app.go.
   ```
   func (a *App) RunMyScript(param string) string {
    // Your Go logic or shell script execution here
    return "Task Completed"
   }
   ```

2. Call from React: Import the generated binding in your React component.
   ```
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
