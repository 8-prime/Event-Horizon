package watcher

import (
	"bufio"
	"io"
	"os"
	"sync"

	"event-horizon/internal/server"
	"event-horizon/internal/store"

	"github.com/fsnotify/fsnotify"
)

type watchState struct {
	path   string
	fileID string
	offset int64
	cancel chan struct{}
}

// Watcher watches files for appended content.
type Watcher struct {
	mu     sync.Mutex
	store  *store.Store
	fw     *fsnotify.Watcher
	states map[string]*watchState // keyed by fileID
}

// New creates a Watcher backed by fsnotify.
func New(s *store.Store) (*Watcher, error) {
	fw, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}
	w := &Watcher{
		store:  s,
		fw:     fw,
		states: make(map[string]*watchState),
	}
	go w.run()
	return w, nil
}

// WatchFile starts watching a file for new content.
// The file must already be loaded in the store.
func (w *Watcher) WatchFile(fileID, path string) error {
	// record current file size as start offset for tail
	info, err := os.Stat(path)
	if err != nil {
		return err
	}

	w.mu.Lock()
	w.states[fileID] = &watchState{
		path:   path,
		fileID: fileID,
		offset: info.Size(),
		cancel: make(chan struct{}),
	}
	w.mu.Unlock()

	return w.fw.Add(path)
}

// StopWatch removes a file from the watcher.
func (w *Watcher) StopWatch(fileID string) {
	w.mu.Lock()
	st, ok := w.states[fileID]
	if ok {
		close(st.cancel)
		delete(w.states, fileID)
		w.fw.Remove(st.path) //nolint:errcheck
	}
	w.mu.Unlock()
}

// Close shuts down the underlying fsnotify watcher.
func (w *Watcher) Close() error {
	return w.fw.Close()
}

func (w *Watcher) run() {
	for {
		select {
		case event, ok := <-w.fw.Events:
			if !ok {
				return
			}
			if event.Has(fsnotify.Write) {
				w.handleWrite(event.Name)
			}
		case _, ok := <-w.fw.Errors:
			if !ok {
				return
			}
		}
	}
}

func (w *Watcher) handleWrite(path string) {
	w.mu.Lock()
	var st *watchState
	for _, s := range w.states {
		if s.path == path {
			st = s
			break
		}
	}
	w.mu.Unlock()

	if st == nil {
		return
	}

	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	if _, err := f.Seek(st.offset, io.SeekStart); err != nil {
		return
	}

	fileIdx := w.store.FileIdx(st.fileID)
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
	var newEntries []store.Entry

	for scanner.Scan() {
		line := scanner.Text()
		id := w.store.NextFileID(st.fileID)
		if entry, ok := store.ParseCLEF(line, id, fileIdx); ok {
			newEntries = append(newEntries, entry)
		}
	}

	if len(newEntries) == 0 {
		return
	}

	w.store.AppendEntries(st.fileID, newEntries)
	for _, e := range newEntries {
		server.Broadcast(st.fileID, e)
	}

	// Update offset
	pos, err := f.Seek(0, io.SeekCurrent)
	if err == nil {
		w.mu.Lock()
		if s, ok := w.states[st.fileID]; ok {
			s.offset = pos
		}
		w.mu.Unlock()
	}
}
