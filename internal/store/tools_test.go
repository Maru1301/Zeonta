package store

import (
	"testing"
)

func openTestStore(t *testing.T) *Store {
	t.Helper()
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open test store: %v", err)
	}
	t.Cleanup(func() { s.Close() })
	return s
}

func TestCreateAndGetTool(t *testing.T) {
	s := openTestStore(t)

	tool := Tool{
		Name: "My Script",
		Type: ToolTypeShell,
		Body: "echo hello",
		Desc: "A test script",
		Params: []Param{
			{Name: "NAME", DefaultVal: "world"},
		},
	}

	created, err := s.CreateTool(tool)
	if err != nil {
		t.Fatalf("create tool: %v", err)
	}
	if created.ID == "" {
		t.Fatal("expected ID to be assigned")
	}

	got, err := s.GetTool(created.ID)
	if err != nil {
		t.Fatalf("get tool: %v", err)
	}
	if got.Name != tool.Name {
		t.Errorf("name: got %q, want %q", got.Name, tool.Name)
	}
	if len(got.Params) != 1 || got.Params[0].Name != "NAME" {
		t.Errorf("params mismatch: %+v", got.Params)
	}
}

func TestCreateTool_DuplicateName(t *testing.T) {
	s := openTestStore(t)
	tool := Tool{Name: "dup", Type: ToolTypeShell, Body: "echo"}
	if _, err := s.CreateTool(tool); err != nil {
		t.Fatalf("first create: %v", err)
	}
	if _, err := s.CreateTool(tool); err == nil {
		t.Fatal("expected error on duplicate name")
	}
}

func TestCreateTool_EmptyName(t *testing.T) {
	s := openTestStore(t)
	_, err := s.CreateTool(Tool{Type: ToolTypeShell, Body: "echo"})
	if err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestListTools(t *testing.T) {
	s := openTestStore(t)
	s.CreateTool(Tool{Name: "A", Type: ToolTypeShell, Body: "echo a"})
	s.CreateTool(Tool{Name: "B", Type: ToolTypeGo, Body: "fmt.Println()"})

	list := s.ListTools()
	if len(list) != 2 {
		t.Fatalf("expected 2 tools, got %d", len(list))
	}
	if list[0].Name != "A" || list[1].Name != "B" {
		t.Errorf("unexpected order: %+v", list)
	}
}

func TestUpdateTool(t *testing.T) {
	s := openTestStore(t)
	created, _ := s.CreateTool(Tool{Name: "orig", Type: ToolTypeShell, Body: "echo"})

	created.Name = "updated"
	created.Body = "echo updated"
	updated, err := s.UpdateTool(created)
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.Name != "updated" {
		t.Errorf("name not updated")
	}

	got, _ := s.GetTool(created.ID)
	if got.Name != "updated" {
		t.Errorf("persisted name wrong: %q", got.Name)
	}
}

func TestDeleteTool(t *testing.T) {
	s := openTestStore(t)
	created, _ := s.CreateTool(Tool{Name: "to-delete", Type: ToolTypeShell, Body: "echo"})

	if err := s.DeleteTool(created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, err := s.GetTool(created.ID); err == nil {
		t.Fatal("expected error after deletion")
	}
}

func TestDeleteTool_NotFound(t *testing.T) {
	s := openTestStore(t)
	if err := s.DeleteTool("nonexistent-id"); err == nil {
		t.Fatal("expected error for nonexistent id")
	}
}

func TestGetTool_EmptyParamsNotNil(t *testing.T) {
	s := openTestStore(t)
	created, err := s.CreateTool(Tool{Name: "no-params", Type: ToolTypeShell, Body: "echo"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	got, err := s.GetTool(created.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Params == nil {
		t.Error("Params should be an empty slice, not nil")
	}
}

func TestDescLengthConstraint(t *testing.T) {
	s := openTestStore(t)
	longDesc := string(make([]rune, 301))
	_, err := s.CreateTool(Tool{Name: "x", Type: ToolTypeShell, Body: "echo", Desc: longDesc})
	if err == nil {
		t.Fatal("expected error: desc exceeds 300 chars")
	}
}
