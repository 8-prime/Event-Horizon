package models

import (
	"path/filepath"

	"github.com/hpcloud/tail"
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
