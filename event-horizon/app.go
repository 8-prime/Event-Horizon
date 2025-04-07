package main

import (
	"event-horizon/models"
	"event-horizon/utils"
	"fmt"

	"context"

	"github.com/google/uuid"
	"github.com/hpcloud/tail"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx            context.Context
	watchedFiles   []models.WatchedFile
	updatesChannel chan models.FileUpdate
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.updatesChannel = make(chan models.FileUpdate)

	go utils.HandleLineChanges(a.ctx, a.updatesChannel)
}

func (a *App) SelectFile() (models.WatchInfo, error) {
	watched := models.WatchedFile{
		Id: uuid.New().String(),
	}

	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select File to Tail",
	})
	watched.FilePath = file

	if err != nil {
		return watched.GetInfo(), err
	}

	go startTailing(a, &watched)
	a.watchedFiles = append(a.watchedFiles, watched)
	return watched.GetInfo(), nil
}

// StartTailing begins tailing the selected file
func startTailing(a *App, watched *models.WatchedFile) {
	t, err := tail.TailFile(watched.FilePath, tail.Config{
		Follow: true,
		Poll:   true,
	})
	defer t.Stop()
	if err != nil {
		runtime.EventsEmit(a.ctx, "tail-error", err.Error())
	}

	for {
		select {
		case <-a.ctx.Done():
			runtime.EventsEmit(a.ctx, "tail-stopped", watched.Id) //Verify that viewing has stopped
			return
		case line := <-t.Lines:
			if line.Err == nil {
				runtime.EventsEmit(a.ctx, "read-error", watched.Id) //Show toast that reading for file had error
			}
			a.updatesChannel <- models.FileUpdate{
				Id:   watched.Id,
				Line: line.Text,
			}
		}
	}
}

// StopTailing stops the current file tailing operation
func (a *App) StopTailing(id string) {
	fmt.Print("called to stop trailing")
	// a.watchedFiles = removeByIdAndStop(a.watchedFiles, id)
}

func removeByIdAndStop(slice []models.WatchedFile, id string) []models.WatchedFile {
	for i, item := range slice {
		if item.Id == id {
			item.Tail.Stop()
			slice[i] = slice[len(slice)-1]
			return slice[:len(slice)-1]
		}
	}
	return slice
}
