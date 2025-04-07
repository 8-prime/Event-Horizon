import { useEffect, useState } from 'react';
import { SelectFile, StopTailing } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime";
import { FileUpdate, FileWatch, FileWatchRepo, GetLogMessage } from './models/filewatch';
import NoFile from './components/NoFile';
import LogFileTable from './components/LogFileTable';
import { Toaster } from './components/ui/sonner';


function App() {
  const [watchedFiles, setWatchedFiles] = useState<FileWatchRepo>({})
  const [activeTab, setActiveTab] = useState<string>("");

  const selectFile = () => {
    SelectFile().then((wi) => {
      const fi: FileWatch = {
        lines: [],
        info: wi
      }
      setWatchedFiles({ ...watchedFiles, [fi.info.id]: fi })
      setActiveTab(fi.info.id)
    })
  }

  const removeFile = (id: string) => {
    StopTailing(id).then(() => {
      const { [id]: _, ...newWatchedFiles } = watchedFiles;
      setWatchedFiles(newWatchedFiles)
    })
  }

  useEffect(() => {
    const updateCancel = EventsOn('file-update', (line: FileUpdate) => {
      setWatchedFiles(current => {
        const toUpdate = current[line.id]

        if (!toUpdate) {
          return current;
        }
        const logLine = GetLogMessage(line.line)
        if (!logLine) {
          return current
        }
        toUpdate.lines.push(logLine)

        return { ...current, [line.id]: toUpdate }
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
      {Object.keys(watchedFiles).length > 0 ? (
        <LogFileTable activeTabId={activeTab} setActiveTab={setActiveTab} removeFile={removeFile} watchedFiles={watchedFiles} selectFile={selectFile} />
      ) : (
        <NoFile selectFile={selectFile} />
      )}
    </div>
  )
}

export default App
