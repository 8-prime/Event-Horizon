package parser

import (
	"testing"
)

func TestCLEF_Compact(t *testing.T) {
	line := `{"@t":"2024-01-15T10:30:00.123456789Z","@l":"Information","@m":"Hello world","@x":"","SourceContext":"MyApp.Service","UserId":42}`
	pl, ok := CLEFParser{}.ParseLine(line)
	if !ok {
		t.Fatal("expected parse to succeed")
	}
	if pl.Level != 2 {
		t.Errorf("expected level 2 (Info), got %d", pl.Level)
	}
	if pl.Msg != "Hello world" {
		t.Errorf("unexpected msg: %q", pl.Msg)
	}
	if pl.Ts == 0 {
		t.Error("timestamp should be non-zero")
	}
	if pl.Props["SourceContext"] == nil {
		t.Error("SourceContext should be in Props")
	}
	if _, sys := pl.Props["@t"]; sys {
		t.Error("@t should not appear in Props")
	}
}

func TestCLEF_Template(t *testing.T) {
	line := `{"@t":"2024-01-15T10:30:00Z","@l":"Error","@mt":"Failed to process {Item}","Item":"order-123","@x":"System.Exception: something went wrong"}`
	pl, ok := CLEFParser{}.ParseLine(line)
	if !ok {
		t.Fatal("parse failed")
	}
	if pl.Level != 4 {
		t.Errorf("expected level 4 (Error), got %d", pl.Level)
	}
	if pl.Msg != "Failed to process {Item}" {
		t.Errorf("unexpected msg: %q", pl.Msg)
	}
	if pl.Ex == "" {
		t.Error("exception should be set")
	}
	if pl.Props["Item"] == nil {
		t.Error("Item should be in Props")
	}
}

func TestCLEF_LevelAliases(t *testing.T) {
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
		pl, ok := CLEFParser{}.ParseLine(line)
		if !ok {
			t.Fatalf("parse failed for level %q", tc.lvl)
		}
		if pl.Level != tc.want {
			t.Errorf("level %q: got %d, want %d", tc.lvl, pl.Level, tc.want)
		}
	}
}

func TestCLEF_Empty(t *testing.T) {
	_, ok := CLEFParser{}.ParseLine("")
	if ok {
		t.Error("empty line should not parse")
	}
	_, ok = CLEFParser{}.ParseLine("not json")
	if ok {
		t.Error("non-JSON should not parse")
	}
}
