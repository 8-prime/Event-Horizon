import { useEffect, useState } from 'react';
import { SelectFile, StopTailing } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime";
import { Button } from './components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { FileText, Upload, X } from 'lucide-react';
import { FileUpdate, FileWatch } from './models/filewatch';

function App() {
  const [watchedFiles, setWatchedFiles] = useState<FileWatch[]>([])
  const [activeTab, setActiveTab] = useState<string>("");

  const selectFile = () => {
    SelectFile()
  }

  const removeFile = (id: string) => {
    StopTailing(id).then(() => {
      //remove tailed file after succesfully removing
      setWatchedFiles(watchedFiles.filter(f => f.info.id != id))
    })
  }

  useEffect(() => {
    EventsOn('file-update', (line: FileUpdate) => {
      const wI = watchedFiles.find(f => f.info.id == line.id)
      if (wI) {
        wI.lines.push(line.line)
      }
    })
    EventsOn('tail-stopped', (file: string) => {
      console.log("Stopped watching file: " + file);
    })
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="container mx-auto py-4 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold">Log Viewer</h1>
          <div className="flex items-center gap-2">
            <Button onClick={selectFile} className="flex items-center gap-2">
              <Upload size={16} />
              Upload Log File
            </Button>
          </div>
        </div>

        {watchedFiles.length > 0 ? (
          <Tabs
            value={activeTab || undefined}
            onValueChange={setActiveTab}
            className="w-full h-[calc(100vh-80px)] flex flex-col"
          >
            <div className="flex items-start border rounded-lg overflow-x-auto">
              <TabsList className="flex-grow bg-transparent h-auto p-1">
                {watchedFiles.map((watchedFile) => (
                  <TabsTrigger
                    key={watchedFile.info.id}
                    value={watchedFile.info.id}
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <FileText size={14} />
                    <span className="truncate max-w-[150px]">{watchedFile.info.fileName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full ml-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(watchedFile.info.id)
                      }}
                    >
                      <X size={12} />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {watchedFiles.map((watchedFile) => (
              <TabsContent key={watchedFile.info.id} value={watchedFile.info.id} className="mt-4 flex-1 flex flex-col overflow-hidden">
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
                      <div className="overflow-auto flex-1">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="w-[100px]">Level</TableHead>
                              <TableHead className="w-[180px]">Time</TableHead>
                              <TableHead className="w-[150px]">Logger</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {watchedFile.lines.length > 0 ? (
                              watchedFile.lines.map((log, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Badge >
                                      {/* TODO{log.level} */}
                                      INFO
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {/* TODO {log.time} */}
                                    12:34:56 12.03.2024
                                  </TableCell>
                                  <TableCell className="truncate max-w-[150px]">
                                    {/* TODO {log.logger} */}
                                    DemoLogger
                                  </TableCell>
                                  <TableCell className="font-mono text-xs whitespace-pre-wrap">
                                    {/* TODO {log.message} */}
                                    {log}
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
              </TabsContent>
            ))}
          </Tabs>
        ) : (
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
        )}
      </div>
    </div>
  )
}

export default App
