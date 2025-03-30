import { FileWatch } from "@/models/filewatch"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"
import { FileText, X } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"

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

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [activeTab])

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
                        {/* Search and filter controls */}
                        <div className="flex flex-col sm:flex-row gap-4 my-4">
                            <div className="flex-1">
                                {/* <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      /> */}
                            </div>
                            <div className="flex gap-2">
                                {/* <Select value={levelFilter || ""} onValueChange={(value) => setLevelFilter(value || null)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Filter by level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {uniqueLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select> */}
                                {/* <Select value={loggerFilter || ""} onValueChange={(value) => setLoggerFilter(value || null)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Filter by logger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Loggers</SelectItem>
                          {uniqueLoggers.map((logger) => (
                            <SelectItem key={logger} value={logger}>
                              {logger}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select> */}
                            </div>
                        </div>

                        {/* Scrollable log table section */}
                        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                            <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
                                <div ref={scrollRef} className="overflow-auto flex-1">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                            <TableRow>
                                                <TableHead className="w-[100px]">Level</TableHead>
                                                <TableHead className="w-[180px]">Time</TableHead>
                                                {/* <TableHead className="w-[150px]">Logger</TableHead> */}
                                                <TableHead>Message</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeTab.lines.length > 0 ? (
                                                activeTab.lines.map((log) => (
                                                    <TableRow key={log.id}>
                                                        <TableCell>
                                                            <Badge >
                                                                {log.level}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">
                                                            {log.timestamp}
                                                        </TableCell>
                                                        {/* <TableCell className="truncate max-w-[150px]">
                                    {log.messageTemplate}
                                  </TableCell> */}
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
                            {/* <div className="text-sm text-muted-foreground mt-2">
                      Showing {filteredLogs.length} of {allLogs.length} log entries
                    </div> */}
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}

export default LogFileTable