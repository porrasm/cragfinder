import seedrandom from "seedrandom"

export const pickRandomlyFromArray = <T>(arr: T[], maxLength: number): T[] => {
  if (maxLength >= arr.length) {
    return arr
  }

  const ratio = maxLength / arr.length
  const rng = seedrandom("random seed")


  return arr.filter(returnTrueWithProbability(rng, ratio))
}

const returnTrueWithProbability = <T>(rng: seedrandom.PRNG, probability: number) => (p: T) => {
  return rng() < probability
}
