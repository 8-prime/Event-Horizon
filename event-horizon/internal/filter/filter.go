package filter

import (
	"fmt"
	"strconv"
	"strings"

	"event-horizon/internal/store"
)

// PropFilter defines a filter on a single property.
type PropFilter struct {
	Key   string `json:"key"`
	Op    string `json:"op"`   // "=" "!=" "contains" "!contains" ">" "<" "exists"
	Value string `json:"value"`
}

// FilterQuery specifies filtering criteria against a loaded file.
type FilterQuery struct {
	FileID      string       `json:"fileId"`
	Levels      []uint8      `json:"levels,omitempty"`
	TimeFrom    int64        `json:"timeFrom,omitempty"` // unix nanoseconds; 0 = no bound
	TimeTo      int64        `json:"timeTo,omitempty"`
	PropFilters []PropFilter `json:"propFilters,omitempty"`
	Query       string       `json:"query,omitempty"` // full-text on Msg
}

// Filter returns the IDs of entries matching the query.
func Filter(s *store.Store, q FilterQuery) []uint32 {
	entries := s.GetEntries(q.FileID)

	levelSet := make(map[uint8]struct{}, len(q.Levels))
	for _, l := range q.Levels {
		levelSet[l] = struct{}{}
	}

	var ids []uint32
	for _, e := range entries {
		if !matchEntry(e, q, levelSet) {
			continue
		}
		ids = append(ids, e.ID)
	}
	return ids
}

func matchEntry(e store.Entry, q FilterQuery, levelSet map[uint8]struct{}) bool {
	// Level filter
	if len(levelSet) > 0 {
		if _, ok := levelSet[e.Level]; !ok {
			return false
		}
	}

	// Time range
	if q.TimeFrom > 0 && e.Ts < q.TimeFrom {
		return false
	}
	if q.TimeTo > 0 && e.Ts > q.TimeTo {
		return false
	}

	// Full-text query
	if q.Query != "" {
		if !strings.Contains(strings.ToLower(e.Msg), strings.ToLower(q.Query)) {
			return false
		}
	}

	// Property filters
	for _, pf := range q.PropFilters {
		if !matchProp(e, pf) {
			return false
		}
	}

	return true
}

func matchProp(e store.Entry, pf PropFilter) bool {
	val, exists := e.Props[pf.Key]

	switch pf.Op {
	case "exists":
		return exists
	case "!exists":
		return !exists
	}

	if !exists {
		return false
	}

	strVal := fmt.Sprintf("%v", val)

	switch pf.Op {
	case "=":
		return strVal == pf.Value
	case "!=":
		return strVal != pf.Value
	case "contains":
		return strings.Contains(strings.ToLower(strVal), strings.ToLower(pf.Value))
	case "!contains":
		return !strings.Contains(strings.ToLower(strVal), strings.ToLower(pf.Value))
	case ">":
		return compareNumeric(strVal, pf.Value) > 0
	case "<":
		return compareNumeric(strVal, pf.Value) < 0
	}

	return false
}

func compareNumeric(a, b string) int {
	fa, errA := strconv.ParseFloat(a, 64)
	fb, errB := strconv.ParseFloat(b, 64)
	if errA != nil || errB != nil {
		return strings.Compare(a, b)
	}
	if fa < fb {
		return -1
	}
	if fa > fb {
		return 1
	}
	return 0
}
