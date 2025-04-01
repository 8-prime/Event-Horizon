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
    properties: Properties,
    exception: string | undefined
    eventId: string | undefined,
    renderings: string | undefined,
    traceId: string | undefined,
    spanId: string | undefined
}

export type CompactLog = {
    ["@t"]: string,//timestamp
    ["@m"]: string,//fully rendered message
    ["@mt"]: string,//message tempalte
    ["@l"]: string,//level
    ["@x"]: string,//exception
    ["@i"]: string,//event id
    ["@r"]: string,//renderings
    ["@tr"]: string,//trace id
    ["@sp"]: string,//span id
}

const isCompactLog = (log: any) => {
    return "@mt" in log
}

export type DefaultJsonLog = {
    ["Timestamp"]: string,
    ["Level"]: string,
    ["MessageTemplate"]: string,
    ["Properties"]: any
}

const isDefaultJsonLog = (log: any) => {
    return "MessageTemplate" in log
}


export const GetLogMessage = (line: string): LogMessage | undefined => {
    const json = JSON.parse(line)
    if (isDefaultJsonLog(json)) {
        const defaultJson = json as DefaultJsonLog
        return {
            id: uuidv4(),
            timestamp: defaultJson.Timestamp,
            level: defaultJson.Level,
            messageTemplate: defaultJson.MessageTemplate,
            properties: defaultJson.Properties,
            eventId: undefined,
            exception: undefined,
            renderings: undefined,
            spanId: undefined,
            traceId: undefined
        }
    }
    if (isCompactLog(json)) {
        const compactJson = json as CompactLog

        let properties: { [key: string]: any } = {};
        Object.keys(json)
            .filter(k => !k.includes("@"))
            .forEach(k => properties[k] = json[k])

        return {
            id: uuidv4(),
            timestamp: compactJson['@t'] ?? "-",
            level: compactJson['@l'] ?? "-",
            messageTemplate: compactJson['@mt'] ?? "-",
            properties: properties,
            renderings: compactJson['@r'],
            exception: compactJson['@x'],
            eventId: compactJson['@i'],
            spanId: compactJson['@sp'],
            traceId: compactJson['@tr'],
        }
    }
}