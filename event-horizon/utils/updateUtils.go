package utils

import (
	"context"
	"event-horizon/models"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func HandleLineChanges(ctx context.Context, updates chan models.FileUpdate) {
	var updatedFiles []models.FileUpdate
	timer := time.NewTicker(1 * time.Second)
	defer timer.Stop()

	for {
		select {
		case newLine := <-updates:
			updatedFiles = append(updatedFiles, newLine)
		case <-timer.C:
			for _, v := range updatedFiles {
				runtime.EventsEmit(ctx, "file-update", v)
			}
			updatedFiles = nil
		}
	}
}
