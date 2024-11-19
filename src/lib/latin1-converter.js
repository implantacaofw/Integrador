/**
 * Converts field values to Latin1.
 */
const convertToLatin1 = async row => {
  const propKeys = Reflect.ownKeys(row)

  const result = propKeys.reduce((values, field) => {
    if (row[field] && typeof row[field] === 'object') {
      return {
        ...values,
        [field]: row[field].toString('latin1')
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

module.exports = convertToLatin1
