package main

import (
	"context"
	"fmt"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/hpcloud/tail"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type FileUpdate struct {
	Id   string `json:"id"`
	Line string `json:"line"`
}

type WatchInfo struct {
	Id       string `json:"id"`
	FilePath string `json:"filePath"`
	FileName string `json:"fileName"`
}

type WatchedFile struct {
	Id       string
	FilePath string
	Tail     *tail.Tail
}

func (w *WatchedFile) GetInfo() WatchInfo {
	return WatchInfo{
		Id:       w.Id,
		FilePath: w.FilePath,
		FileName: filepath.Base(w.FilePath),
	}
}

// App struct
type App struct {
	ctx          context.Context
	watchedFiles []WatchedFile
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) SelectFile() (WatchInfo, error) {
	// Open file selection dialog

	watched := WatchedFile{
		Id: uuid.New().String(),
	}

	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select File to Tail",
	})
	watched.FilePath = file

	if err != nil {
		return watched.GetInfo(), err
	}

	go startTailing(&watched, a.ctx)
	return watched.GetInfo(), nil
}

// StartTailing begins tailing the selected file
func startTailing(watched *WatchedFile, ctx context.Context) {
	t, err := tail.TailFile(watched.FilePath, tail.Config{
		Follow: true,
		Poll:   true,
	})
	defer t.Stop()
	if err != nil {
		runtime.EventsEmit(ctx, "tail-error", err.Error())
	}

	for {
		select {
		case <-ctx.Done():
			runtime.EventsEmit(ctx, "tail-stopped", watched.Id) //Verify that viewing has stopped
			return
		case line := <-t.Lines:
			if line.Err == nil {
				runtime.EventsEmit(ctx, "read-error", watched.Id) //Show toast that reading for file had error
			}
			fmt.Println("Read new line")
			runtime.EventsEmit(ctx, "file-update", FileUpdate{
				Id:   watched.Id,
				Line: line.Text,
			})
		}
	}
}

// StopTailing stops the current file tailing operation
func (a *App) StopTailing(id string) {
	a.watchedFiles = removeByIdAndStop(a.watchedFiles, id)
}

func removeByIdAndStop(slice []WatchedFile, id string) []WatchedFile {
	for i, item := range slice {
		if item.Id == id {
			item.Tail.Stop()
			slice[i] = slice[len(slice)-1]
			return slice[:len(slice)-1]
		}
	}
	return slice
}
