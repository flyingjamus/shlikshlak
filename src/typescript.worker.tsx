// This example uses @typescript/vfs to create a virtual TS program
// which can do work on a bg thread.

// This version of the vfs edits the global scope (in the case of a webworker, this is 'self')
// import('https://unpkg.com/@typescript/vfs@1.3.0/dist/vfs.globals.js')

/** @type { import("@typescript/vfs") } */
// const tsvfs = globalThis.tsvfs

/** @type {import("../src/tsWorker").CustomTSWebWorkerFactory }*/
const worker = (TypeScriptWorker, ts, libFileMap) => {
  return class MonacoTSWorker extends TypeScriptWorker {
    // Adds a custom function to the webworker
    // async getDTSEmitForFile(fileName) {}

    async printAST(fileName) {}
  }
}

self.customTSWorkerFactory = worker
