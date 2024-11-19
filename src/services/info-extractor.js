/**
 * Extract data based on configuration loaded by "load" function.
 */
const extract = async (groupConfigs, data) => {
  // Iterate over all data.
  return data.map(actualRecord => {
    // Apply the configurations to the actual record.
    return groupConfigs.reduce((plainedData, actualConfig) => {
      const { path, structure } = actualConfig

      if (path) {
        const newObject = actualRecord[path].map(subRecord => {
          const keysToExtract = Object.keys(structure)
          const plainedObject = keysToExtract.reduce((newObject, actualKey) => {
            if (typeof structure[actualKey] === 'object') {
              const value = structure[actualKey].default
              return Object.assign({}, newObject, { [actualKey]: value })
            }

            const newKey = structure[actualKey].split('.')
            const isComposedKey = newKey.length > 1

            if (!isComposedKey) {
              return Object.assign({}, newObject, {
                [actualKey]: subRecord[structure[actualKey]]
              })
            }

            const extractedValue = newKey.reduce((value, key) => {
              return value[key]
            }, subRecord)

            return Object.assign({}, newObject, { [actualKey]: extractedValue })
          }, {})

          return plainedObject
        })

        return Object.assign({}, plainedData, { [path]: newObject })
      }

      if (!structure) return

      const keysToExtract = Object.keys(structure)

      const newObject = keysToExtract.reduce((newObject, actualKey) => {
        if (typeof structure[actualKey] === 'object') {
          const value = structure[actualKey].default
          return Object.assign({}, newObject, { [actualKey]: value })
        }

        const newKey = structure[actualKey].split('.')
        const isComposedKey = newKey.length > 1

        if (!isComposedKey) {
          return Object.assign({}, newObject, {
            [actualKey]: actualRecord[structure[actualKey]]
          })
        }

        const extractedValue = newKey.reduce((value, key) => {
          if (Array.isArray(value[key])) {
            return value[key][0]
          }

          return value[key]
        }, actualRecord)

        return Object.assign({}, newObject, { [actualKey]: extractedValue })
      }, {})

      return Object.assign({}, plainedData, newObject)
    }, {})
  })
}

module.exports = {
  extract
}
