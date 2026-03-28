package store

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ToolVersionSummary is a lightweight version record used in list views.
type ToolVersionSummary struct {
	ID      string `json:"id"`
	ToolID  string `json:"toolId"`
	Version int    `json:"version"`
	Name    string `json:"name"`
	SavedAt int64  `json:"savedAt"`
}

// ToolVersion is a full snapshot of a tool at a point in time.
type ToolVersion struct {
	ID      string   `json:"id"`
	ToolID  string   `json:"toolId"`
	Version int      `json:"version"`
	Name    string   `json:"name"`
	Type    ToolType `json:"type"`
	Body    string   `json:"body"`
	Desc    string   `json:"desc"`
	Params  []Param  `json:"params"`
	SavedAt int64    `json:"savedAt"`
}

// DeletedToolSummary identifies a deleted tool via its orphaned versions.
type DeletedToolSummary struct {
	ToolID       string `json:"toolId"`
	Name         string `json:"name"`
	VersionCount int    `json:"versionCount"`
	LastSavedAt  int64  `json:"lastSavedAt"`
}

// RecordVersion saves a full snapshot of the tool. The version number is
// auto-incremented (max existing version + 1, or 1 for a new tool).
func (s *Store) RecordVersion(tool Tool) error {
	var next int
	row := s.db.QueryRow(
		`SELECT COALESCE(MAX(version), 0) + 1 FROM tool_versions WHERE tool_id = ?`, tool.ID,
	)
	if err := row.Scan(&next); err != nil {
		return fmt.Errorf("compute next version: %w", err)
	}

	paramsJSON, err := json.Marshal(tool.Params)
	if err != nil {
		return fmt.Errorf("marshal params: %w", err)
	}

	_, err = s.db.Exec(
		`INSERT INTO tool_versions (id, tool_id, version, name, type, body, desc, params, saved_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		uuid.New().String(), tool.ID, next, tool.Name, tool.Type, tool.Body, tool.Desc, string(paramsJSON), time.Now().Unix(),
	)
	if err != nil {
		return fmt.Errorf("record version: %w", err)
	}
	return nil
}

// ListVersions returns all version summaries for a tool, newest first.
func (s *Store) ListVersions(toolID string) []ToolVersionSummary {
	rows, err := s.db.Query(
		`SELECT id, tool_id, version, name, saved_at
		 FROM tool_versions WHERE tool_id = ? ORDER BY version DESC`, toolID,
	)
	if err != nil {
		return []ToolVersionSummary{}
	}
	defer rows.Close()

	var list []ToolVersionSummary
	for rows.Next() {
		var v ToolVersionSummary
		if err := rows.Scan(&v.ID, &v.ToolID, &v.Version, &v.Name, &v.SavedAt); err == nil {
			list = append(list, v)
		}
	}
	if list == nil {
		return []ToolVersionSummary{}
	}
	return list
}

// GetVersion returns the full snapshot for a single version record.
func (s *Store) GetVersion(id string) (ToolVersion, error) {
	row := s.db.QueryRow(
		`SELECT id, tool_id, version, name, type, body, desc, params, saved_at
		 FROM tool_versions WHERE id = ?`, id,
	)
	var v ToolVersion
	var paramsJSON string
	if err := row.Scan(&v.ID, &v.ToolID, &v.Version, &v.Name, &v.Type, &v.Body, &v.Desc, &paramsJSON, &v.SavedAt); err != nil {
		return ToolVersion{}, fmt.Errorf("version not found: %w", err)
	}
	if err := json.Unmarshal([]byte(paramsJSON), &v.Params); err != nil {
		v.Params = []Param{}
	}
	return v, nil
}

// ListDeletedTools returns summaries for tools that have versions but no
// matching row in the tools table (i.e. they have been deleted).
func (s *Store) ListDeletedTools() []DeletedToolSummary {
	rows, err := s.db.Query(
		`SELECT tool_id, name, COUNT(*) AS vc, MAX(saved_at) AS last
		 FROM tool_versions
		 WHERE tool_id NOT IN (SELECT id FROM tools)
		 GROUP BY tool_id
		 ORDER BY last DESC`,
	)
	if err != nil {
		return []DeletedToolSummary{}
	}
	defer rows.Close()

	var list []DeletedToolSummary
	for rows.Next() {
		var d DeletedToolSummary
		if err := rows.Scan(&d.ToolID, &d.Name, &d.VersionCount, &d.LastSavedAt); err == nil {
			list = append(list, d)
		}
	}
	if list == nil {
		return []DeletedToolSummary{}
	}
	return list
}

// RestoreToolVersion updates the live tool's content to match the given version
// snapshot without recording a new version. The targeted version effectively
// becomes "current" again.
func (s *Store) RestoreToolVersion(versionID string) (Tool, error) {
	v, err := s.GetVersion(versionID)
	if err != nil {
		return Tool{}, fmt.Errorf("version not found: %w", err)
	}

	tx, err := s.db.Begin()
	if err != nil {
		return Tool{}, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		`UPDATE tools SET name=?, type=?, body=?, desc=? WHERE id=?`,
		v.Name, v.Type, v.Body, v.Desc, v.ToolID,
	)
	if err != nil {
		return Tool{}, fmt.Errorf("restore tool version: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return Tool{}, fmt.Errorf("tool not found")
	}

	if _, err := tx.Exec(`DELETE FROM params WHERE tool_id=?`, v.ToolID); err != nil {
		return Tool{}, fmt.Errorf("clear params: %w", err)
	}
	if err := insertParams(tx, v.ToolID, v.Params); err != nil {
		return Tool{}, err
	}

	if err := tx.Commit(); err != nil {
		return Tool{}, err
	}

	return Tool{ID: v.ToolID, Name: v.Name, Type: v.Type, Body: v.Body, Desc: v.Desc, Params: v.Params}, nil
}

// ClearTrash permanently deletes all orphaned tool_versions (for tools that no
// longer exist) and their associated run_history entries.
func (s *Store) ClearTrash() error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete run_history for deleted tools
	if _, err := tx.Exec(
		`DELETE FROM run_history WHERE tool_id NOT IN (SELECT id FROM tools)`,
	); err != nil {
		return fmt.Errorf("clear trash history: %w", err)
	}

	// Delete orphaned versions
	if _, err := tx.Exec(
		`DELETE FROM tool_versions WHERE tool_id NOT IN (SELECT id FROM tools)`,
	); err != nil {
		return fmt.Errorf("clear trash versions: %w", err)
	}

	return tx.Commit()
}

// ClearTrashByIDs permanently deletes versions and run history for the
// specified deleted tool IDs. Only orphaned tool IDs (not in the tools
// table) are affected, so live tools are never touched.
func (s *Store) ClearTrashByIDs(toolIDs []string) error {
	if len(toolIDs) == 0 {
		return nil
	}

	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(toolIDs)), ",")
	args := make([]any, len(toolIDs))
	for i, id := range toolIDs {
		args[i] = id
	}

	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.Exec(
		`DELETE FROM run_history WHERE tool_id IN (`+placeholders+`) AND tool_id NOT IN (SELECT id FROM tools)`,
		args...,
	); err != nil {
		return fmt.Errorf("clear trash history: %w", err)
	}

	if _, err := tx.Exec(
		`DELETE FROM tool_versions WHERE tool_id IN (`+placeholders+`) AND tool_id NOT IN (SELECT id FROM tools)`,
		args...,
	); err != nil {
		return fmt.Errorf("clear trash versions: %w", err)
	}

	return tx.Commit()
}

// RestoreDeletedTool recreates a tool from the specified version snapshot,
// reusing the original tool ID so all existing version records are re-attached.
// Returns an error if the version doesn't exist or the name is already taken.
func (s *Store) RestoreDeletedTool(versionID string) (Tool, error) {
	v, err := s.GetVersion(versionID)
	if err != nil {
		return Tool{}, fmt.Errorf("version not found: %w", err)
	}

	tool := Tool{
		ID:        v.ToolID,
		Name:      v.Name,
		Type:      v.Type,
		Body:      v.Body,
		Desc:      v.Desc,
		Params:    v.Params,
		CreatedAt: time.Now().Unix(),
	}

	tx, err := s.db.Begin()
	if err != nil {
		return Tool{}, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		`INSERT INTO tools (id, name, type, body, desc, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
		tool.ID, tool.Name, tool.Type, tool.Body, tool.Desc, tool.CreatedAt,
	)
	if err != nil {
		return Tool{}, fmt.Errorf("name already taken")
	}

	// Remove any orphaned params that may have survived if foreign key
	// cascades were not active when the tool was originally deleted.
	if _, err := tx.Exec(`DELETE FROM params WHERE tool_id = ?`, tool.ID); err != nil {
		return Tool{}, fmt.Errorf("clear orphaned params: %w", err)
	}

	if err := insertParams(tx, tool.ID, tool.Params); err != nil {
		return Tool{}, err
	}

	if err := tx.Commit(); err != nil {
		return Tool{}, err
	}

	return tool, nil
}
