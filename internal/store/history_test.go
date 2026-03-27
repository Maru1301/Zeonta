package store

import (
	"testing"
)

func TestRecordAndListHistory(t *testing.T) {
	s := openTestStore(t)

	// Record two runs for different tools
	if err := s.RecordRun("tool-1", "Alpha", 0, "output A", ""); err != nil {
		t.Fatalf("RecordRun: %v", err)
	}
	if err := s.RecordRun("tool-2", "Beta", 1, "output B", "some error"); err != nil {
		t.Fatalf("RecordRun: %v", err)
	}

	// List all
	all := s.ListHistory("")
	if len(all) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(all))
	}

	// List filtered by tool
	filtered := s.ListHistory("tool-1")
	if len(filtered) != 1 {
		t.Fatalf("expected 1 entry for tool-1, got %d", len(filtered))
	}
	if filtered[0].ToolName != "Alpha" {
		t.Errorf("expected ToolName Alpha, got %s", filtered[0].ToolName)
	}
	if filtered[0].ExitCode != 0 {
		t.Errorf("expected ExitCode 0, got %d", filtered[0].ExitCode)
	}
}

func TestGetHistoryEntry(t *testing.T) {
	s := openTestStore(t)

	if err := s.RecordRun("tool-1", "Alpha", 0, "hello output", ""); err != nil {
		t.Fatalf("RecordRun: %v", err)
	}

	summaries := s.ListHistory("tool-1")
	if len(summaries) == 0 {
		t.Fatal("no history entries found")
	}

	entry, err := s.GetHistoryEntry(summaries[0].ID)
	if err != nil {
		t.Fatalf("GetHistoryEntry: %v", err)
	}
	if entry.Output != "hello output" {
		t.Errorf("expected output 'hello output', got %q", entry.Output)
	}
	if entry.ToolID != "tool-1" {
		t.Errorf("expected ToolID 'tool-1', got %q", entry.ToolID)
	}
}

func TestGetHistoryEntry_NotFound(t *testing.T) {
	s := openTestStore(t)
	_, err := s.GetHistoryEntry("nonexistent-id")
	if err == nil {
		t.Fatal("expected error for missing entry, got nil")
	}
}

func TestClearHistory_ByTool(t *testing.T) {
	s := openTestStore(t)

	_ = s.RecordRun("tool-1", "Alpha", 0, "", "")
	_ = s.RecordRun("tool-1", "Alpha", 0, "", "")
	_ = s.RecordRun("tool-2", "Beta", 0, "", "")

	if err := s.ClearHistory("tool-1"); err != nil {
		t.Fatalf("ClearHistory: %v", err)
	}

	remaining := s.ListHistory("")
	if len(remaining) != 1 {
		t.Fatalf("expected 1 entry after clear, got %d", len(remaining))
	}
	if remaining[0].ToolID != "tool-2" {
		t.Errorf("expected remaining entry to be tool-2")
	}
}

func TestClearHistory_All(t *testing.T) {
	s := openTestStore(t)

	_ = s.RecordRun("tool-1", "Alpha", 0, "", "")
	_ = s.RecordRun("tool-2", "Beta", 1, "", "err")

	if err := s.ClearHistory(""); err != nil {
		t.Fatalf("ClearHistory all: %v", err)
	}

	remaining := s.ListHistory("")
	if len(remaining) != 0 {
		t.Fatalf("expected 0 entries after clear all, got %d", len(remaining))
	}
}

func TestListHistory_ToolNameSnapshot(t *testing.T) {
	s := openTestStore(t)

	// Record with a tool name, then verify the snapshot is preserved
	// (even if the tool is later renamed/deleted, history keeps the original name)
	if err := s.RecordRun("tool-1", "OldName", 0, "", ""); err != nil {
		t.Fatalf("RecordRun: %v", err)
	}

	summaries := s.ListHistory("")
	if summaries[0].ToolName != "OldName" {
		t.Errorf("expected snapshot name 'OldName', got %q", summaries[0].ToolName)
	}
}
