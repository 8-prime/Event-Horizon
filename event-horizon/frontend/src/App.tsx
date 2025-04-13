import { useEffect, useState } from 'react';
import { SelectFile, StopTailing } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime";
import { FileWatch, FileWatchRepo, GetLogMessage, LogUpdate } from './models/filewatch';
import NoFile from './components/NoFile';
import LogFileTable from './components/LogFileTable';
import { Toaster } from './components/ui/sonner';
import { create } from 'mutative';


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

  const updateDraft = (draft: FileWatchRepo, update: LogUpdate) => {
    Object.entries(update).forEach(([id, lines]) => {
      const mapped = lines
        .map(line => GetLogMessage(line))
        .filter(l => l !== undefined);
      draft[id].lines = draft[id].lines.concat(mapped)
    })
  }

  const fileUpdate = (update: LogUpdate) => {
    setWatchedFiles(current => create(current, (draft) => updateDraft(draft, update)))
  };

  useEffect(() => {
    const updateCancel = EventsOn('file-update', fileUpdate)
    return () => {
      updateCancel();
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
