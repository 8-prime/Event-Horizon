import { FileText, Upload } from "lucide-react"
import { Button } from "./ui/button"


export type NoFileProps = {
    selectFile: () => void
}

const NoFile = ({ selectFile }: NoFileProps) => {
    return (
        <div className="border rounded-lg p-12 text-center">
            <div className="flex justify-center mb-4">
                <FileText size={48} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No log files uploaded</h3>
            <p className="text-muted-foreground mb-4">Select a log file to view and analyze its contents</p>
            <Button onClick={selectFile} className="flex items-center gap-2 mx-auto">
                <Upload size={16} />
                Add Log File
            </Button>
        </div>
    )
}
export default NoFile