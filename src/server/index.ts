import express from 'express'
import cors from 'cors'
import serveIndex from 'serve-index'

const app = express()
const PORT = 3001
app.use(cors())

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.use(serveIndex('.')) // shows you the file list
app.use(express.static('.'))

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
