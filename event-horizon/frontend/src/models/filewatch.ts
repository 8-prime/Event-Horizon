import { main } from "wailsjs/go/models"

export type FileWatch = {
    lines: string[],
    info: main.WatchInfo
}

export type FileUpdate = {
    id: string,
    line: string
}