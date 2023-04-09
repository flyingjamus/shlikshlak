import { Database, DatabaseConfiguration } from '@hocuspocus/extension-database'
import SqliteDatabase from 'better-sqlite3'
import { onLoadDocumentPayload } from '@hocuspocus/server'
import fs from 'fs/promises'
import * as Y from 'yjs'

const db = new SqliteDatabase('db.sqlite', {
  nativeBinding: 'node_modules/better-sqlite3/build/Release/better_sqlite3.node',
})
db.pragma('journal_mode = WAL')

db.prepare(
  `CREATE TABLE IF NOT EXISTS "documents" (
  "name" varchar(255) NOT NULL,
  "data" blob NOT NULL,
  UNIQUE(name)
)`
).run()

const selectQuery = db.prepare(`
  SELECT data FROM "documents" WHERE name = ? ORDER BY rowid DESC
`)

const upsertQuery = db.prepare(`
  INSERT INTO "documents" ("name", "data") VALUES (@documentName, @state)
    ON CONFLICT(name) DO UPDATE SET data = @state
`)

export class HocusPocusSqlite extends Database {
  db?: InstanceType<typeof SqliteDatabase>

  configuration: DatabaseConfiguration = {
    // fetch: async ({ documentName, document }) => {
    //   // //   const text = data.document.getText()
    //   // //   console.log(this.documents)
    //   // //   if (text.toString() !== fileContent) {
    //   // //     data.document.transact(() => {
    //   // //       text.delete(0, text.length)
    //   // //       text.insert(0, fileContent)
    //   // //     })
    //   // //   }
    //   // return selectQuery.pluck().get(documentName) as Uint8Array
    // },
    store: async ({ documentName, state }) => {
      upsertQuery.run({ documentName, state })
    },
  }
  override async onLoadDocument(data: onLoadDocumentPayload): Promise<any> {
    const update = selectQuery.pluck().get(data.documentName) as Uint8Array | null

    const fileContent = await fs.readFile(data.documentName, 'utf-8')
    const newDoc = new Y.Doc()
    newDoc.getText().insert(0, fileContent)

    if (update) {
      Y.applyUpdate(data.document, update)
    }
    console.log(222222222222, data.document.getText().toString())
    Y.applyUpdate(data.document, Y.encodeStateAsUpdate(newDoc))
    console.log(333333333333, data.document.getText().toString())

    return data.document
  }

  async onListen() {}
}
