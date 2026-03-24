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
	input := RunInput{
		EnvVarValues: map[string]string{"BASE_URL": "https://example.com"},
	}

	result := Run(tool, input, nil)
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
		Body: "echo {{ENDPOINT}}",
		Params: []store.Param{
			{Name: "ENDPOINT", DefaultVal: "{{BASE_URL}}/users"},
		},
	}
	input := RunInput{
		ParamValues:  map[string]string{"ENDPOINT": "{{BASE_URL}}/users"},
		EnvVarValues: map[string]string{"BASE_URL": "https://example.com"},
	}

	result := Run(tool, input, nil)
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
		Body: "echo {{GREETING}}",
		Params: []store.Param{
			{Name: "GREETING", DefaultVal: "hello"},
		},
	}
	input := RunInput{
		ParamValues: map[string]string{"GREETING": "world"},
	}

	result := Run(tool, input, nil)
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
	result := Run(tool, RunInput{}, nil)

	// Non-zero exit is NOT a Go-level error — it appears in ExitCode
	if result.Error != "" {
		t.Errorf("non-zero exit should not set Error, got: %s", result.Error)
	}
	if result.ExitCode != 1 {
		t.Errorf("expected exit code 1, got %d", result.ExitCode)
	}
}

func TestEmitCalledPerLine(t *testing.T) {
	tool := store.Tool{
		Type: store.ToolTypeShell,
		Body: "echo line1\necho line2",
	}

	var lines []string
	Run(tool, RunInput{}, func(line string) {
		lines = append(lines, line)
	})

	if len(lines) < 2 {
		t.Errorf("expected at least 2 emitted lines, got %d: %v", len(lines), lines)
	}
}
