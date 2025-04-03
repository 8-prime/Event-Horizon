import { FileWatch, LogMessage } from "@/models/filewatch"
import { Button } from "./ui/button"
import { FileText, Upload, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "./ui/input"
import DetailsPanel from "./DetailsPanel"
import { DataTable } from "./VirtualTable"
import { columns } from "./TableColumns"

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
        console.log(log);
        setSelectedLog(log)
    }

    return (
        <div
            className="w-full h-full flex flex-col"
        >
            <div className="flex items-start border rounded-lg overflow-x-auto">
                <div className="flex-grow flex bg-transparent h-auto p-1">
                    <div className="grow flex justify-start items-center gap-2">
                        {watchedFiles.map((watchedFile) => (
                            <div
                                key={watchedFile.info.id}
                                className={cn(
                                    "flex items-center px-1",
                                    activeTabId == watchedFile.info.id && "bg-primary text-primary-foreground rounded-lg px-1"
                                )}
                            >
                                <Button variant="shell" onClick={() => { setActiveTab(watchedFile.info.id) }}>
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
                                <DataTable data={filteredFileWatch.lines} height="500px" columns={columns} handleRowClick={handleRowClick} />
                            </div>
                            {/* Details panel */}
                            <DetailsPanel logMessage={selectedLog} setSelectedLog={setSelectedLog} />
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}

export default LogFileTable