package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"event-horizon/internal/filter"
	"event-horizon/internal/store"
)

const Port = 57321

// SSE broadcaster for live entries.
type sseBroadcaster struct {
	mu      sync.Mutex
	clients map[string][]chan store.Entry // keyed by fileID
}

var broadcaster = &sseBroadcaster{
	clients: make(map[string][]chan store.Entry),
}

func (b *sseBroadcaster) subscribe(fileID string) chan store.Entry {
	ch := make(chan store.Entry, 256)
	b.mu.Lock()
	b.clients[fileID] = append(b.clients[fileID], ch)
	b.mu.Unlock()
	return ch
}

func (b *sseBroadcaster) unsubscribe(fileID string, ch chan store.Entry) {
	b.mu.Lock()
	defer b.mu.Unlock()
	list := b.clients[fileID]
	for i, c := range list {
		if c == ch {
			b.clients[fileID] = append(list[:i], list[i+1:]...)
			break
		}
	}
	close(ch)
}

// Broadcast sends a new entry to all SSE subscribers for a file.
func Broadcast(fileID string, e store.Entry) {
	broadcaster.mu.Lock()
	defer broadcaster.mu.Unlock()
	for _, ch := range broadcaster.clients[fileID] {
		select {
		case ch <- e:
		default: // drop if slow consumer
		}
	}
}

// Start creates and starts the HTTP server. It blocks until the server stops.
func Start(s *store.Store) error {
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok")) //nolint:errcheck
	})

	// GET /stream?fileId=x  — stream all entries as NDJSON
	mux.HandleFunc("/stream", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w)
		if r.Method == http.MethodOptions {
			return
		}

		fileID := r.URL.Query().Get("fileId")
		if fileID == "" {
			http.Error(w, "missing fileId", http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "application/x-ndjson")
		entries := s.GetEntries(fileID)
		enc := json.NewEncoder(w)
		for _, e := range entries {
			if err := enc.Encode(e); err != nil {
				return
			}
		}
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
	})

	// POST /filter — filter entries, stream matching as NDJSON
	mux.HandleFunc("/filter", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w)
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "POST required", http.StatusMethodNotAllowed)
			return
		}

		var q filter.FilterQuery
		if err := json.NewDecoder(r.Body).Decode(&q); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		ids := filter.Filter(s, q)
		// Build ID set for fast lookup
		idSet := make(map[uint32]struct{}, len(ids))
		for _, id := range ids {
			idSet[id] = struct{}{}
		}

		entries := s.GetEntries(q.FileID)
		w.Header().Set("Content-Type", "application/x-ndjson")
		enc := json.NewEncoder(w)
		for _, e := range entries {
			if _, ok := idSet[e.ID]; ok {
				if err := enc.Encode(e); err != nil {
					return
				}
			}
		}
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
	})

	// GET /watch/events?fileId=x — SSE for live appended entries
	mux.HandleFunc("/watch/events", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w)
		fileID := r.URL.Query().Get("fileId")
		if fileID == "" {
			http.Error(w, "missing fileId", http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		ch := broadcaster.subscribe(fileID)
		defer broadcaster.unsubscribe(fileID, ch)

		enc := json.NewEncoder(w)
		flusher, ok := w.(http.Flusher)
		ctx := r.Context()

		for {
			select {
			case <-ctx.Done():
				return
			case e, open := <-ch:
				if !open {
					return
				}
				fmt.Fprintf(w, "data: ") //nolint:errcheck
				enc.Encode(e)            //nolint:errcheck
				fmt.Fprintf(w, "\n")     //nolint:errcheck
				if ok {
					flusher.Flush()
				}
			}
		}
	})

	addr := fmt.Sprintf("127.0.0.1:%d", Port)
	return http.ListenAndServe(addr, mux)
}

func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}
