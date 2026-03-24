package executor

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"zeonta/internal/store"
)

// RunInput carries the values the user provided at run time.
type RunInput struct {
	ToolID       string            `json:"toolId"`
	ParamValues  map[string]string `json:"paramValues"`
	EnvVarValues map[string]string `json:"envVarValues"`
}

// RunResult is returned after execution completes.
type RunResult struct {
	Output   string `json:"output"`
	ExitCode int    `json:"exitCode"`
	Error    string `json:"error"`
}

// Run executes a tool with the given input.
// emit is called for each line of output during execution.
func Run(tool store.Tool, input RunInput, emit func(string)) RunResult {
	// Step 1: resolve {{ENV_KEY}} everywhere (script body + param values)
	resolvedBody := tool.Body
	resolvedParams := make(map[string]string)

	for _, p := range tool.Params {
		val, ok := input.ParamValues[p.Name]
		if !ok {
			val = p.DefaultVal
		}
		// resolve env vars inside param values
		for k, v := range input.EnvVarValues {
			val = strings.ReplaceAll(val, "{{"+k+"}}", v)
		}
		resolvedParams[p.Name] = val
	}

	for k, v := range input.EnvVarValues {
		resolvedBody = strings.ReplaceAll(resolvedBody, "{{"+k+"}}", v)
	}

	// Step 2: resolve {{PARAM_NAME}} in script body
	for name, val := range resolvedParams {
		resolvedBody = strings.ReplaceAll(resolvedBody, "{{"+name+"}}", val)
	}

	// Step 3: build env for subprocess (inherit OS env + tool env vars)
	env := os.Environ()
	for k, v := range input.EnvVarValues {
		env = append(env, k+"="+v)
	}

	// Write resolved body to a temp file and execute
	switch tool.Type {
	case store.ToolTypeShell:
		return runScript(resolvedBody, ".ps1", []string{"powershell.exe", "-ExecutionPolicy", "Bypass", "-File"}, env, emit)
	case store.ToolTypeGo:
		return runScript(resolvedBody, ".go", []string{"go", "run"}, env, emit)
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
