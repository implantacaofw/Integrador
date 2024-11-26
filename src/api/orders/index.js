const fs = require('fs').promises;
const path = require('path');
const { execute } = require('../../services/insert-executor');
const { log } = require('../../services/logger');

/**
 * Ensure a directory exists, creating it if necessary.
 */
const ensureDirectoryExists = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    throw new Error('Error ensuring directory exists');
  }
};

/**
 * Save each order to a separate file within the orders directory.
 */
const saveOrderJSONToDirectory = async (data) => {
  const baseDir = path.resolve(__dirname, '../../saved-json/orders');

  try {
    // Ensure the directory exists
    await ensureDirectoryExists(baseDir);

    // Save each order as a separate file
    for (const order of data) {
      const id = order.id;
      if (!id) throw new Error(`Order is missing an "id" field: ${JSON.stringify(order)}`);

      const filePath = path.join(baseDir, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(order, null, 2));
    }
  } catch (error) {
    throw new Error('Error saving order JSON');
  }
};


/**
 * Save orders to the database and store JSON files.
 */
const saveOrder = async ({ body }, res) => {
  const group = 'orders';
  const data = body[group];
  const totalOrders = data.length;
  const hasOrders = totalOrders >= 1;

  if (hasOrders) {
    log('=================');
    log(`Found ${totalOrders} orders. Running inserts and updates!`);
    log('=================');

    try {
      // Save JSON files for each order
      await saveOrderJSONToDirectory(data);

      // Execute the database operation
      const result = await execute(group, data);
      return res.json(result);
    } catch (error) {
      log(error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.sendStatus(204);
};

module.exports = {
  saveOrder
};
