package parser

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

// Log4xPattern holds a known log4x PatternLayout format and its compiled regex.
type Log4xPattern struct {
	FormatString string
	re           *regexp.Regexp
	tsLayout     string
	commaMs      bool // swap trailing comma-milliseconds to dot before parsing
}

type Log4xParser struct {
	pattern *Log4xPattern
	pending *ParsedLine //buffers the last parsed line to aggregte exception data
	exLines []string    //exception data assocaited with pending line
}

func (p *Log4xParser) FormatName() string { return "log4x" }

func (p *Log4xParser) parseLine(line string) (ParsedLine, bool) {
	m := p.pattern.re.FindStringSubmatch(line)
	if m == nil {
		return ParsedLine{}, false
	}

	groups := make(map[string]string)
	for i, name := range p.pattern.re.SubexpNames() {
		if name != "" && i < len(m) {
			groups[name] = m[i]
		}
	}

	pl := ParsedLine{}

	tsStr := groups["ts"]
	if p.pattern.commaMs {
		tsStr = strings.Replace(tsStr, ",", ".", 1)
	}
	if t, err := time.Parse(p.pattern.tsLayout, tsStr); err == nil {
		pl.Ts = t.UnixNano()
	}

	pl.Level = normalizeLevel(groups["level"])
	pl.Msg = groups["msg"]

	if thread := groups["thread"]; thread != "" {
		pl.Props = map[string]any{"thread": thread}
	}
	if logger := groups["logger"]; logger != "" {
		if pl.Props == nil {
			pl.Props = make(map[string]any)
		}
		pl.Props["logger"] = logger
	}

	return pl, true
}

func (p *Log4xParser) ParseLine(line string) (ParsedLine, bool) {
	trimmed := strings.TrimSpace(line)
	pl, matched := p.parseLine(trimmed)
	if matched {
		if p.pending == nil {
			p.pending = &pl
			p.exLines = nil
			return ParsedLine{}, false
		}
		out := *p.pending
		if len(p.exLines) > 0 {
			out.Ex = strings.Join(p.exLines, "\n")
		}
		p.pending = &pl
		p.exLines = nil
		return out, true
	}

	if p.pending != nil && trimmed != "" {
		p.exLines = append(p.exLines, line)
	}
	return ParsedLine{}, false
}

// Emit last pending line
func (p *Log4xParser) Flush() (ParsedLine, bool) {
	if p.pending == nil {
		return ParsedLine{}, false
	}
	out := *p.pending
	if len(p.exLines) > 0 {
		out.Ex = strings.Join(p.exLines, "\n")
	}
	p.pending, p.exLines = nil, nil
	return out, true
}

// knownPatterns lists the supported log4x PatternLayout formats in priority order.
var knownPatterns = []*Log4xPattern{
	{
		// %d{yyyy-MM-dd HH:mm:ss,SSS} %-5level [%thread] %logger - %msg%n
		FormatString: `%d{yyyy-MM-dd HH:mm:ss,SSS} %-5level [%thread] %logger - %msg%n`,
		re:           regexp.MustCompile(`^(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})\s+(?P<level>\S+)\s+\[(?P<thread>[^\]]+)\]\s+(?P<logger>\S+)\s+-\s+(?P<msg>.+)$`),
		tsLayout:     "2006-01-02 15:04:05.000",
		commaMs:      true,
	},
	{
		// %d{yyyy-MM-dd HH:mm:ss,SSS} %-5level %logger - %msg%n
		FormatString: `%d{yyyy-MM-dd HH:mm:ss,SSS} %-5level %logger - %msg%n`,
		re:           regexp.MustCompile(`^(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})\s+(?P<level>\S+)\s+(?P<logger>\S+)\s+-\s+(?P<msg>.+)$`),
		tsLayout:     "2006-01-02 15:04:05.000",
		commaMs:      true,
	},
	{
		// %d{yyyy-MM-dd HH:mm:ss,SSS} [%thread] %-5level %logger - %msg%n
		FormatString: `%d{yyyy-MM-dd HH:mm:ss,SSS} [%thread] %-5level %logger - %msg%n`,
		re:           regexp.MustCompile(`^(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})\s+\[(?P<thread>[^\]]+)\]\s+(?P<level>\S+)\s+(?P<logger>\S+)\s+-\s+(?P<msg>.+)$`),
		tsLayout:     "2006-01-02 15:04:05.000",
		commaMs:      true,
	},
	{
		// %d{yyyy-MM-dd'T'HH:mm:ss.SSS} %-5level [%thread] %logger - %msg%n
		FormatString: `%d{yyyy-MM-dd'T'HH:mm:ss.SSS} %-5level [%thread] %logger - %msg%n`,
		re:           regexp.MustCompile(`^(?P<ts>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})\s+(?P<level>\S+)\s+\[(?P<thread>[^\]]+)\]\s+(?P<logger>\S+)\s+-\s+(?P<msg>.+)$`),
		tsLayout:     "2006-01-02T15:04:05.000",
		commaMs:      false,
	},
	{
		// [%d{yyyy-MM-dd HH:mm:ss,SSS}] [%-5level] [%thread] %logger - %msg%n
		FormatString: `[%d{yyyy-MM-dd HH:mm:ss,SSS}] [%-5level] [%thread] %logger - %msg%n`,
		re:           regexp.MustCompile(`^\[(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})\]\s+\[(?P<level>[^\]]+)\]\s+\[(?P<thread>[^\]]+)\]\s+(?P<logger>\S+)\s+-\s+(?P<msg>.+)$`),
		tsLayout:     "2006-01-02 15:04:05.000",
		commaMs:      true,
	},
}

// detectLog4xPattern scores each known pattern against the sample lines and
// returns the best match if it hits at least 50% of lines.
func detectLog4xPattern(lines []string) *Log4xPattern {
	if len(lines) == 0 {
		return nil
	}

	var best *Log4xPattern
	bestScore := 0
	for _, p := range knownPatterns {
		fmt.Printf("Testin patter %s", p.FormatString)
		hits := 0
		evaluated := 0
		for _, line := range lines {
			if len(line) > 0 && (line[0] == ' ' || line[0] == '\t') {
				continue
			}
			evaluated++
			if p.re.MatchString(strings.TrimSpace(line)) {
				fmt.Println("match")
				hits++
			}
		}
		if hits > bestScore && hits*2 >= evaluated {
			bestScore = hits
			best = p
		}
	}

	return best
}

func newLog4xParserFromLines(lines []string) *Log4xParser {
	p := detectLog4xPattern(lines)
	if p == nil {
		return nil
	}
	return &Log4xParser{pattern: p}
}
