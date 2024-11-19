/**
 * Converts field values to UTF-8.
 */
const convertToUTF8 = async row => {
  const propKeys = Reflect.ownKeys(row)

  const result = propKeys.reduce((values, field) => {
    if (row[field] && typeof row[field] === 'object') {
      return {
        ...values,
        [field]: row[field].toString('utf8')
      }
    } else {
      return {
        ...values,
        [field]: row[field] || ''
      }
    }
  }, {})

  return result
}

module.exports = convertToUTF8
