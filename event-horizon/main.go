package main

import (
	"embed"
	"fmt"
	"net/http"
	"time"

	"event-horizon/internal/server"
	"event-horizon/internal/store"
	"event-horizon/internal/watcher"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	s := store.NewStore()

	w, err := watcher.New(s)
	if err != nil {
		println("Error creating watcher:", err.Error())
		return
	}
	defer w.Close()

	// Start HTTP server in background
	go func() {
		if err := server.Start(s); err != nil {
			fmt.Println("HTTP server error:", err)
		}
	}()

	// Wait for /healthz to be ready (up to 5s)
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		resp, err := http.Get(fmt.Sprintf("http://127.0.0.1:%d/healthz", server.Port))
		if err == nil {
			resp.Body.Close()
			break
		}
		time.Sleep(50 * time.Millisecond)
	}

	app := NewApp(s, w)

	err = wails.Run(&options.App{
		Title:  "Event Horizon",
		Width:  1400,
		Height: 900,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 8, G: 8, B: 8, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
