package parser

import (
	"bufio"
	"os"
	"strings"
)

type Level uint8

const (
	Trace Level = iota
	Debug
	Information
	Warning
	Error
	Fatal
)

// ParsedLine is the format-agnostic result of parsing a single log line.
type ParsedLine struct {
	Ts    int64
	Level uint8
	Msg   string
	Ex    string
	Props map[string]any
}

// Parser parses individual log lines for a specific log format.
type Parser interface {
	ParseLine(line string) (ParsedLine, bool)
	Flush() (ParsedLine, bool) // emit any buffered entry at end-of-input
	FormatName() string        // e.g. "clef", "log4x"
}

type unknownParser struct{}

func (unknownParser) ParseLine(_ string) (ParsedLine, bool) { return ParsedLine{}, false }
func (unknownParser) Flush() (ParsedLine, bool)             { return ParsedLine{}, false }
func (unknownParser) FormatName() string                    { return "unknown" }

// Detect samples up to 20 non-empty lines from the file and returns the
// best-matching Parser. Returns an unknownParser if no format reaches 50%.
func Detect(path string) (Parser, error) {
	f, err := os.Open(path)
	if err != nil {
		return unknownParser{}, err
	}
	defer f.Close()

	var lines []string
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
	for scanner.Scan() && len(lines) < 50 {
		line := scanner.Text()
		if line != "" {
			lines = append(lines, line)
		}
	}
	if err := scanner.Err(); err != nil {
		return unknownParser{}, err
	}

	if len(lines) == 0 {
		return unknownParser{}, nil
	}

	candidates := []Parser{CLEFParser{}}
	if lp := newLog4xParserFromLines(lines); lp != nil {
		candidates = append(candidates, lp)
	}

	best := Parser(unknownParser{})
	bestScore := 0

	for _, p := range candidates {
		hits := 0
		evaluated := 0
		for _, line := range lines {
			if len(line) > 0 && (line[0] == ' ' || line[0] == '\t') {
				continue
			}
			evaluated++
			if _, ok := p.ParseLine(line); ok {
				hits++
			}
		}
		if _, ok := p.Flush(); ok {
			hits++
		}
		if hits > bestScore && hits*2 >= evaluated {
			bestScore = hits
			best = p
		}
	}

	// Return a fresh (stateless) Log4xParser so scoring residue doesn't leak.
	if winner, ok := best.(*Log4xParser); ok {
		return &Log4xParser{pattern: winner.pattern}, nil
	}

	return best, nil
}

func normalizeLevel(s string) uint8 {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "verbose", "trace":
		return uint8(Trace)
	case "debug":
		return uint8(Debug)
	case "info", "information":
		return uint8(Information)
	case "warn", "warning":
		return uint8(Warning)
	case "error":
		return uint8(Error)
	case "fatal", "critical":
		return uint8(Fatal)
	default:
		return uint8(Information)
	}
}
