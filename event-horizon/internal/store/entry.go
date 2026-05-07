package store

// Entry represents a single parsed log entry.
type Entry struct {
	ID      uint32         `json:"id"`
	Ts      int64          `json:"ts"`            // unix nanoseconds
	Level   uint8          `json:"lvl"`           // 0=Trace 1=Debug 2=Info 3=Warn 4=Error 5=Fatal
	Msg     string         `json:"msg"`
	Ex      string         `json:"ex,omitempty"`
	Props   map[string]any `json:"props,omitempty"`
	FileIdx uint8          `json:"fileIdx"`
}
