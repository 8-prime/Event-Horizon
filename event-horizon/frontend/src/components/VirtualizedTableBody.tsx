import { FixedSizeList as List } from "react-window";
import {
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { cn, getLevelBadgeColor, getLevelBgColor } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { FileWatch, LogMessage } from "@/models/filewatch";


export type RowProps = {
    index: number,
    style: any,
    data: LogMessage[],
    selectedLog: LogMessage | undefined,
    handleRowClick: (log: LogMessage) => void,
}

const Row = ({
    index,
    style,
    data,
    selectedLog,
    handleRowClick
}: RowProps) => {
    const log = data[index];

    return (
        <TableRow
            key={log.id}
            style={style}
            className={cn(
                "cursor-pointer transition-colors",
                selectedLog === log && getLevelBgColor(log.level),
                selectedLog === log && "font-medium",
            )}
            onClick={() => handleRowClick(log)}
        >
            <TableCell>
                <Badge className={getLevelBadgeColor(log.level)}>{log.level}</Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">
                {log.timestamp}
            </TableCell>
            <TableCell className="font-mono text-xs whitespace-pre-wrap">
                {log.messageTemplate}
            </TableCell>
        </TableRow>
    );
};

export type VirtualizedTableBodyProps = {
    logInfo: FileWatch,
    selectedLog: LogMessage | undefined,
    handleRowClick: (row: LogMessage) => void,
    rowHeight: number
}

const VirtualizedTableBody = ({
    logInfo,
    selectedLog,
    handleRowClick,
    rowHeight = 38, // You can adjust this
}: VirtualizedTableBodyProps) => {
    if (logInfo.lines.length === 0) {
        return (
            <TableBody>
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No logs found matching your filters.
                    </TableCell>
                </TableRow>
            </TableBody>
        );
    }

    return (
        <TableBody>
            <List
                height={logInfo.lines.length * rowHeight > 300 ? 300 : logInfo.lines.length * rowHeight}
                itemCount={logInfo.lines.length}
                itemSize={rowHeight}
                width="100%"
            >
                {({ index, style }) => (
                    <Row
                        index={index}
                        style={style}
                        data={logInfo.lines}
                        selectedLog={selectedLog}
                        handleRowClick={handleRowClick}
                    />
                )}
            </List>
        </TableBody>
    );
};

export default VirtualizedTableBody;
