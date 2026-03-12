export namespace store {
  export class FileMetadata {
    fileId: string
    name: string
    totalEntries: number
    propKeys: string[]
    timeExtent: number[]

    static createFrom(source: any = {}) {
      return new FileMetadata(source)
    }

    constructor(source: any = {}) {
      if ('string' === typeof source) source = JSON.parse(source)
      this.fileId = source['fileId']
      this.name = source['name']
      this.totalEntries = source['totalEntries']
      this.propKeys = source['propKeys']
      this.timeExtent = source['timeExtent']
    }
  }
}
