package main

import (
	"embed"
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"zeonta/internal/store"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	configDir, err := os.UserConfigDir()
	if err != nil {
		log.Fatalf("cannot determine config dir: %v", err)
	}
	dbPath := filepath.Join(configDir, "Zeonta", "zeonta.db")

	s, err := store.Open(dbPath)
	if err != nil {
		log.Fatalf("cannot open database: %v", err)
	}
	defer s.Close()

	app := NewApp(s)

	err = wails.Run(&options.App{
		Title:  "Zeonta",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 26, G: 26, B: 26, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatalf("wails run: %v", err)
	}
}
