package main

import (
	"context"

	"event-horizon/internal/store"
	"event-horizon/internal/watcher"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the Wails-bound struct — thin IPC surface only.
type App struct {
	ctx     context.Context
	store   *store.Store
	watcher *watcher.Watcher
}

func NewApp(s *store.Store, w *watcher.Watcher) *App {
	return &App{store: s, watcher: w}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// OpenFileDialog shows a native file picker and returns the selected path(s).
func (a *App) OpenFileDialog() []string {
	files, err := runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open Log File(s)",
		Filters: []runtime.FileFilter{
			{DisplayName: "Log files (*.log, *.clef, *.json, *.ndjson)", Pattern: "*.log;*.clef;*.json;*.ndjson"},
			{DisplayName: "All files (*.*)", Pattern: "*.*"},
		},
	})
	if err != nil || len(files) == 0 {
		return nil
	}
	return files
}

// LoadFile parses a file into the store and starts watching it.
func (a *App) LoadFile(path string) (store.FileMetadata, error) {
	meta, err := a.store.LoadFile(path)
	if err != nil {
		return store.FileMetadata{}, err
	}
	// Best-effort watch; ignore error (e.g. file removed immediately)
	a.watcher.WatchFile(meta.FileID, path) //nolint:errcheck
	return meta, nil
}

// CloseFile stops watching and removes a file from the store.
func (a *App) CloseFile(fileID string) {
	a.watcher.StopWatch(fileID)
	a.store.RemoveFile(fileID)
}

// GetPropValues returns distinct values for a property key in a file.
func (a *App) GetPropValues(fileID, key string) []string {
	return a.store.GetPropValues(fileID, key)
}
