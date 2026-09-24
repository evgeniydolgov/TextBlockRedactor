// The adapter supplies candidate replacements, including the untouched document.
// No candidate assigns IDs or mutates the current state.
export function fitInsertion<T>(
  ends: readonly number[],
  candidate: (end: number) => T,
  fits: (value: T) => boolean,
): T | undefined {
  let low = 0
  let high = ends.length - 1
  let result: T | undefined
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const value = candidate(ends[middle])
    if (fits(value)) {
      result = value
      low = middle + 1
    } else {
      high = middle - 1
    }
  }
  return result
}

export function textEnds(text: string): number[] {
  const ends: number[] = []
  let end = 0
  for (const character of text) {
    end += character.length
    ends.push(end)
  }
  return ends
}
