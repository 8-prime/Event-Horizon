import { v4 as uuidv4 } from 'uuid';
import { main } from "wailsjs/go/models"

export type FileWatch = {
    lines: LogMessage[],
    info: main.WatchInfo
}

export type FileUpdate = {
    id: string,
    line: string
}


export type Properties = {
    [id: string]: string
}

export type LogMessage = {
    id: string
    timestamp: string,
    level: string,
    messageTemplate: string,
    properties: Properties
}


export const GetLogMessage = (line: string): LogMessage => {
    const json = JSON.parse(line)
    return {
        id: uuidv4(),
        timestamp: json.Timestamp,
        level: json.Level,
        messageTemplate: json.MessageTemplate,
        properties: json.Properties
    }
}