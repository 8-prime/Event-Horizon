package parser

import (
	"testing"
)

func TestLog4xPatterns(t *testing.T) {
	cases := []struct {
		name         string
		line         string
		wantLevel    uint8
		wantMsg      string
		wantThread   string
		wantLogger   string
		wantNonZeroTs bool
	}{
		{
			name:          "pattern1 thread+logger",
			line:          "2024-01-15 10:30:45,123 INFO  [main] My.Ns.Class - Message text",
			wantLevel:     2,
			wantMsg:       "Message text",
			wantThread:    "main",
			wantLogger:    "My.Ns.Class",
			wantNonZeroTs: true,
		},
		{
			name:          "pattern1 error level",
			line:          "2024-01-15 10:30:45,123 ERROR [worker-1] My.App.Handler - Something failed",
			wantLevel:     4,
			wantMsg:       "Something failed",
			wantThread:    "worker-1",
			wantLogger:    "My.App.Handler",
			wantNonZeroTs: true,
		},
		{
			name:          "pattern2 no thread",
			line:          "2024-01-15 10:30:45,123 WARN  My.Ns.Class - Warning message",
			wantLevel:     3,
			wantMsg:       "Warning message",
			wantLogger:    "My.Ns.Class",
			wantNonZeroTs: true,
		},
		{
			name:          "pattern3 thread before level",
			line:          "2024-01-15 10:30:45,123 [main] INFO  My.Ns.Class - Hello",
			wantLevel:     2,
			wantMsg:       "Hello",
			wantThread:    "main",
			wantLogger:    "My.Ns.Class",
			wantNonZeroTs: true,
		},
		{
			name:          "pattern4 ISO timestamp",
			line:          "2024-01-15T10:30:45.123 INFO  [main] My.Ns.Class - ISO message",
			wantLevel:     2,
			wantMsg:       "ISO message",
			wantThread:    "main",
			wantLogger:    "My.Ns.Class",
			wantNonZeroTs: true,
		},
		{
			name:          "pattern5 bracketed format",
			line:          "[2024-01-15 10:30:45,123] [INFO ] [main] My.Ns.Class - Bracketed message",
			wantLevel:     2,
			wantMsg:       "Bracketed message",
			wantThread:    "main",
			wantLogger:    "My.Ns.Class",
			wantNonZeroTs: true,
		},
		{
			name:          "async state machine logger name",
			line:          "2024-01-15 10:30:45,123 DEBUG [async-1] My.Namespace.MyClass::MoveNext<>() - Async debug",
			wantLevel:     1,
			wantMsg:       "Async debug",
			wantThread:    "async-1",
			wantLogger:    "My.Namespace.MyClass::MoveNext<>()",
			wantNonZeroTs: true,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			p := detectLog4xPattern([]string{tc.line})
			if p == nil {
				t.Fatalf("no pattern matched line: %q", tc.line)
			}
			parser := &Log4xParser{pattern: p}
			parser.ParseLine(tc.line) // buffers entry; first call always returns false
			pl, ok := parser.Flush()
			if !ok {
				t.Fatalf("ParseLine returned false for: %q", tc.line)
			}
			if pl.Level != tc.wantLevel {
				t.Errorf("level: got %d, want %d", pl.Level, tc.wantLevel)
			}
			if pl.Msg != tc.wantMsg {
				t.Errorf("msg: got %q, want %q", pl.Msg, tc.wantMsg)
			}
			if tc.wantNonZeroTs && pl.Ts == 0 {
				t.Error("timestamp should be non-zero")
			}
			if tc.wantThread != "" {
				if got, ok := pl.Props["thread"]; !ok || got != tc.wantThread {
					t.Errorf("thread: got %v, want %q", got, tc.wantThread)
				}
			}
			if tc.wantLogger != "" {
				if got, ok := pl.Props["logger"]; !ok || got != tc.wantLogger {
					t.Errorf("logger: got %v, want %q", got, tc.wantLogger)
				}
			}
		})
	}
}

func TestLog4xDetect_NoMatch(t *testing.T) {
	lines := []string{
		`{"@t":"2024-01-15T10:30:00Z","@l":"Info","@m":"clef line"}`,
		`{"@t":"2024-01-15T10:30:01Z","@l":"Debug","@m":"another clef"}`,
	}
	p := detectLog4xPattern(lines)
	if p != nil {
		t.Errorf("expected nil for CLEF lines, got pattern %q", p.FormatString)
	}
}

