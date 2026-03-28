package store

import (
	"testing"
)

func makeTestTool(s *Store, name string) Tool {
	t, err := s.CreateTool(Tool{Name: name, Type: ToolTypeShell, Body: "echo hello"})
	if err != nil {
		panic(err)
	}
	return t
}

func TestRecordAndListVersions(t *testing.T) {
	s := openTestStore(t)
	tool := makeTestTool(s, "Alpha")

	// CreateTool already records v1 — record a second manually
	tool.Body = "echo world"
	if _, err := s.UpdateTool(tool); err != nil {
		t.Fatalf("UpdateTool: %v", err)
	}

	versions := s.ListVersions(tool.ID)
	if len(versions) != 2 {
		t.Fatalf("expected 2 versions, got %d", len(versions))
	}
	// newest first
	if versions[0].Version != 2 {
		t.Errorf("expected first entry to be v2, got v%d", versions[0].Version)
	}
	if versions[1].Version != 1 {
		t.Errorf("expected second entry to be v1, got v%d", versions[1].Version)
	}
}

func TestGetVersion(t *testing.T) {
	s := openTestStore(t)
	tool := makeTestTool(s, "Alpha")

	versions := s.ListVersions(tool.ID)
	if len(versions) == 0 {
		t.Fatal("no versions found")
	}

	v, err := s.GetVersion(versions[0].ID)
	if err != nil {
		t.Fatalf("GetVersion: %v", err)
	}
	if v.Body != "echo hello" {
		t.Errorf("expected body 'echo hello', got %q", v.Body)
	}
	if v.ToolID != tool.ID {
		t.Errorf("expected ToolID %q, got %q", tool.ID, v.ToolID)
	}
}

func TestGetVersion_NotFound(t *testing.T) {
	s := openTestStore(t)
	_, err := s.GetVersion("nonexistent")
	if err == nil {
		t.Fatal("expected error for missing version")
	}
}

func TestVersionAutoIncrement(t *testing.T) {
	s := openTestStore(t)
	tool := makeTestTool(s, "Alpha")

	tool.Body = "v2"
	if _, err := s.UpdateTool(tool); err != nil {
		t.Fatalf("UpdateTool v2: %v", err)
	}
	tool.Body = "v3"
	if _, err := s.UpdateTool(tool); err != nil {
		t.Fatalf("UpdateTool v3: %v", err)
	}

	versions := s.ListVersions(tool.ID)
	if len(versions) != 3 {
		t.Fatalf("expected 3 versions, got %d", len(versions))
	}
}

func TestListDeletedTools(t *testing.T) {
	s := openTestStore(t)
	tool := makeTestTool(s, "Alpha")
	makeTestTool(s, "Beta") // live tool — should not appear

	if err := s.DeleteTool(tool.ID); err != nil {
		t.Fatalf("DeleteTool: %v", err)
	}

	deleted := s.ListDeletedTools()
	if len(deleted) != 1 {
		t.Fatalf("expected 1 deleted tool, got %d", len(deleted))
	}
	if deleted[0].ToolID != tool.ID {
		t.Errorf("expected deleted tool ID %q, got %q", tool.ID, deleted[0].ToolID)
	}
	if deleted[0].Name != "Alpha" {
		t.Errorf("expected name 'Alpha', got %q", deleted[0].Name)
	}
	if deleted[0].VersionCount != 1 {
		t.Errorf("expected 1 version, got %d", deleted[0].VersionCount)
	}
}

func TestRestoreDeletedTool(t *testing.T) {
	s := openTestStore(t)
	tool := makeTestTool(s, "Alpha")

	if err := s.DeleteTool(tool.ID); err != nil {
		t.Fatalf("DeleteTool: %v", err)
	}

	deleted := s.ListDeletedTools()
	if len(deleted) == 0 {
		t.Fatal("no deleted tools found")
	}

	// Get the latest version ID for this deleted tool
	versions := s.ListVersions(deleted[0].ToolID)
	if len(versions) == 0 {
		t.Fatal("no versions for deleted tool")
	}

	restored, err := s.RestoreDeletedTool(versions[0].ID)
	if err != nil {
		t.Fatalf("RestoreDeletedTool: %v", err)
	}
	if restored.Name != "Alpha" {
		t.Errorf("expected restored name 'Alpha', got %q", restored.Name)
	}

	// Should no longer appear in deleted tools
	deleted = s.ListDeletedTools()
	if len(deleted) != 0 {
		t.Errorf("expected 0 deleted tools after restore, got %d", len(deleted))
	}
}

func TestVersionsPreservedAfterToolDelete(t *testing.T) {
	s := openTestStore(t)
	tool := makeTestTool(s, "Alpha")

	tool.Body = "echo v2"
	if _, err := s.UpdateTool(tool); err != nil {
		t.Fatalf("UpdateTool: %v", err)
	}

	if err := s.DeleteTool(tool.ID); err != nil {
		t.Fatalf("DeleteTool: %v", err)
	}

	// Versions must still be queryable after tool deletion
	versions := s.ListVersions(tool.ID)
	if len(versions) != 2 {
		t.Fatalf("expected 2 versions after delete, got %d", len(versions))
	}
}

