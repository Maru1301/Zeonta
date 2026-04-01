package store

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// ToolType identifies the runtime used to execute the tool body.
type ToolType string

const (
	ToolTypePowerShell  ToolType = "powershell"
	ToolTypeCmd         ToolType = "cmd"
	ToolTypeBash        ToolType = "bash"
	ToolTypeAppleScript ToolType = "applescript"
	ToolTypePython      ToolType = "python"
	ToolTypeGo          ToolType = "go"
)

// Param is a named input filled by the user before running a tool.
type Param struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	DefaultVal string `json:"default"`
	SortOrder  int    `json:"sortOrder"`
}

// Tool is the complete definition of a user-created runnable unit.
type Tool struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Type      ToolType `json:"type"`
	Body      string   `json:"body"`
	Desc      string   `json:"desc"`
	Params    []Param  `json:"params"`
	CreatedAt int64    `json:"createdAt"`
}

// ToolSummary is the lightweight version used in the sidebar list.
type ToolSummary struct {
	ID   string   `json:"id"`
	Name string   `json:"name"`
	Type ToolType `json:"type"`
	Desc string   `json:"desc"`
}

func (s *Store) ListTools() []ToolSummary {
	rows, err := s.db.Query(`SELECT id, name, type, desc FROM tools ORDER BY created_at ASC`)
	if err != nil {
		return []ToolSummary{}
	}
	defer rows.Close()

	var summaries []ToolSummary
	for rows.Next() {
		var t ToolSummary
		if err := rows.Scan(&t.ID, &t.Name, &t.Type, &t.Desc); err != nil {
			continue
		}
		summaries = append(summaries, t)
	}
	if summaries == nil {
		return []ToolSummary{}
	}
	return summaries
}

func (s *Store) GetTool(id string) (Tool, error) {
	var t Tool
	err := s.db.QueryRow(
		`SELECT id, name, type, body, desc, created_at FROM tools WHERE id = ?`, id,
	).Scan(&t.ID, &t.Name, &t.Type, &t.Body, &t.Desc, &t.CreatedAt)
	if err == sql.ErrNoRows {
		return Tool{}, fmt.Errorf("tool not found")
	}
	if err != nil {
		return Tool{}, fmt.Errorf("get tool: %w", err)
	}

	t.Params, err = s.getParams(id)
	if err != nil {
		return Tool{}, err
	}
	return t, nil
}

func (s *Store) CreateTool(tool Tool) (Tool, error) {
	if tool.Name == "" {
		return Tool{}, fmt.Errorf("tool name is required")
	}
	if len([]rune(tool.Desc)) > 300 {
		return Tool{}, fmt.Errorf("description must be 300 characters or fewer")
	}
	tool.ID = uuid.NewString()
	tool.CreatedAt = time.Now().Unix()

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

	if err := insertParams(tx, tool.ID, tool.Params); err != nil {
		return Tool{}, err
	}

	if err := tx.Commit(); err != nil {
		return Tool{}, err
	}

	_ = s.RecordVersion(tool)
	return tool, nil
}

func (s *Store) UpdateTool(tool Tool) (Tool, error) {
	if len([]rune(tool.Desc)) > 300 {
		return Tool{}, fmt.Errorf("description must be 300 characters or fewer")
	}
	tx, err := s.db.Begin()
	if err != nil {
		return Tool{}, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		`UPDATE tools SET name=?, type=?, body=?, desc=? WHERE id=?`,
		tool.Name, tool.Type, tool.Body, tool.Desc, tool.ID,
	)
	if err != nil {
		return Tool{}, fmt.Errorf("name already taken")
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return Tool{}, fmt.Errorf("tool not found")
	}

	if _, err := tx.Exec(`DELETE FROM params WHERE tool_id=?`, tool.ID); err != nil {
		return Tool{}, fmt.Errorf("clear params: %w", err)
	}

	if err := insertParams(tx, tool.ID, tool.Params); err != nil {
		return Tool{}, err
	}

	if err := tx.Commit(); err != nil {
		return Tool{}, err
	}

	_ = s.RecordVersion(tool)
	return tool, nil
}

func (s *Store) DeleteTool(id string) error {
	res, err := s.db.Exec(`DELETE FROM tools WHERE id=?`, id)
	if err != nil {
		return fmt.Errorf("delete tool: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("tool not found")
	}
	return nil
}

// helpers

func (s *Store) getParams(toolID string) ([]Param, error) {
	rows, err := s.db.Query(
		`SELECT id, name, default_val, sort_order FROM params WHERE tool_id=? ORDER BY sort_order`, toolID,
	)
	if err != nil {
		return nil, fmt.Errorf("get params: %w", err)
	}
	defer rows.Close()

	params := []Param{}
	for rows.Next() {
		var p Param
		if err := rows.Scan(&p.ID, &p.Name, &p.DefaultVal, &p.SortOrder); err != nil {
			return nil, err
		}
		params = append(params, p)
	}
	return params, nil
}

func insertParams(tx *sql.Tx, toolID string, params []Param) error {
	for i, p := range params {
		if p.ID == "" {
			p.ID = uuid.NewString()
		}
		_, err := tx.Exec(
			`INSERT INTO params (id, tool_id, name, default_val, sort_order) VALUES (?, ?, ?, ?, ?)`,
			p.ID, toolID, p.Name, p.DefaultVal, i,
		)
		if err != nil {
			return fmt.Errorf("insert param: %w", err)
		}
	}
	return nil
}