func TestLog4xDetect_MixedLines(t *testing.T) {
	// 3 log4x + 1 garbage — should still detect log4x (75% ≥ 50%)
	lines := []string{
		"2024-01-15 10:30:45,123 INFO  [main] App.Class - Msg A",
		"2024-01-15 10:30:46,456 WARN  [main] App.Class - Msg B",
		"2024-01-15 10:30:47,789 ERROR [main] App.Class - Msg C",
		"not a log line at all",
	}
	p := detectLog4xPattern(lines)
	if p == nil {
		t.Fatal("expected a pattern to be detected")
	}
}

func TestLog4xDetect_BelowThreshold(t *testing.T) {
	// Only 1 out of 4 lines matches — below 50%, should return nil
	lines := []string{
		"2024-01-15 10:30:45,123 INFO  [main] App.Class - Msg A",
		"garbage line one",
		"garbage line two",
		"garbage line three",
	}
	p := detectLog4xPattern(lines)
	if p != nil {
		t.Errorf("expected nil when below 50%% threshold, got %q", p.FormatString)
	}
}

// --- Multi-line / exception accumulation tests ---

func newLog4xParserForTest(t *testing.T, sampleLine string) *Log4xParser {
	t.Helper()
	pat := detectLog4xPattern([]string{sampleLine})
	if pat == nil {
		t.Fatalf("no pattern matched sample line: %q", sampleLine)
	}
	return &Log4xParser{pattern: pat}
}

func TestLog4x_FlushEmpty(t *testing.T) {
	p := newLog4xParserForTest(t, "2024-01-15 10:30:45,123 INFO  [main] App.Class - Msg")
	_, ok := p.Flush()
	if ok {
		t.Error("Flush on empty parser should return false")
	}
}

func TestLog4x_SingleEntryNoException(t *testing.T) {
	p := newLog4xParserForTest(t, "2024-01-15 10:30:45,123 INFO  [main] App.Class - Msg")
	_, ok := p.ParseLine("2024-01-15 10:30:45,123 INFO  [main] App.Class - Hello")
	if ok {
		t.Error("ParseLine of first entry should return false (buffered, not emitted yet)")
	}
	pl, ok := p.Flush()
	if !ok {
		t.Fatal("Flush should return true for buffered entry")
	}
	if pl.Msg != "Hello" {
		t.Errorf("msg: got %q, want %q", pl.Msg, "Hello")
	}
	if pl.Ex != "" {
		t.Errorf("Ex should be empty, got %q", pl.Ex)
	}
}

func TestLog4x_SingleEntryWithException(t *testing.T) {
	p := newLog4xParserForTest(t, "2024-01-15 10:30:45,123 ERROR [main] App.Class - Boom")
	_, ok := p.ParseLine("2024-01-15 10:30:45,123 ERROR [main] App.Class - Boom")
	if ok {
		t.Error("ParseLine of first entry should return false")
	}
	_, ok = p.ParseLine("System.NullReferenceException: Object reference not set")
	if ok {
		t.Error("continuation line should not be emitted")
	}
	_, ok = p.ParseLine("   at App.Class.Method() in File.cs:line 42")
	if ok {
		t.Error("continuation line should not be emitted")
	}
	pl, ok := p.Flush()
	if !ok {
		t.Fatal("Flush should return true")
	}
	if pl.Msg != "Boom" {
		t.Errorf("msg: got %q, want %q", pl.Msg, "Boom")
	}
	wantEx := "System.NullReferenceException: Object reference not set\n   at App.Class.Method() in File.cs:line 42"
	if pl.Ex != wantEx {
		t.Errorf("Ex:\n got  %q\n want %q", pl.Ex, wantEx)
	}
}

func TestLog4x_TwoEntries_SecondEmitsFirst(t *testing.T) {
	p := newLog4xParserForTest(t, "2024-01-15 10:30:45,123 ERROR [main] App.Class - First")
	p.ParseLine("2024-01-15 10:30:45,123 ERROR [main] App.Class - First")
	p.ParseLine("   at Stack.Frame() in A.cs:line 1")

	// Second log line should emit the first entry.
	pl, ok := p.ParseLine("2024-01-15 10:30:46,456 INFO  [main] App.Class - Second")
	if !ok {
		t.Fatal("ParseLine of second entry should emit the first")
	}
	if pl.Msg != "First" {
		t.Errorf("emitted msg: got %q, want %q", pl.Msg, "First")
	}
	if pl.Ex != "   at Stack.Frame() in A.cs:line 1" {
		t.Errorf("Ex: got %q", pl.Ex)
	}

	// Flush should give us the second entry with no exception.
	pl2, ok := p.Flush()
	if !ok {
		t.Fatal("Flush should return true for second entry")
	}
	if pl2.Msg != "Second" {
		t.Errorf("second msg: got %q, want %q", pl2.Msg, "Second")
	}
	if pl2.Ex != "" {
		t.Errorf("second Ex should be empty, got %q", pl2.Ex)
	}
}
