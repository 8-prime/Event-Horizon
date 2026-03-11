package store

import (
	"encoding/json"
	"strings"
	"time"
)

// Entry represents a single parsed CLEF log entry.
type Entry struct {
	ID      uint32         `json:"id"`
	Ts      int64          `json:"ts"`   // unix nanoseconds
	Level   uint8          `json:"lvl"`  // 0=Trace 1=Debug 2=Info 3=Warn 4=Error 5=Fatal
	Msg     string         `json:"msg"`
	Ex      string         `json:"ex,omitempty"`
	Props   map[string]any `json:"props,omitempty"`
	FileIdx uint8          `json:"fileIdx"`
}

// raw keys used by CLEF compact format
var systemKeys = map[string]struct{}{
	"@t": {}, "@l": {}, "@m": {}, "@mt": {}, "@x": {},
	"@i": {}, "@r": {}, "@tr": {}, "@sp": {},
}

// ParseCLEF parses a single NDJSON line in compact CLEF format.
// id and fileIdx are assigned by the caller.
func ParseCLEF(line string, id uint32, fileIdx uint8) (Entry, bool) {
	line = strings.TrimSpace(line)
	if line == "" || line[0] != '{' {
		return Entry{}, false
	}

	var raw map[string]json.RawMessage
	if err := json.Unmarshal([]byte(line), &raw); err != nil {
		return Entry{}, false
	}

	e := Entry{
		ID:      id,
		FileIdx: fileIdx,
	}

	// Timestamp
	if v, ok := raw["@t"]; ok {
		var ts string
		if json.Unmarshal(v, &ts) == nil {
			if t, err := time.Parse(time.RFC3339Nano, ts); err == nil {
				e.Ts = t.UnixNano()
			} else if t2, err2 := time.Parse("2006-01-02T15:04:05.9999999", ts); err2 == nil {
				e.Ts = t2.UnixNano()
			}
		}
	}

	// Level
	if v, ok := raw["@l"]; ok {
		var lvl string
		if json.Unmarshal(v, &lvl) == nil {
			e.Level = normalizeLevel(lvl)
		}
	}

	// Message: prefer @m (rendered), fall back to @mt (template)
	if v, ok := raw["@m"]; ok {
		json.Unmarshal(v, &e.Msg) //nolint:errcheck
	} else if v, ok := raw["@mt"]; ok {
		json.Unmarshal(v, &e.Msg) //nolint:errcheck
	}

	// Exception
	if v, ok := raw["@x"]; ok {
		json.Unmarshal(v, &e.Ex) //nolint:errcheck
	}

	// Remaining keys → Props
	for k, v := range raw {
		if _, sys := systemKeys[k]; sys {
			continue
		}
		if e.Props == nil {
			e.Props = make(map[string]any)
		}
		var val any
		if err := json.Unmarshal(v, &val); err == nil {
			e.Props[k] = val
		}
	}

	return e, true
}

func normalizeLevel(s string) uint8 {
	switch strings.ToLower(s) {
	case "verbose", "trace":
		return 0
	case "debug":
		return 1
	case "info", "information":
		return 2
	case "warn", "warning":
		return 3
	case "error":
		return 4
	case "fatal", "critical":
		return 5
	default:
		return 2 // default to Info
	}
}
