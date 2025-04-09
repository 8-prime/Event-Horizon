package main

import (
	"event-horizon/models"
	"event-horizon/utils"
	"fmt"

	"context"

	"github.com/google/uuid"
	"github.com/nxadm/tail"
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
	if err != nil {
		return watched.GetInfo(), err
	}
	watched.FilePath = file

	t, err := tail.TailFile(watched.FilePath, tail.Config{
		Follow: true,
		Poll:   true,
	})
	if err != nil {
		return watched.GetInfo(), err
	}

	watched.Tail = t
	watched.Context, watched.Cancel = context.WithCancel(a.ctx)
	a.watchedFiles = append(a.watchedFiles, watched)
	go startTailing(&watched, a.ctx)
	return watched.GetInfo(), nil
}

// StartTailing begins tailing the selected file
func startTailing(watched *models.WatchedFile, ctx context.Context) {
	// defer watched.Tail.Stop()
	for {
		select {
		case <-watched.Context.Done():
			runtime.EventsEmit(
				watched.Context,
				"tail-stopped",
				watched.Id,
			) // Verify that viewing has stopped
			return
		case <-ctx.Done():
			runtime.EventsEmit(ctx, "tail-stopped", watched.Id) //Verify that viewing has stopped
			return
		case line := <-watched.Tail.Lines:
			if line.Err == nil {
				runtime.EventsEmit(ctx, "read-error", watched.Id) //Show toast that reading for file had error
			}
			fmt.Println("Read new line")
			runtime.EventsEmit(ctx, "file-update", models.FileUpdate{
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

func removeByIdAndStop(slice []models.WatchedFile, id string) []models.WatchedFile {
	for i, item := range slice {
		if item.Id == id {
			item.Cancel()
			err := item.Tail.Stop()
			if err != nil {
				fmt.Println("Error stopping tail")
			}
			slice[i] = slice[len(slice)-1]
			return slice[:len(slice)-1]
		}
	}
	return slice
}
