import { FileWatch, LogMessage } from "@/models/filewatch"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"
import { Braces, Clock, FileText, MessageSquare, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn, getLevelBadgeColor, getLevelBgColor } from "@/lib/utils"
import PropertDetail from "./PropertyDetail"

export type LogFileTableProps = {
    watchedFiles: FileWatch[]
    activeTabId: string
    removeFile: (id: string) => void
    setActiveTab: (id: string) => void
}

const LogFileTable = ({ watchedFiles, activeTabId, removeFile, setActiveTab }: LogFileTableProps) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const activeTab = useMemo(() => {
        return watchedFiles.find(w => w.info.id === activeTabId)
    }, [watchedFiles])

    const [selectedLog, setSelectedLog] = useState<LogMessage | undefined>();

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [activeTab])


    const handleRowClick = (log: LogMessage) => {
        setSelectedLog(log)
    }

    return (
        <div
            className="w-full h-[calc(100vh-80px)] flex flex-col"
        >
            <div className="flex items-start border rounded-lg overflow-x-auto">
                <div className="flex-grow bg-transparent h-auto p-1">
                    {watchedFiles.map((watchedFile) => (
                        <div
                            key={watchedFile.info.id}
                            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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
            </div>

            {activeTab !== undefined &&
                <div key={activeTab.info.id} className="mt-4 flex-1 flex flex-col overflow-hidden">
                    <div className="flex flex-col h-full">
                        {/* TODO: Search and filter controls */}
                        {/* Scrollable log table section */}
                        <div className="flex-1 flex gap-4 h-full">
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
                                            {activeTab.lines.length > 0 ? (
                                                activeTab.lines.map((log) => (
                                                    <TableRow key={log.id}
                                                        className={cn(
                                                            "cursor-pointer transition-colors",
                                                            selectedLog === log && getLevelBgColor(log.level),
                                                            selectedLog === log && "font-medium",
                                                        )}
                                                        onClick={() => handleRowClick(log)}
                                                    >
                                                        <TableCell>
                                                            <Badge >
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
                                            <div className="flex items-start gap-2">
                                                <Braces className="w-4 h-4 mt-1 text-muted-foreground" />
                                                <div>
                                                    {Object.entries(selectedLog.properties).map(([k, v]) => <PropertDetail key={k} k={k} v={v} />)}
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