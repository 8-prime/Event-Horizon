import { useEffect, useState } from 'react';
import { SelectFile, StopTailing } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime";
import { FileUpdate, FileWatch, GetLogMessage } from './models/filewatch';
import NoFile from './components/NoFile';
import LogFileTable from './components/LogFileTable';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

function App() {
  const [watchedFiles, setWatchedFiles] = useState<FileWatch[]>([])
  const [activeTab, setActiveTab] = useState<string>("");

  const selectFile = () => {
    SelectFile().then((wi) => {
      const fi: FileWatch = {
        lines: [],
        info: wi
      }
      setWatchedFiles([...watchedFiles, fi])
      setActiveTab(fi.info.id)
    })
  }

  const removeFile = (id: string) => {
    StopTailing(id).then(() => {
      setWatchedFiles(watchedFiles.filter(f => f.info.id != id))
    })
  }

  useEffect(() => {
    const updateCancel = EventsOn('file-update', (line: FileUpdate) => {
      setWatchedFiles(current => {
        return current.map(watched => {
          if (watched.info.id != line.id) {
            return watched
          }
          const newLog = GetLogMessage(line.line)
          if (!newLog) {
            toast("Invalid log format")
            return watched;
          }
          return { ...watched, lines: [...watched.lines, newLog] }
        })
      })
    })
    const stoppedEventCancel = EventsOn('tail-stopped', (file: string) => {
      console.log("Stopped watching file: " + file);
    })
    return () => {
      updateCancel();
      stoppedEventCancel();
    }
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden p-4">
      <Toaster />
      {watchedFiles.length > 0 ? (
        <LogFileTable activeTabId={activeTab} setActiveTab={setActiveTab} removeFile={removeFile} watchedFiles={watchedFiles} selectFile={selectFile} />
      ) : (
        <NoFile selectFile={selectFile} />
      )}
    </div>
  )
}

export default App
