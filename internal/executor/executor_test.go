package executor

import (
	"strings"
	"testing"

	"zeonta/internal/store"
)

func TestResolveEnvVarsInBody(t *testing.T) {
	tool := store.Tool{
		Type: store.ToolTypeShell,
		Body: "echo {{BASE_URL}}",
	}
	envVars := map[string]string{"BASE_URL": "https://example.com"}

	result := Run(tool, RunInput{}, envVars, nil)
	if result.Error != "" {
		t.Fatalf("unexpected error: %s", result.Error)
	}
	if !strings.Contains(result.Output, "https://example.com") {
		t.Errorf("expected env var resolved in output, got: %q", result.Output)
	}
}

func TestResolveEnvVarsInsideParamValues(t *testing.T) {
	tool := store.Tool{
		Type: store.ToolTypeShell,
		Body: "echo [[ENDPOINT]]",
		Params: []store.Param{
			{Name: "ENDPOINT", DefaultVal: "{{BASE_URL}}/users"},
		},
	}
	input := RunInput{
		ParamValues: map[string]string{"ENDPOINT": "{{BASE_URL}}/users"},
	}
	envVars := map[string]string{"BASE_URL": "https://example.com"}

	result := Run(tool, input, envVars, nil)
	if result.Error != "" {
		t.Fatalf("unexpected error: %s", result.Error)
	}
	if !strings.Contains(result.Output, "https://example.com/users") {
		t.Errorf("expected env var resolved inside param value, got: %q", result.Output)
	}
}

func TestResolveParamInBody(t *testing.T) {
	tool := store.Tool{
		Type: store.ToolTypeShell,
		Body: "echo [[GREETING]]",
		Params: []store.Param{
			{Name: "GREETING", DefaultVal: "hello"},
		},
	}
	input := RunInput{
		ParamValues: map[string]string{"GREETING": "world"},
	}

	result := Run(tool, input, nil, nil)
	if result.Error != "" {
		t.Fatalf("unexpected error: %s", result.Error)
	}
	if !strings.Contains(result.Output, "world") {
		t.Errorf("expected param resolved in body, got: %q", result.Output)
	}
}

func TestNonZeroExitCode(t *testing.T) {
	tool := store.Tool{
		Type: store.ToolTypeShell,
		Body: "exit 1",
	}
	result := Run(tool, RunInput{}, nil, nil)

	// Non-zero exit is NOT a Go-level error — it appears in ExitCode
	if result.Error != "" {
		t.Errorf("non-zero exit should not set Error, got: %s", result.Error)
	}
	if result.ExitCode != 1 {
		t.Errorf("expected exit code 1, got %d", result.ExitCode)
	}
}

func TestWrapGoSnippet_PlainBody(t *testing.T) {
	out := wrapGoSnippet(`fmt.Println("hello")`)
	if !strings.Contains(out, "package main") {
		t.Error("expected package main")
	}
	if !strings.Contains(out, "func main()") {
		t.Error("expected func main()")
	}
	if !strings.Contains(out, `fmt.Println("hello")`) {
		t.Error("expected body inside func main")
	}
	if strings.Contains(out, "import") {
		t.Error("expected no import block for plain body")
	}
}

func TestWrapGoSnippet_WithSingleImport(t *testing.T) {
	body := "import \"fmt\"\nfmt.Println(\"hello\")"
	out := wrapGoSnippet(body)
	if !strings.Contains(out, "package main") {
		t.Error("expected package main")
	}
	if !strings.Contains(out, "import \"fmt\"") {
		t.Error("expected import line preserved")
	}
	if !strings.Contains(out, "func main()") {
		t.Error("expected func main()")
	}
	if !strings.Contains(out, `fmt.Println("hello")`) {
		t.Error("expected body inside func main")
	}
}

func TestWrapGoSnippet_WithMultiImport(t *testing.T) {
	body := "import (\n\t\"fmt\"\n\t\"os\"\n)\nfmt.Println(os.Args)"
	out := wrapGoSnippet(body)
	if !strings.Contains(out, "package main") {
		t.Error("expected package main")
	}
	if !strings.Contains(out, "import (") {
		t.Error("expected multi-line import block preserved")
	}
	if !strings.Contains(out, "func main()") {
		t.Error("expected func main()")
	}
	if !strings.Contains(out, "fmt.Println(os.Args)") {
		t.Error("expected body inside func main")
	}
}

func TestWrapGoSnippet_FullFile(t *testing.T) {
	body := "package main\n\nfunc main() {\n\tprintln(\"full\")\n}\n"
	out := wrapGoSnippet(body)
	if out != body {
		t.Errorf("full-file body should be returned unchanged, got:\n%s", out)
	}
}

func TestWrapGoSnippet_TopLevelFunc(t *testing.T) {
	body := "import \"fmt\"\nfunc plus() {\n\tfmt.Println(1 + 2)\n}\nplus()"
	out := wrapGoSnippet(body)
	if !strings.Contains(out, "package main") {
		t.Error("expected package main")
	}
	// func plus must be outside func main
	plusIdx := strings.Index(out, "func plus(")
	mainIdx := strings.Index(out, "func main(")
	if plusIdx == -1 {
		t.Error("expected func plus in output")
	}
	if mainIdx == -1 {
		t.Error("expected func main in output")
	}
	if plusIdx > mainIdx {
		t.Error("func plus should appear before func main")
	}
	if !strings.Contains(out, "plus()") {
		t.Error("expected plus() call inside func main")
	}
}

func TestWrapGoSnippet_SnippetWithOwnMain(t *testing.T) {
	body := "func main() {\n\tprintln(\"hi\")\n}"
	out := wrapGoSnippet(body)
	if strings.Count(out, "func main(") != 1 {
		t.Errorf("expected exactly one func main, got:\n%s", out)
	}
}

func TestEmitCalledPerLine(t *testing.T) {
	tool := store.Tool{
		Type: store.ToolTypeShell,
		Body: "echo line1\necho line2",
	}

	var lines []string
	Run(tool, RunInput{}, nil, func(line string) {
		lines = append(lines, line)
	})

	if len(lines) < 2 {
		t.Errorf("expected at least 2 emitted lines, got %d: %v", len(lines), lines)
	}
}
