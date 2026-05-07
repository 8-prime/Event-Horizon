package parser

import (
	"encoding/json"
	"strings"
	"time"
)

var systemKeys = map[string]struct{}{
	"@t": {}, "@l": {}, "@m": {}, "@mt": {}, "@x": {},
	"@i": {}, "@r": {}, "@tr": {}, "@sp": {},
}

type CLEFParser struct{}

func (CLEFParser) FormatName() string        { return "clef" }
func (CLEFParser) Flush() (ParsedLine, bool) { return ParsedLine{}, false }

func (CLEFParser) ParseLine(line string) (ParsedLine, bool) {
	line = strings.TrimSpace(line)
	if line == "" || line[0] != '{' {
		return ParsedLine{}, false
	}

	var raw map[string]json.RawMessage
	if err := json.Unmarshal([]byte(line), &raw); err != nil {
		return ParsedLine{}, false
	}

	pl := ParsedLine{}

	if v, ok := raw["@t"]; ok {
		var ts string
		if json.Unmarshal(v, &ts) == nil {
			if t, err := time.Parse(time.RFC3339Nano, ts); err == nil {
				pl.Ts = t.UnixNano()
			} else if t2, err2 := time.Parse("2006-01-02T15:04:05.9999999", ts); err2 == nil {
				pl.Ts = t2.UnixNano()
			}
		}
	}

	if v, ok := raw["@l"]; ok {
		var lvl string
		if json.Unmarshal(v, &lvl) == nil {
			pl.Level = normalizeLevel(lvl)
		}
	} else {
		pl.Level = uint8(Information)
	}

	if v, ok := raw["@m"]; ok {
		json.Unmarshal(v, &pl.Msg) //nolint:errcheck
	} else if v, ok := raw["@mt"]; ok {
		json.Unmarshal(v, &pl.Msg) //nolint:errcheck
	}

	if v, ok := raw["@x"]; ok {
		json.Unmarshal(v, &pl.Ex) //nolint:errcheck
	}

	for k, v := range raw {
		if _, sys := systemKeys[k]; sys {
			continue
		}
		if pl.Props == nil {
			pl.Props = make(map[string]any)
		}
		var val any
		if err := json.Unmarshal(v, &val); err == nil {
			pl.Props[k] = val
		}
	}

	return pl, true
}
