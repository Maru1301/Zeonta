package store

import (
	"testing"
)

func TestCreateAndGetEnvironment(t *testing.T) {
	s := openTestStore(t)

	env := Environment{
		Name: "Dev",
		Entries: []EnvEntry{
			{Key: "BASE_URL", Value: "http://localhost:3000"},
		},
	}
	created, err := s.CreateEnvironment(env)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if created.ID == "" {
		t.Fatal("expected ID to be assigned")
	}

	got, err := s.GetEnvironment(created.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Name != "Dev" {
		t.Errorf("name: got %q, want %q", got.Name, "Dev")
	}
	if len(got.Entries) != 1 || got.Entries[0].Key != "BASE_URL" {
		t.Errorf("entries mismatch: %+v", got.Entries)
	}
}

func TestCreateEnvironment_DuplicateName(t *testing.T) {
	s := openTestStore(t)
	if _, err := s.CreateEnvironment(Environment{Name: "Dev"}); err != nil {
		t.Fatalf("first create: %v", err)
	}
	if _, err := s.CreateEnvironment(Environment{Name: "Dev"}); err == nil {
		t.Fatal("expected error on duplicate name")
	}
}

func TestCreateEnvironment_EmptyName(t *testing.T) {
	s := openTestStore(t)
	if _, err := s.CreateEnvironment(Environment{}); err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestListEnvironments(t *testing.T) {
	s := openTestStore(t)
	s.CreateEnvironment(Environment{Name: "Dev"})
	s.CreateEnvironment(Environment{Name: "Prod"})

	list := s.ListEnvironments()
	if len(list) != 2 {
		t.Fatalf("expected 2 environments, got %d", len(list))
	}
}

func TestUpdateEnvironment(t *testing.T) {
	s := openTestStore(t)
	created, _ := s.CreateEnvironment(Environment{
		Name:    "Dev",
		Entries: []EnvEntry{{Key: "A", Value: "1"}},
	})

	created.Name = "Development"
	created.Entries = []EnvEntry{{Key: "A", Value: "2"}, {Key: "B", Value: "3"}}
	_, err := s.UpdateEnvironment(created)
	if err != nil {
		t.Fatalf("update: %v", err)
	}

	got, _ := s.GetEnvironment(created.ID)
	if got.Name != "Development" {
		t.Errorf("name not updated: %q", got.Name)
	}
	if len(got.Entries) != 2 {
		t.Errorf("expected 2 entries, got %d", len(got.Entries))
	}
}

func TestDeleteEnvironment(t *testing.T) {
	s := openTestStore(t)
	created, _ := s.CreateEnvironment(Environment{Name: "Dev"})

	if err := s.DeleteEnvironment(created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, err := s.GetEnvironment(created.ID); err == nil {
		t.Fatal("expected error after deletion")
	}
}

func TestSetActiveEnvironment(t *testing.T) {
	s := openTestStore(t)
	dev, _ := s.CreateEnvironment(Environment{Name: "Dev"})
	prod, _ := s.CreateEnvironment(Environment{Name: "Prod"})

	if err := s.SetActiveEnvironment(dev.ID); err != nil {
		t.Fatalf("set active: %v", err)
	}
	list := s.ListEnvironments()
	for _, e := range list {
		if e.ID == dev.ID && !e.IsActive {
			t.Error("Dev should be active")
		}
		if e.ID == prod.ID && e.IsActive {
			t.Error("Prod should not be active")
		}
	}

	// Switch to Prod
	s.SetActiveEnvironment(prod.ID)
	list = s.ListEnvironments()
	for _, e := range list {
		if e.ID == dev.ID && e.IsActive {
			t.Error("Dev should no longer be active")
		}
		if e.ID == prod.ID && !e.IsActive {
			t.Error("Prod should now be active")
		}
	}
}

func TestSetActiveEnvironment_Deactivate(t *testing.T) {
	s := openTestStore(t)
	created, _ := s.CreateEnvironment(Environment{Name: "Dev"})
	s.SetActiveEnvironment(created.ID)

	if err := s.SetActiveEnvironment(""); err != nil {
		t.Fatalf("deactivate all: %v", err)
	}
	list := s.ListEnvironments()
	for _, e := range list {
		if e.IsActive {
			t.Errorf("expected no active environment, but %q is active", e.Name)
		}
	}
}

func TestGetActiveEnvVars(t *testing.T) {
	s := openTestStore(t)
	dev, _ := s.CreateEnvironment(Environment{
		Name: "Dev",
		Entries: []EnvEntry{
			{Key: "BASE_URL", Value: "http://localhost"},
			{Key: "API_KEY", Value: "dev-key"},
		},
	})

	// No active env → empty map
	vars := s.GetActiveEnvVars()
	if len(vars) != 0 {
		t.Errorf("expected empty map with no active env, got %v", vars)
	}

	s.SetActiveEnvironment(dev.ID)
	vars = s.GetActiveEnvVars()
	if vars["BASE_URL"] != "http://localhost" {
		t.Errorf("BASE_URL: got %q", vars["BASE_URL"])
	}
	if vars["API_KEY"] != "dev-key" {
		t.Errorf("API_KEY: got %q", vars["API_KEY"])
	}
}

func TestGetEnvironment_EntriesNotNil(t *testing.T) {
	s := openTestStore(t)
	created, _ := s.CreateEnvironment(Environment{Name: "Empty"})
	got, _ := s.GetEnvironment(created.ID)
	if got.Entries == nil {
		t.Error("Entries should be empty slice, not nil")
	}
}
