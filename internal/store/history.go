package store

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// HistorySummary is a lightweight history record used in list views.
type HistorySummary struct {
	ID       string `json:"id"`
	ToolID   string `json:"toolId"`
	ToolName string `json:"toolName"`
	RanAt    int64  `json:"ranAt"`
	ExitCode int    `json:"exitCode"`
}

// HistoryEntry is a full history record including output and error text.
type HistoryEntry struct {
	ID       string `json:"id"`
	ToolID   string `json:"toolId"`
	ToolName string `json:"toolName"`
	RanAt    int64  `json:"ranAt"`
	ExitCode int    `json:"exitCode"`
	Output   string `json:"output"`
	Error    string `json:"error"`
}

// RecordRun saves a completed run to the history table.
func (s *Store) RecordRun(toolID, toolName string, exitCode int, output, errText string) error {
	_, err := s.db.Exec(
		`INSERT INTO run_history (id, tool_id, tool_name, ran_at, exit_code, output, error)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		uuid.New().String(),
		toolID,
		toolName,
		time.Now().Unix(),
		exitCode,
		output,
		errText,
	)
	if err != nil {
		return fmt.Errorf("record run: %w", err)
	}
	return nil
}

// ListHistory returns the latest 200 history summaries.
// Pass toolID="" to list across all tools; pass a specific ID to filter by tool.
func (s *Store) ListHistory(toolID string) []HistorySummary {
	query := `SELECT id, tool_id, tool_name, ran_at, exit_code
	          FROM run_history ORDER BY ran_at DESC LIMIT 200`
	args := []any{}
	if toolID != "" {
		query = `SELECT id, tool_id, tool_name, ran_at, exit_code
		         FROM run_history WHERE tool_id = ? ORDER BY ran_at DESC LIMIT 200`
		args = append(args, toolID)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return []HistorySummary{}
	}
	defer rows.Close()

	var list []HistorySummary
	for rows.Next() {
		var h HistorySummary
		if err := rows.Scan(&h.ID, &h.ToolID, &h.ToolName, &h.RanAt, &h.ExitCode); err == nil {
			list = append(list, h)
		}
	}
	if list == nil {
		return []HistorySummary{}
	}
	return list
}

// GetHistoryEntry returns the full record for a single history entry.
func (s *Store) GetHistoryEntry(id string) (HistoryEntry, error) {
	row := s.db.QueryRow(
		`SELECT id, tool_id, tool_name, ran_at, exit_code, output, error
		 FROM run_history WHERE id = ?`, id,
	)
	var h HistoryEntry
	if err := row.Scan(&h.ID, &h.ToolID, &h.ToolName, &h.RanAt, &h.ExitCode, &h.Output, &h.Error); err != nil {
		return HistoryEntry{}, fmt.Errorf("history entry not found: %w", err)
	}
	return h, nil
}

// ClearHistory deletes history entries.
// Pass toolID="" to clear all history; pass a specific ID to clear only that tool's history.
func (s *Store) ClearHistory(toolID string) error {
	var err error
	if toolID == "" {
		_, err = s.db.Exec(`DELETE FROM run_history`)
	} else {
		_, err = s.db.Exec(`DELETE FROM run_history WHERE tool_id = ?`, toolID)
	}
	if err != nil {
		return fmt.Errorf("clear history: %w", err)
	}
	return nil
}
