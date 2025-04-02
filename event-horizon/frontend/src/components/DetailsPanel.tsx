import { cn, getLevelBadgeColor, getLevelBgColor } from "@/lib/utils"
import { LogMessage } from "@/models/filewatch"
import { Braces, Bug, Clock, Hash, Locate, MessageSquare, Route, SeparatorVertical, X } from "lucide-react"
import { Button } from "./ui/button"
import PropertyDetail from "./PropertyDetail"
import { Badge } from "./ui/badge"


export type DetailsPanelProps = {
    logMessage: LogMessage | undefined
    setSelectedLog: (message: LogMessage | undefined) => void
}

const DetailsPanel = ({ logMessage, setSelectedLog }: DetailsPanelProps) => {
    if (logMessage) {
        return (
            <div className="hidden md:flex md:w-1/3 flex-col border rounded-lg overflow-hidden">
                <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
                    <h3 className="font-medium">Log Details</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedLog(undefined)}>
                        <X size={16} />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>
                <div className="p-4 overflow-auto flex-1">
                    <div className={cn("p-3 rounded-lg mb-4", getLevelBgColor(logMessage.level))}>
                        <Badge className={getLevelBadgeColor(logMessage.level)}>{logMessage.level}</Badge>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-medium">Timestamp</div>
                                <div className="font-mono text-sm">{logMessage.timestamp}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 mt-1 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-medium">Message</div>
                                <div className="font-mono text-sm whitespace-pre-wrap break-words">
                                    {logMessage.messageTemplate}
                                </div>
                            </div>
                        </div>
                        {
                            logMessage.sourceContext &&
                            <div className="flex items-start gap-2">
                                <Locate className="w-4 h-4 mt-1 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Logger</div>
                                    <div className="font-mono text-sm whitespace-pre-wrap break-words">
                                        {logMessage.sourceContext}
                                    </div>
                                </div>
                            </div>

                        }
                        {
                            logMessage.exception &&
                            <div className="flex items-start gap-2">
                                <Bug className="w-4 h-4 mt-1 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Exception</div>
                                    <div className="font-mono text-sm whitespace-pre-wrap break-words">
                                        {logMessage.exception}
                                    </div>
                                </div>
                            </div>
                        }
                        {
                            logMessage.eventId &&
                            <div className="flex items-start gap-2">
                                <Hash className="w-4 h-4 mt-1 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">EventId</div>
                                    <div className="font-mono text-sm whitespace-pre-wrap break-words">
                                        {logMessage.eventId}
                                    </div>
                                </div>
                            </div>
                        }
                        {
                            logMessage.traceId &&
                            <div className="flex items-start gap-2">
                                <Route className="w-4 h-4 mt-1 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">TraceId</div>
                                    <div className="font-mono text-sm whitespace-pre-wrap break-words">
                                        {logMessage.traceId}
                                    </div>
                                </div>
                            </div>

                        }
                        {
                            logMessage.spanId &&
                            <div className="flex items-start gap-2">
                                <SeparatorVertical className="w-4 h-4 mt-1 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">SpanId</div>
                                    <div className="font-mono text-sm whitespace-pre-wrap break-words">
                                        {logMessage.spanId}
                                    </div>
                                </div>
                            </div>
                        }

                        <div className="flex items-start gap-2">
                            <Braces className="w-4 h-4 mt-1 text-muted-foreground" />
                            <div>
                                {Object.entries(logMessage.properties).map(([k, v]) => <PropertyDetail key={k} k={k} v={v} />)}
                            </div>
                        </div>

                    </div>
                </div>
            </div>)
    }
}

export default DetailsPanel;