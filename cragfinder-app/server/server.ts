import http from 'http'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import elementRouter from './controllers/elementRouter'
import mapRouter from './controllers/mapRouter'

const port = process.env.PORT || 3001

const createServer = () => {
  const app = express()
  app.use(express.json())
  app.use(express.static('build'))
  app.use(cors())
  app.use(morgan('tiny'))
  app.use('/api/elements', elementRouter)
  app.use('/api/maps', mapRouter)
  const server = http.createServer(app)
  server.listen(port, () => console.log(`Relay server running on port ${port}`))
}

export default createServer