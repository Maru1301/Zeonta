package executor

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"zeonta/internal/store"
)

// wrapGoSnippet wraps a Go snippet in package main + func main() boilerplate.
// If the body already starts with "package", it is returned unchanged (full-file mode).
//
// Snippet mode rules:
//   - An optional import block at the top is extracted and placed after "package main".
//   - Top-level declarations (func, type, var, const) are placed outside func main().
//   - Remaining statements are placed inside func main().
//   - If the snippet already declares func main(), no extra func main() is added.
//
// Note: snippet mode only supports standard library imports — no go.mod is created.
func wrapGoSnippet(body string) string {
	trimmed := strings.TrimSpace(body)
	if strings.HasPrefix(trimmed, "package") {
		return body
	}

	// Extract optional import block from the top.
	importBlock, rest := extractSnippetImport(trimmed)

	// Split remaining code into top-level declarations and statements.
	decls, stmts := splitTopLevel(rest)

	var sb strings.Builder
	sb.WriteString("package main\n")
	if importBlock != "" {
		sb.WriteString("\n")
		sb.WriteString(importBlock)
		sb.WriteString("\n")
	}
	if strings.TrimSpace(decls) != "" {
		sb.WriteString("\n")
		sb.WriteString(strings.TrimSpace(decls))
		sb.WriteString("\n")
	}
	// Only add func main() if the snippet doesn't already define it.
	if !strings.Contains(decls, "func main(") {
		sb.WriteString("\nfunc main() {\n")
		for _, line := range strings.Split(strings.TrimSpace(stmts), "\n") {
			sb.WriteString("\t")
			sb.WriteString(line)
			sb.WriteString("\n")
		}
		sb.WriteString("}\n")
	}
	return sb.String()
}

// extractSnippetImport extracts an optional import block from the start of a snippet body.
func extractSnippetImport(body string) (importBlock, rest string) {
	if !strings.HasPrefix(body, "import") {
		return "", body
	}
	after := strings.TrimLeft(body[len("import"):], " \t")
	if strings.HasPrefix(after, "(") {
		end := strings.Index(body, ")")
		if end != -1 {
			return body[:end+1], strings.TrimSpace(body[end+1:])
		}
		return "", body
	}
	nl := strings.Index(body, "\n")
	if nl != -1 {
		return body[:nl], strings.TrimSpace(body[nl+1:])
	}
	return body, ""
}

// splitTopLevel separates top-level declarations (func, type, var, const)
// from statement-level code by tracking brace depth.
func splitTopLevel(body string) (decls, stmts string) {
	lines := strings.Split(body, "\n")
	var declLines, stmtLines []string
	depth := 0
	inDecl := false

	for _, line := range lines {
		trimLine := strings.TrimSpace(line)
		if depth == 0 {
			inDecl = strings.HasPrefix(trimLine, "func ") ||
				strings.HasPrefix(trimLine, "type ") ||
				strings.HasPrefix(trimLine, "var (") ||
				strings.HasPrefix(trimLine, "const (")
		}
		if inDecl {
			declLines = append(declLines, line)
		} else if trimLine != "" || len(stmtLines) > 0 {
			stmtLines = append(stmtLines, line)
		}
		depth += strings.Count(line, "{") - strings.Count(line, "}")
		if depth < 0 {
			depth = 0
		}
	}
	return strings.Join(declLines, "\n"), strings.Join(stmtLines, "\n")
}

// RunInput carries the values the user provided at run time.
type RunInput struct {
	ToolID      string            `json:"toolId"`
	ParamValues map[string]string `json:"paramValues"`
}

// RunResult is returned after execution completes.
type RunResult struct {
	Output   string `json:"output"`
	ExitCode int    `json:"exitCode"`
	Error    string `json:"error"`
}

// platformOf returns the OS names on which a tool type can run.
// A nil return means the type runs on all platforms.
func platformOf(t store.ToolType) []string {
	switch t {
	case store.ToolTypePowerShell, store.ToolTypeCmd:
		return []string{"windows"}
	case store.ToolTypeBash:
		return []string{"darwin", "linux"}
	case store.ToolTypeAppleScript:
		return []string{"darwin"}
	default:
		return nil
	}
}

