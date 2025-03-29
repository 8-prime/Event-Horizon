export namespace main {
	
	export class WatchInfo {
	    id: string;
	    filePath: string;
	    fileName: string;
	
	    static createFrom(source: any = {}) {
	        return new WatchInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.filePath = source["filePath"];
	        this.fileName = source["fileName"];
	    }
	}

}

