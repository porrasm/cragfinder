import { Router } from 'express'

const router = Router()

router.get('/:region/boulders', (req, res) => {
  const region = req.params.region

  const boulders: any = []
  res.json(boulders)
})

router.get('/:region/cliffs', (req, res) => {
  const region = req.params.region

  const cliffs: any = []
  res.json(cliffs)
})

router.get('/:region/cracks', (req, res) => {
  const region = req.params.region

  const cracks: any = []
  res.json(cracks)
})

export default router