// Run executes a tool with the given input.
// envVars is the active environment's key-value pairs, resolved from the store by the caller.
// emit is called for each line of output during execution.
//
// Resolution syntax:
//   - {{KEY}}   — replaced with the value from the active environment set
//   - [[PARAM]] — replaced with the user-provided parameter value (or its default)
func Run(tool store.Tool, input RunInput, envVars map[string]string, emit func(string)) RunResult {
	// Step 1: resolve {{ENV_KEY}} in the script body
	resolvedBody := tool.Body
	resolvedParams := make(map[string]string)

	for _, p := range tool.Params {
		val, ok := input.ParamValues[p.Name]
		if !ok {
			val = p.DefaultVal
		}
		// resolve env vars inside param default values
		for k, v := range envVars {
			val = strings.ReplaceAll(val, "{{"+k+"}}", v)
		}
		resolvedParams[p.Name] = val
	}

	for k, v := range envVars {
		resolvedBody = strings.ReplaceAll(resolvedBody, "{{"+k+"}}", v)
	}

	// Step 2: resolve [[PARAM_NAME]] in script body
	for name, val := range resolvedParams {
		resolvedBody = strings.ReplaceAll(resolvedBody, "[["+name+"]]", val)
	}

	// Step 3: build env for subprocess (inherit OS env + active environment vars)
	env := os.Environ()
	for k, v := range envVars {
		env = append(env, k+"="+v)
	}

	// Write resolved body to a temp file and execute
	if platforms := platformOf(tool.Type); platforms != nil {
		ok := false
		for _, p := range platforms {
			if p == runtime.GOOS {
				ok = true
				break
			}
		}
		if !ok {
			return RunResult{Error: fmt.Sprintf("tool type %q is not supported on %s", tool.Type, runtime.GOOS)}
		}
	}

	switch tool.Type {
	case store.ToolTypePowerShell:
		return runScript(resolvedBody, ".ps1", []string{"powershell.exe", "-ExecutionPolicy", "Bypass", "-File"}, env, emit)
	case store.ToolTypeCmd:
		return runScript(resolvedBody, ".bat", []string{"cmd.exe", "/C"}, env, emit)
	case store.ToolTypeBash:
		return runScript(resolvedBody, ".sh", []string{"/bin/bash"}, env, emit)
	case store.ToolTypeAppleScript:
		return runScript(resolvedBody, ".applescript", []string{"osascript"}, env, emit)
	case store.ToolTypePython:
		pyCmd := "python3"
		if runtime.GOOS == "windows" {
			pyCmd = "python"
		}
		return runScript(resolvedBody, ".py", []string{pyCmd}, env, emit)
	case store.ToolTypeGo:
		return runScript(wrapGoSnippet(resolvedBody), ".go", []string{"go", "run"}, env, emit)
	default:
		return RunResult{Error: fmt.Sprintf("unknown tool type: %s", tool.Type)}
	}
}

func runScript(body, ext string, cmdPrefix []string, env []string, emit func(string)) RunResult {
	tmp, err := os.CreateTemp("", "zeonta-*"+ext)
	if err != nil {
		return RunResult{Error: "failed to create temp file"}
	}
	defer os.Remove(tmp.Name())

	if _, err := tmp.WriteString(body); err != nil {
		return RunResult{Error: "failed to write script"}
	}
	tmp.Close()

	args := append(cmdPrefix, tmp.Name())
	cmd := exec.Command(args[0], args[1:]...)
	cmd.Env = env
	hideWindow(cmd)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return RunResult{Error: "failed to pipe output"}
	}
	cmd.Stderr = cmd.Stdout // merge stderr into stdout

	if err := cmd.Start(); err != nil {
		return RunResult{Error: fmt.Sprintf("failed to start: %s", err)}
	}

	var output strings.Builder
	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := scanner.Text()
		output.WriteString(line + "\n")
		if emit != nil {
			emit(line)
		}
	}

	exitCode := 0
	if err := cmd.Wait(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		}
	}

	return RunResult{
		Output:   output.String(),
		ExitCode: exitCode,
	}
}
