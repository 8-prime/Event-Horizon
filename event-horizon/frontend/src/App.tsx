import { useEffect, useReducer, useState } from 'react';
import { SelectFile, StartTailing, StopTailing } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime"
import { Button } from './components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { FileText, Upload } from 'lucide-react';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

function App() {
  const [files, setFiles] = useState<string[]>([])
  const [lines, setLines] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("");

  const [fileSelected, setFileSelected] = useState<boolean>(false)

  const selectFile = () => {
    SelectFile().then(() => {
      setFileSelected(true)
      StartTailing()
    })
  }

  useEffect(() => {
    EventsOn('file-update', (line: string) => {
      setLines(prev => [line, ...prev])
    })
    EventsOn('tail-stopped', (file: string) => {
      console.log("Stopped watching file: " + file);

      setFileSelected(false)
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

        {files.length > 0 ? (
          <Tabs
            value={activeTab || undefined}
            onValueChange={setActiveTab}
            className="w-full h-[calc(100vh-80px)] flex flex-col"
          >
            <div className="flex items-center border rounded-lg overflow-x-auto">
              <TabsList className="flex-grow bg-transparent h-auto p-1">
                {files.map((file) => (
                  <TabsTrigger
                    key={file.id}
                    value={file.id}
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <FileText size={14} />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full ml-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                    >
                      <X size={12} />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {files.map((file) => (
              <TabsContent key={file.id} value={file.id} className="mt-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col h-full">
                  {/* Fixed height top section with summary and charts */}
                  <div className="flex flex-col space-y-4">
                    {/* Log Level Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {logCountsByLevel.map((item) => (
                        <Card key={item.level}>
                          <CardHeader className="py-2 px-4">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Badge className={getLevelBadgeColor(item.level)}>{item.level}</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-1 px-4">
                            <div className="text-xl font-bold">{item.count}</div>
                            <p className="text-xs text-muted-foreground">log entries</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Search and filter controls */}
                  <div className="flex flex-col sm:flex-row gap-4 my-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={levelFilter || ""} onValueChange={(value) => setLevelFilter(value || null)}>
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
                      </Select>
                      <Select value={loggerFilter || ""} onValueChange={(value) => setLoggerFilter(value || null)}>
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
                      </Select>
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
                            {filteredLogs.length > 0 ? (
                              filteredLogs.map((log, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Badge className={getLevelBadgeColor(log.level)}>{log.level}</Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{log.time}</TableCell>
                                  <TableCell className="truncate max-w-[150px]">{log.logger}</TableCell>
                                  <TableCell className="font-mono text-xs whitespace-pre-wrap">{log.message}</TableCell>
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
                    <div className="text-sm text-muted-foreground mt-2">
                      Showing {filteredLogs.length} of {allLogs.length} log entries
                    </div>
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
            <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 mx-auto">
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
