/**
 * Split payload and return the splitted array.
 */
const split = (arr, size = 50) => {
  return arr.reduce(
    (chunks, el, i) =>
      (i % size ? chunks[chunks.length - 1].push(el) : chunks.push([el])) &&
      chunks,
    []
  )
}

module.exports = split
