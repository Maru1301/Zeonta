package store

import (
	"database/sql"
	"fmt"

	"github.com/google/uuid"
)

// EnvEntry is a single key-value pair within an environment set.
type EnvEntry struct {
	ID        string `json:"id"`
	Key       string `json:"key"`
	Value     string `json:"value"`
	SortOrder int    `json:"sortOrder"`
}

// Environment is a named set of key-value pairs that can be activated globally.
type Environment struct {
	ID       string     `json:"id"`
	Name     string     `json:"name"`
	IsActive bool       `json:"isActive"`
	Entries  []EnvEntry `json:"entries"`
}

// EnvironmentSummary is the lightweight version used in the sidebar.
type EnvironmentSummary struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	IsActive bool   `json:"isActive"`
}

func (s *Store) ListEnvironments() []EnvironmentSummary {
	rows, err := s.db.Query(`SELECT id, name, is_active FROM environments ORDER BY rowid ASC`)
	if err != nil {
		return []EnvironmentSummary{}
	}
	defer rows.Close()

	result := []EnvironmentSummary{}
	for rows.Next() {
		var e EnvironmentSummary
		var isActive int
		if err := rows.Scan(&e.ID, &e.Name, &isActive); err != nil {
			continue
		}
		e.IsActive = isActive == 1
		result = append(result, e)
	}
	return result
}

func (s *Store) GetEnvironment(id string) (Environment, error) {
	var e Environment
	var isActive int
	err := s.db.QueryRow(
		`SELECT id, name, is_active FROM environments WHERE id=?`, id,
	).Scan(&e.ID, &e.Name, &isActive)
	if err == sql.ErrNoRows {
		return Environment{}, fmt.Errorf("environment not found")
	}
	if err != nil {
		return Environment{}, fmt.Errorf("get environment: %w", err)
	}
	e.IsActive = isActive == 1

	e.Entries, err = s.getEnvEntries(id)
	if err != nil {
		return Environment{}, err
	}
	return e, nil
}

func (s *Store) CreateEnvironment(env Environment) (Environment, error) {
	if env.Name == "" {
		return Environment{}, fmt.Errorf("environment name is required")
	}
	env.ID = uuid.NewString()

	tx, err := s.db.Begin()
	if err != nil {
		return Environment{}, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.Exec(`INSERT INTO environments (id, name, is_active) VALUES (?, ?, 0)`, env.ID, env.Name)
	if err != nil {
		return Environment{}, fmt.Errorf("name already taken")
	}
	if err := insertEnvEntries(tx, env.ID, env.Entries); err != nil {
		return Environment{}, err
	}
	return env, tx.Commit()
}

func (s *Store) UpdateEnvironment(env Environment) (Environment, error) {
	if env.Name == "" {
		return Environment{}, fmt.Errorf("environment name is required")
	}
	tx, err := s.db.Begin()
	if err != nil {
		return Environment{}, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	res, err := tx.Exec(`UPDATE environments SET name=? WHERE id=?`, env.Name, env.ID)
	if err != nil {
		return Environment{}, fmt.Errorf("name already taken")
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return Environment{}, fmt.Errorf("environment not found")
	}

	if _, err := tx.Exec(`DELETE FROM env_entries WHERE environment_id=?`, env.ID); err != nil {
		return Environment{}, fmt.Errorf("clear entries: %w", err)
	}
	if err := insertEnvEntries(tx, env.ID, env.Entries); err != nil {
		return Environment{}, err
	}
	return env, tx.Commit()
}

func (s *Store) DeleteEnvironment(id string) error {
	res, err := s.db.Exec(`DELETE FROM environments WHERE id=?`, id)
	if err != nil {
		return fmt.Errorf("delete environment: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("environment not found")
	}
	return nil
}

// SetActiveEnvironment marks the given environment as active and deactivates all others.
// Pass an empty string to deactivate all environments.
func (s *Store) SetActiveEnvironment(id string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`UPDATE environments SET is_active=0`); err != nil {
		return fmt.Errorf("deactivate environments: %w", err)
	}
	if id != "" {
		res, err := tx.Exec(`UPDATE environments SET is_active=1 WHERE id=?`, id)
		if err != nil {
			return fmt.Errorf("set active: %w", err)
		}
		n, _ := res.RowsAffected()
		if n == 0 {
			return fmt.Errorf("environment not found")
		}
	}
	return tx.Commit()
}

// GetActiveEnvVars returns the active environment's entries as a flat key-value map.
// Returns an empty map if no environment is active.
func (s *Store) GetActiveEnvVars() map[string]string {
	rows, err := s.db.Query(
		`SELECT e.key, e.value FROM env_entries e
         JOIN environments env ON e.environment_id = env.id
         WHERE env.is_active = 1
         ORDER BY e.sort_order`,
	)
	if err != nil {
		return map[string]string{}
	}
	defer rows.Close()

	result := map[string]string{}
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			continue
		}
		result[k] = v
	}
	return result
}

func (s *Store) getEnvEntries(environmentID string) ([]EnvEntry, error) {
	rows, err := s.db.Query(
		`SELECT id, key, value, sort_order FROM env_entries WHERE environment_id=? ORDER BY sort_order`,
		environmentID,
	)
	if err != nil {
		return nil, fmt.Errorf("get env entries: %w", err)
	}
	defer rows.Close()

	entries := []EnvEntry{}
	for rows.Next() {
		var e EnvEntry
		if err := rows.Scan(&e.ID, &e.Key, &e.Value, &e.SortOrder); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func insertEnvEntries(tx *sql.Tx, environmentID string, entries []EnvEntry) error {
	for i, e := range entries {
		if e.ID == "" {
			e.ID = uuid.NewString()
		}
		_, err := tx.Exec(
			`INSERT INTO env_entries (id, environment_id, key, value, sort_order) VALUES (?, ?, ?, ?, ?)`,
			e.ID, environmentID, e.Key, e.Value, i,
		)
		if err != nil {
			return fmt.Errorf("insert env entry: %w", err)
		}
	}
	return nil
}
