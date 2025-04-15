package models

import (
	"context"
	"path/filepath"

	"github.com/nxadm/tail"
)

type LineUpdate struct {
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
	Context  context.Context
	Cancel   context.CancelFunc
}

func (w *WatchedFile) GetInfo() WatchInfo {
	return WatchInfo{
		Id:       w.Id,
		FilePath: w.FilePath,
		FileName: filepath.Base(w.FilePath),
	}
}
