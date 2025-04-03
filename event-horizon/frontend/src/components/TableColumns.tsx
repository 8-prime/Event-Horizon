import { getLevelBadgeColor } from "@/lib/utils";
import { LogMessage } from "@/models/filewatch";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "./ui/badge";

const columnHelper = createColumnHelper<LogMessage>()

export const columns = [
    columnHelper.accessor(row => row.level, {
        id: 'level',
        cell: info => <Badge className={getLevelBadgeColor(info.getValue())}>{info.getValue()}</Badge>,
        header: () => <span>Level</span>
    }),
    columnHelper.accessor(row => row.timestamp, {
        id: 'timestamp',
        cell: info => <span className="font-mono text-xs">{info.getValue()}</span>,
        header: () => <span>Timestamp</span>
    }),
    columnHelper.accessor(row => row.messageTemplate, {
        id: 'messageTemplate',
        cell: info => <span className="font-mono text-xs whitespace-pre-wrap">{info.getValue()}</span>,
        header: () => <span>Message</span>
    })
]