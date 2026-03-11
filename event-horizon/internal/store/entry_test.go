package store

import (
	"testing"
)

func TestParseCLEF_Compact(t *testing.T) {
	line := `{"@t":"2024-01-15T10:30:00.123456789Z","@l":"Information","@m":"Hello world","@x":"","SourceContext":"MyApp.Service","UserId":42}`
	e, ok := ParseCLEF(line, 1, 0)
	if !ok {
		t.Fatal("expected parse to succeed")
	}
	if e.Level != 2 {
		t.Errorf("expected level 2 (Info), got %d", e.Level)
	}
	if e.Msg != "Hello world" {
		t.Errorf("unexpected msg: %q", e.Msg)
	}
	if e.Ts == 0 {
		t.Error("timestamp should be non-zero")
	}
	if e.Props["SourceContext"] == nil {
		t.Error("SourceContext should be in Props")
	}
	if _, sys := e.Props["@t"]; sys {
		t.Error("@t should not appear in Props")
	}
}

func TestParseCLEF_Template(t *testing.T) {
	line := `{"@t":"2024-01-15T10:30:00Z","@l":"Error","@mt":"Failed to process {Item}","Item":"order-123","@x":"System.Exception: something went wrong"}`
	e, ok := ParseCLEF(line, 2, 0)
	if !ok {
		t.Fatal("parse failed")
	}
	if e.Level != 4 {
		t.Errorf("expected level 4 (Error), got %d", e.Level)
	}
	if e.Msg != "Failed to process {Item}" {
		t.Errorf("unexpected msg: %q", e.Msg)
	}
	if e.Ex == "" {
		t.Error("exception should be set")
	}
	if e.Props["Item"] == nil {
		t.Error("Item should be in Props")
	}
}

func TestParseCLEF_LevelAliases(t *testing.T) {
	cases := []struct {
		lvl  string
		want uint8
	}{
		{"Verbose", 0}, {"Trace", 0},
		{"Debug", 1},
		{"Info", 2}, {"Information", 2},
		{"Warn", 3}, {"Warning", 3},
		{"Error", 4},
		{"Fatal", 5}, {"Critical", 5},
	}
	for _, tc := range cases {
		line := `{"@t":"2024-01-01T00:00:00Z","@l":"` + tc.lvl + `","@m":"test"}`
		e, ok := ParseCLEF(line, 1, 0)
		if !ok {
			t.Fatalf("parse failed for level %q", tc.lvl)
		}
		if e.Level != tc.want {
			t.Errorf("level %q: got %d, want %d", tc.lvl, e.Level, tc.want)
		}
	}
}

func TestParseCLEF_Empty(t *testing.T) {
	_, ok := ParseCLEF("", 1, 0)
	if ok {
		t.Error("empty line should not parse")
	}
	_, ok = ParseCLEF("not json", 1, 0)
	if ok {
		t.Error("non-JSON should not parse")
	}
}
