package filter

import (
	"testing"

	"event-horizon/internal/store"
)

func makeStore(entries []store.Entry) *store.Store {
	s := store.NewStore()
	// We can't directly inject entries via LoadFile (needs a file),
	// so we use AppendEntries with a pre-registered fileID trick.
	// Instead, build a mini test by loading a temp file.
	return s
}

// testStore wraps store.Store with direct entry injection for testing.
type testStore struct {
	entries []store.Entry
}

func (ts *testStore) GetEntries(fileID string) []store.Entry {
	return ts.entries
}

// filterDirect runs the filter logic directly without a real store.
func filterDirect(entries []store.Entry, q FilterQuery) []uint32 {
	levelSet := make(map[uint8]struct{}, len(q.Levels))
	for _, l := range q.Levels {
		levelSet[l] = struct{}{}
	}
	var ids []uint32
	for _, e := range entries {
		if matchEntry(e, q, levelSet) {
			ids = append(ids, e.ID)
		}
	}
	return ids
}

var testEntries = []store.Entry{
	{ID: 1, Ts: 1000, Level: 2, Msg: "hello world", Props: map[string]any{"env": "prod", "count": float64(5)}},
	{ID: 2, Ts: 2000, Level: 4, Msg: "error occurred", Props: map[string]any{"env": "dev"}},
	{ID: 3, Ts: 3000, Level: 1, Msg: "debug info", Props: map[string]any{"env": "prod", "count": float64(10)}},
	{ID: 4, Ts: 4000, Level: 3, Msg: "warning message", Props: nil},
}

func TestFilter_Level(t *testing.T) {
	q := FilterQuery{Levels: []uint8{2, 4}}
	ids := filterDirect(testEntries, q)
	if len(ids) != 2 {
		t.Fatalf("expected 2 results, got %d", len(ids))
	}
}

func TestFilter_TimeRange(t *testing.T) {
	q := FilterQuery{TimeFrom: 1500, TimeTo: 3500}
	ids := filterDirect(testEntries, q)
	if len(ids) != 2 { // entries 2 and 3
		t.Fatalf("expected 2 results, got %d", len(ids))
	}
}

func TestFilter_FullText(t *testing.T) {
	q := FilterQuery{Query: "hello"}
	ids := filterDirect(testEntries, q)
	if len(ids) != 1 || ids[0] != 1 {
		t.Fatalf("expected [1], got %v", ids)
	}
}

func TestFilter_PropEqual(t *testing.T) {
	q := FilterQuery{PropFilters: []PropFilter{{Key: "env", Op: "=", Value: "prod"}}}
	ids := filterDirect(testEntries, q)
	if len(ids) != 2 {
		t.Fatalf("expected 2 results, got %v", ids)
	}
}

func TestFilter_PropContains(t *testing.T) {
	q := FilterQuery{PropFilters: []PropFilter{{Key: "env", Op: "contains", Value: "ro"}}}
	ids := filterDirect(testEntries, q)
	if len(ids) != 2 {
		t.Fatalf("expected 2 results, got %v", ids)
	}
}

func TestFilter_PropNumericGT(t *testing.T) {
	q := FilterQuery{PropFilters: []PropFilter{{Key: "count", Op: ">", Value: "7"}}}
	ids := filterDirect(testEntries, q)
	if len(ids) != 1 || ids[0] != 3 {
		t.Fatalf("expected [3], got %v", ids)
	}
}

func TestFilter_PropExists(t *testing.T) {
	q := FilterQuery{PropFilters: []PropFilter{{Key: "count", Op: "exists"}}}
	ids := filterDirect(testEntries, q)
	if len(ids) != 2 {
		t.Fatalf("expected 2 results, got %v", ids)
	}
}

func TestFilter_NoFilters(t *testing.T) {
	q := FilterQuery{}
	ids := filterDirect(testEntries, q)
	if len(ids) != len(testEntries) {
		t.Fatalf("expected all entries, got %d", len(ids))
	}
}
