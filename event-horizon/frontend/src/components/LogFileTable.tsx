import { FileWatch, LogMessage } from "@/models/filewatch"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"
import { Clock, FileText, MessageSquare, Upload, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn, getLevelBadgeColor, getLevelBgColor } from "@/lib/utils"
import { Input } from "./ui/input"

export type LogFileTableProps = {
    watchedFiles: FileWatch[]
    activeTabId: string
    removeFile: (id: string) => void
    setActiveTab: (id: string) => void
    selectFile: () => void
}

const LogFileTable = ({ watchedFiles, activeTabId, removeFile, setActiveTab, selectFile }: LogFileTableProps) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const [search, setSearch] = useState<string>("")
    const [selectedLog, setSelectedLog] = useState<LogMessage | undefined>();

    const activeTab = useMemo(() => {
        return watchedFiles.find(w => w.info.id === activeTabId)
    }, [watchedFiles, search, activeTabId])


    const filterFunction = (message: LogMessage, search: string) => {
        const templatecontains = message.messageTemplate.toLowerCase().includes(search)
        const keys = Object.keys(message.properties)
        const propcontains = keys.some(k => {
            const property = message.properties[k];
            return typeof property === "string" && property.toLowerCase().includes(search)
        })

        return propcontains || templatecontains;
    }

    const filteredFileWatch = useMemo(() => {
        const loweredSearch = search.toLowerCase()
        return {
            ...activeTab,
            lines: activeTab?.lines.filter(l => filterFunction(l, loweredSearch))
        } as FileWatch
    }, [activeTab, search]);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [activeTab])


    const handleRowClick = (log: LogMessage) => {
        setSelectedLog(log)
    }

    return (
        <div
            className="w-full h-full flex flex-col"
        >
            <div className="flex items-start border rounded-lg overflow-x-auto">
                <div className="flex-grow flex bg-transparent h-auto p-1">
                    <div className="grow flex justify-start items-center">
                        {watchedFiles.map((watchedFile) => (
                            <div
                                key={watchedFile.info.id}
                                className={cn(
                                    "flex items-center gap-2",
                                    activeTabId == watchedFile.info.id && "bg-primary text-primary-foreground rounded-lg px-1"
                                )}
                            >
                                <Button onClick={() => { setActiveTab(watchedFile.info.id) }}>
                                    <FileText size={14} />
                                    <span className="truncate max-w-[150px]">{watchedFile.info.fileName}</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-full ml-1"
                                    onClick={() => {
                                        removeFile(watchedFile.info.id)
                                    }}
                                >
                                    <X size={12} />
                                    <span className="sr-only">Remove</span>
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={selectFile} className="flex items-center gap-2">
                        <Upload size={16} />
                        Select Log File
                    </Button>
                </div>
            </div>

            {filteredFileWatch !== undefined &&
                <div key={filteredFileWatch.info.id} className="mt-4 flex-1 flex flex-col overflow-hidden">
                    <div className="flex flex-col h-full gap-4">
                        <Input
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full py-2"
                        ></Input>
                        <div className="flex-1 flex gap-4 h-full overflow-hidden">
                            <div className={cn(
                                "border rounded-lg overflow-hidden flex-1 flex flex-col",
                                selectedLog ? "md:w-2/3" : "w-full",
                            )}>
                                <div ref={scrollRef} className="overflow-auto flex-1">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                            <TableRow>
                                                <TableHead className="w-[100px]">Level</TableHead>
                                                <TableHead className="w-[180px]">Time</TableHead>
                                                <TableHead>Message</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredFileWatch.lines.length > 0 ? (
                                                filteredFileWatch.lines.map((log) => (
                                                    <TableRow key={log.id}
                                                        className={cn(
                                                            "cursor-pointer transition-colors",
                                                            selectedLog === log && getLevelBgColor(log.level),
                                                            selectedLog === log && "font-medium",
                                                        )}
                                                        onClick={() => handleRowClick(log)}
                                                    >
                                                        <TableCell>
                                                            <Badge className={getLevelBadgeColor(log.level)} >
                                                                {log.level}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">
                                                            {log.timestamp}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs whitespace-pre-wrap">
                                                            {log.messageTemplate}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">
                                                        No logs found matching your filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            {/* Details panel */}
                            {selectedLog && (
                                <div className="hidden md:flex md:w-1/3 flex-col border rounded-lg overflow-hidden">
                                    <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
                                        <h3 className="font-medium">Log Details</h3>
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(undefined)}>
                                            <X size={16} />
                                            <span className="sr-only">Close</span>
                                        </Button>
                                    </div>
                                    <div className="p-4 overflow-auto flex-1">
                                        <div className={cn("p-3 rounded-lg mb-4", getLevelBgColor(selectedLog.level))}>
                                            <Badge className={getLevelBadgeColor(selectedLog.level)}>{selectedLog.level}</Badge>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                                                <div>
                                                    <div className="text-sm font-medium">Timestamp</div>
                                                    <div className="font-mono text-sm">{selectedLog.timestamp}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="w-4 h-4 mt-1 text-muted-foreground" />
                                                <div>
                                                    <div className="text-sm font-medium">Message</div>
                                                    <div className="font-mono text-sm whitespace-pre-wrap break-words">
                                                        {selectedLog.messageTemplate}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}

export default LogFileTable