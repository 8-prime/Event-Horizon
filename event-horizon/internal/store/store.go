package store

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"

	"event-horizon/internal/parser"
)

// FileMetadata is returned to the frontend after loading a file.
type FileMetadata struct {
	FileID       string   `json:"fileId"`
	Name         string   `json:"name"`
	TotalEntries int      `json:"totalEntries"`
	PropKeys     []string `json:"propKeys"`
	TimeExtent   [2]int64 `json:"timeExtent"` // [minTs, maxTs] unix nanoseconds
}

type file struct {
	mu       sync.RWMutex
	counter  atomic.Uint32
	fileID   string
	path     string
	name     string
	entries  []Entry
	propKeys map[string]struct{}
	parser   parser.Parser
}

func (f *file) nextID() uint32 {
	return f.counter.Add(1)
}

// Store holds all loaded log files.
type Store struct {
	mu    sync.RWMutex
	files map[string]*file
}

func NewStore() *Store {
	return &Store{files: make(map[string]*file)}
}

// LoadFile reads and parses a log file, adding it to the store.
func (s *Store) LoadFile(path string) (FileMetadata, error) {
	name := filepath.Base(path)
	fileID := fmt.Sprintf("%s-%s", name, path) // stable ID based on path

	p, err := parser.Detect(path)
	if err != nil {
		return FileMetadata{}, err
	}

	f, err := os.Open(path)
	if err != nil {
		return FileMetadata{}, err
	}
	defer f.Close()

	fl := &file{
		fileID:   fileID,
		path:     path,
		name:     name,
		propKeys: make(map[string]struct{}),
		parser:   p,
	}

	// Use file index based on store size for FileIdx (capped at 255)
	s.mu.RLock()
	idx := uint8(len(s.files))
	s.mu.RUnlock()

	appendEntry := func(pl parser.ParsedLine) {
		entry := Entry{ID: fl.nextID(), FileIdx: idx, Ts: pl.Ts, Level: pl.Level, Msg: pl.Msg, Ex: pl.Ex, Props: pl.Props}
		for k := range entry.Props {
			fl.propKeys[k] = struct{}{}
		}
		fl.entries = append(fl.entries, entry)
	}

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		if pl, ok := fl.parser.ParseLine(line); ok {
			appendEntry(pl)
		}
	}
	if err := scanner.Err(); err != nil {
		return FileMetadata{}, err
	}
	if pl, ok := fl.parser.Flush(); ok {
		appendEntry(pl)
	}

	s.mu.Lock()
	s.files[fileID] = fl
	s.mu.Unlock()

	return buildMetadata(fl), nil
}

// ParseLine parses a log line using the parser associated with the given file.
func (s *Store) ParseLine(fileID, line string, id uint32, fileIdx uint8) (Entry, bool) {
	s.mu.RLock()
	fl, ok := s.files[fileID]
	s.mu.RUnlock()
	if !ok {
		return Entry{}, false
	}
	pl, ok := fl.parser.ParseLine(line)
	if !ok {
		return Entry{}, false
	}
	return Entry{
		ID:      id,
		FileIdx: fileIdx,
		Ts:      pl.Ts,
		Level:   pl.Level,
		Msg:     pl.Msg,
		Ex:      pl.Ex,
		Props:   pl.Props,
	}, true
}

// FlushParser drains any pending buffered entry from the file's parser.
// Used after watcher write batches to ensure the last entry is emitted when needed.
func (s *Store) FlushParser(fileID string, fileIdx uint8) (Entry, bool) {
	s.mu.RLock()
	fl, ok := s.files[fileID]
	s.mu.RUnlock()
	if !ok {
		return Entry{}, false
	}
	pl, ok := fl.parser.Flush()
	if !ok {
		return Entry{}, false
	}
	return Entry{
		ID:      fl.nextID(),
		FileIdx: fileIdx,
		Ts:      pl.Ts,
		Level:   pl.Level,
		Msg:     pl.Msg,
		Ex:      pl.Ex,
		Props:   pl.Props,
	}, true
}

// AppendEntries adds new entries to an existing file.
func (s *Store) AppendEntries(fileID string, entries []Entry) {
	s.mu.RLock()
	fl, ok := s.files[fileID]
	s.mu.RUnlock()
	if !ok {
		return
	}

	fl.mu.Lock()
	for _, e := range entries {
		for k := range e.Props {
			fl.propKeys[k] = struct{}{}
		}
		fl.entries = append(fl.entries, e)
	}
	fl.mu.Unlock()
}

// GetEntries returns a snapshot of entries for the given file.
func (s *Store) GetEntries(fileID string) []Entry {
	s.mu.RLock()
	fl, ok := s.files[fileID]
	s.mu.RUnlock()
	if !ok {
		return nil
	}

	fl.mu.RLock()
	out := make([]Entry, len(fl.entries))
	copy(out, fl.entries)
	fl.mu.RUnlock()
	return out
}

// GetPropValues returns distinct string values for a property key.
func (s *Store) GetPropValues(fileID, key string) []string {
	entries := s.GetEntries(fileID)
	seen := make(map[string]struct{})
	var out []string
	for _, e := range entries {
		if v, ok := e.Props[key]; ok {
			str := fmt.Sprintf("%v", v)
			if _, exists := seen[str]; !exists {
				seen[str] = struct{}{}
				out = append(out, str)
			}
		}
	}
	return out
}

// RemoveFile removes a file from the store.
func (s *Store) RemoveFile(fileID string) {
	s.mu.Lock()
	delete(s.files, fileID)
	s.mu.Unlock()
}

// NextFileID returns the next entry ID for a specific file.
func (s *Store) NextFileID(fileID string) uint32 {
	s.mu.RLock()
	fl, ok := s.files[fileID]
	s.mu.RUnlock()
	if !ok {
		return 0
	}
	return fl.nextID()
}

// FileIdx returns the idx for a fileID (0 if not found).
func (s *Store) FileIdx(fileID string) uint8 {
	s.mu.RLock()
	fl, ok := s.files[fileID]
	s.mu.RUnlock()
	if !ok {
		return 0
	}
	fl.mu.RLock()
	defer fl.mu.RUnlock()
	if len(fl.entries) > 0 {
		return fl.entries[0].FileIdx
	}
	return 0
}

func buildMetadata(fl *file) FileMetadata {
	fl.mu.RLock()
	defer fl.mu.RUnlock()

	keys := make([]string, 0, len(fl.propKeys))
	for k := range fl.propKeys {
		keys = append(keys, k)
	}

	var minTs, maxTs int64
	for i, e := range fl.entries {
		if i == 0 {
			minTs, maxTs = e.Ts, e.Ts
		} else {
			if e.Ts < minTs {
				minTs = e.Ts
			}
			if e.Ts > maxTs {
				maxTs = e.Ts
			}
		}
	}

	return FileMetadata{
		FileID:       fl.fileID,
		Name:         fl.name,
		TotalEntries: len(fl.entries),
		PropKeys:     keys,
		TimeExtent:   [2]int64{minTs, maxTs},
	}
}
