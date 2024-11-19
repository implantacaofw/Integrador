/**
 * Split query following the regex pattern.
 */
const splitQuery = str => str.split(/(:[a-z]\w+)/gm)

/**
 * Verify whether the given partial query is a placeholder.
 */
const isPlaceholder = str => str.split(':').length > 1

/**
 * Verify what kind is query.
 */
const getQueryType = query => query.split(' ')[0].trim().toUpperCase()

// const isSelect = query => getQueryType(query) === 'SELECT'
const isInsert = query => getQueryType(query) === 'INSERT'
const isUpdate = query => getQueryType(query) === 'UPDATE'
// const isDelete = query => getQueryType(query) === 'DELETE'

/**
 *
 */
const normalizeData = value => {
  return typeof value === 'string' ? `"${value}"` : value
}

const normalizeValues = values => values.map(normalizeData)

/**
 *
 */
const extractPlaceholder = placeholder => placeholder.substring(1)

/**
 * Replace all placeholder occurrence in the query.
 */
const replace = (query, params) => {
  const splited = splitQuery(query)

  return splited.reduce((acc, partialQuery) => {
    if (!isPlaceholder(partialQuery)) return `${acc}${(partialQuery || '').trim()}`

    const placeholder = extractPlaceholder(partialQuery)

    if (isInsert(query)) {
      if (params.hasOwnProperty('columns') && params.hasOwnProperty('values')) {
        if (placeholder === 'values') {
          return `${acc}${normalizeValues(params[placeholder]).join(', ')}`
        }

        if (placeholder === 'columns') {
          return `${acc}${params[placeholder].join(', ')}`
        }
      }
    }

    if (isUpdate(query)) {
      if (params.hasOwnProperty('data')) {
        const { data } = params

        if (placeholder === 'data') {
          const keys = Object.keys(data)
          const setValue = keys.map(
            key => `${key} = ${normalizeData(data[key])}`
          )

          return `${acc}${setValue.join(', ')}`
        }

        if (placeholder !== 'table') {
          return `${acc}${data[placeholder]}`
        }
      }
    }

    return `${acc}${(params[placeholder] || '').trim()}`
  }, '')
}

module.exports = { replace }
