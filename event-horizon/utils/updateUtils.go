package utils

import (
	"context"
	"event-horizon/models"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func HandleLineChanges(ctx context.Context, updates chan models.LineUpdate) {
	lines := 0
	updatedFiles := make(map[string][]string)
	timer := time.NewTicker(1 * time.Second)
	defer timer.Stop()

	for {
		select {
		case fileUpdate := <-updates:
			updatedFiles[fileUpdate.Id] = append(updatedFiles[fileUpdate.Id], fileUpdate.Line)
			lines++
			if lines > 100 {
				runtime.EventsEmit(ctx, "file-update", updatedFiles)
				updatedFiles = make(map[string][]string)
				lines = 0
			}
			timer.Reset(100 * time.Millisecond)
		case <-timer.C:
			if lines == 0 {
				continue
			}
			runtime.EventsEmit(ctx, "file-update", updatedFiles)
			updatedFiles = make(map[string][]string)
			lines = 0
		}
	}
}
