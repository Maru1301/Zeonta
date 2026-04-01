package main

import (
	"testing"

	"zeonta/internal/store"
)

func TestParseImportFile_JSON(t *testing.T) {
	content := []byte(`{
		"version": "0.1.0",
		"tools": [
			{"name": "greet", "type": "shell", "body": "echo hi", "desc": "says hi", "params": []},
			{"name": "run", "type": "go", "body": "fmt.Println(\"go\")", "desc": "", "params": [
				{"name": "MSG", "default": "hello"}
			]}
		]
	}`)

	tools, err := parseImportFile("export.json", content)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tools) != 2 {
		t.Fatalf("expected 2 tools, got %d", len(tools))
	}
	if tools[0].Name != "greet" || tools[0].Type != store.ToolTypePowerShell {
		t.Errorf("tool[0]: got name=%q type=%q", tools[0].Name, tools[0].Type)
	}
	if tools[1].Name != "run" || tools[1].Type != store.ToolTypeGo {
		t.Errorf("tool[1]: got name=%q type=%q", tools[1].Name, tools[1].Type)
	}
	if len(tools[1].Params) != 1 || tools[1].Params[0].Name != "MSG" {
		t.Errorf("tool[1] params: %+v", tools[1].Params)
	}
}

func TestParseImportFile_PowerShell(t *testing.T) {
	body := "Write-Output 'hello'"
	tools, err := parseImportFile("my-script.ps1", []byte(body))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tools) != 1 {
		t.Fatalf("expected 1 tool, got %d", len(tools))
	}
	if tools[0].Name != "my-script" {
		t.Errorf("expected name %q, got %q", "my-script", tools[0].Name)
	}
	if tools[0].Type != store.ToolTypePowerShell {
		t.Errorf("expected type shell, got %q", tools[0].Type)
	}
	if tools[0].Body != body {
		t.Errorf("body mismatch: got %q", tools[0].Body)
	}
}

func TestParseImportFile_Bat(t *testing.T) {
	tools, err := parseImportFile("deploy.bat", []byte("echo deploying"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if tools[0].Type != store.ToolTypeCmd || tools[0].Name != "deploy" {
		t.Errorf("unexpected tool: %+v", tools[0])
	}
}

func TestParseImportFile_Go(t *testing.T) {
	body := "package main\nfunc main() {}"
	tools, err := parseImportFile("util.go", []byte(body))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if tools[0].Type != store.ToolTypeGo || tools[0].Name != "util" {
		t.Errorf("unexpected tool: %+v", tools[0])
	}
	if tools[0].Body != body {
		t.Errorf("body mismatch")
	}
}

func TestParseImportFile_InvalidJSON(t *testing.T) {
	_, err := parseImportFile("bad.json", []byte("{not valid json}"))
	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

func TestParseImportFile_UnsupportedExtension(t *testing.T) {
	_, err := parseImportFile("script.txt", []byte("echo hi"))
	if err == nil {
		t.Fatal("expected error for unsupported extension, got nil")
	}
}