func TestClearTrash(t *testing.T) {
	s := openTestStore(t)
	tool := makeTestTool(s, "Alpha")

	// Record some run history for this tool
	_ = s.RecordRun(tool.ID, tool.Name, "", 0, "output", "")

	// Delete the tool
	if err := s.DeleteTool(tool.ID); err != nil {
		t.Fatalf("DeleteTool: %v", err)
	}

	// Versions and history still exist
	if len(s.ListVersions(tool.ID)) == 0 {
		t.Fatal("expected versions before clear")
	}
	if len(s.ListHistory(tool.ID)) == 0 {
		t.Fatal("expected history before clear")
	}

	// Clear trash
	if err := s.ClearTrash(); err != nil {
		t.Fatalf("ClearTrash: %v", err)
	}

	// Both gone
	if len(s.ListVersions(tool.ID)) != 0 {
		t.Error("expected no versions after clear trash")
	}
	if len(s.ListHistory(tool.ID)) != 0 {
		t.Error("expected no history after clear trash")
	}
	if len(s.ListDeletedTools()) != 0 {
		t.Error("expected no deleted tools after clear trash")
	}
}

func TestClearTrashByIDs(t *testing.T) {
	s := openTestStore(t)
	alpha := makeTestTool(s, "Alpha")
	beta := makeTestTool(s, "Beta")
	makeTestTool(s, "Gamma") // live — should never be touched

	_ = s.RecordRun(alpha.ID, alpha.Name, "", 0, "out", "")
	_ = s.DeleteTool(alpha.ID)
	_ = s.DeleteTool(beta.ID)

	// Delete only Alpha
	if err := s.ClearTrashByIDs([]string{alpha.ID}); err != nil {
		t.Fatalf("ClearTrashByIDs: %v", err)
	}

	// Alpha gone, Beta still in trash
	deleted := s.ListDeletedTools()
	if len(deleted) != 1 {
		t.Fatalf("expected 1 deleted tool remaining, got %d", len(deleted))
	}
	if deleted[0].ToolID != beta.ID {
		t.Errorf("expected Beta to remain, got %q", deleted[0].ToolID)
	}

	// Alpha's versions and history cleared
	if len(s.ListVersions(alpha.ID)) != 0 {
		t.Error("expected Alpha versions to be cleared")
	}
	if len(s.ListHistory(alpha.ID)) != 0 {
		t.Error("expected Alpha history to be cleared")
	}
}

func TestClearTrashByIDs_DoesNotAffectLiveTools(t *testing.T) {
	s := openTestStore(t)
	live := makeTestTool(s, "Live")
	_ = s.RecordRun(live.ID, live.Name, "", 0, "out", "")

	// Passing a live tool ID must be a no-op
	if err := s.ClearTrashByIDs([]string{live.ID}); err != nil {
		t.Fatalf("ClearTrashByIDs: %v", err)
	}

	if len(s.ListVersions(live.ID)) == 0 {
		t.Error("live tool versions should not be cleared")
	}
	if len(s.ListHistory(live.ID)) == 0 {
		t.Error("live tool history should not be cleared")
	}
}

func TestClearTrash_DoesNotAffectLiveTools(t *testing.T) {
	s := openTestStore(t)
	live := makeTestTool(s, "Live")
	deleted := makeTestTool(s, "Deleted")

	_ = s.RecordRun(live.ID, live.Name, "", 0, "live output", "")
	_ = s.DeleteTool(deleted.ID)

	if err := s.ClearTrash(); err != nil {
		t.Fatalf("ClearTrash: %v", err)
	}

	// Live tool's versions and history must be untouched
	if len(s.ListVersions(live.ID)) == 0 {
		t.Error("live tool versions should not be cleared")
	}
	if len(s.ListHistory(live.ID)) == 0 {
		t.Error("live tool history should not be cleared")
	}
}

func TestRestoreToolVersion(t *testing.T) {
	s := openTestStore(t)
	tool := makeTestTool(s, "Alpha") // v1: "echo hello"

	tool.Body = "echo world"
	if _, err := s.UpdateTool(tool); err != nil { // v2
		t.Fatalf("UpdateTool: %v", err)
	}

	// Get v1 ID (last in list since newest first)
	versions := s.ListVersions(tool.ID)
	v1ID := versions[len(versions)-1].ID

	// Restore to v1 — no new snapshot is recorded; version count stays at 2
	restored, err := s.RestoreToolVersion(v1ID)
	if err != nil {
		t.Fatalf("RestoreToolVersion: %v", err)
	}
	if restored.Body != "echo hello" {
		t.Errorf("expected restored body 'echo hello', got %q", restored.Body)
	}

	versions = s.ListVersions(tool.ID)
	if len(versions) != 2 {
		t.Fatalf("expected 2 versions after restore (no new snapshot), got %d", len(versions))
	}
}
