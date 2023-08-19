import http from 'http'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import defaultRouter from './controllers/defaultRouter'

const port = process.env.PORT || 3001

const createServer = () => {
  const app = express()
  app.use(express.json())
  app.use(express.static('build'))
  app.use(cors())
  app.use(morgan('tiny'))
  //app.use(tryCatchMiddleware)
  app.use('/api', defaultRouter)
  const server = http.createServer(app)
  server.listen(port, () => console.log(`Relay server running on port ${port}`))
}

const tryCatchMiddleware = (fn: any) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export default createServer