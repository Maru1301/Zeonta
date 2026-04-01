package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
}

const schema = `
CREATE TABLE IF NOT EXISTS tools (
    id         TEXT    PRIMARY KEY,
    name       TEXT    UNIQUE NOT NULL,
    type       TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    desc       TEXT    NOT NULL DEFAULT '' CHECK(length(desc) <= 300),
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS params (
    id          TEXT    PRIMARY KEY,
    tool_id     TEXT    NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    default_val TEXT    NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS environments (
    id        TEXT    PRIMARY KEY,
    name      TEXT    UNIQUE NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS env_entries (
    id             TEXT    PRIMARY KEY,
    environment_id TEXT    NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    key            TEXT    NOT NULL,
    value          TEXT    NOT NULL DEFAULT '',
    sort_order     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tool_versions (
    id       TEXT    PRIMARY KEY,
    tool_id  TEXT    NOT NULL,
    version  INTEGER NOT NULL,
    name     TEXT    NOT NULL,
    type     TEXT    NOT NULL,
    body     TEXT    NOT NULL,
    desc     TEXT    NOT NULL DEFAULT '',
    params   TEXT    NOT NULL DEFAULT '[]',
    saved_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS run_history (
    id        TEXT    PRIMARY KEY,
    tool_id   TEXT    NOT NULL,
    tool_name TEXT    NOT NULL,
    ran_at    INTEGER NOT NULL,
    exit_code INTEGER NOT NULL,
    output    TEXT    NOT NULL DEFAULT '',
    error     TEXT    NOT NULL DEFAULT ''
);

PRAGMA foreign_keys = ON;
`

func Open(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return nil, fmt.Errorf("create data directory: %w", err)
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	// SQLite foreign key enforcement is per-connection. Use a single connection
	// so the pragma persists for the lifetime of the store.
	db.SetMaxOpenConns(1)

	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		db.Close()
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}

	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	// Additive migrations — errors are ignored when the column already exists.
	_, _ = db.Exec(`ALTER TABLE run_history ADD COLUMN version_id TEXT NOT NULL DEFAULT ''`)

	// Data migrations — idempotent; safe to run on every startup.
	_, _ = db.Exec(`UPDATE tools SET type = 'powershell' WHERE type = 'shell'`)
	_, _ = db.Exec(`UPDATE tool_versions SET type = 'powershell' WHERE type = 'shell'`)

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}
