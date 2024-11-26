const fs = require('fs').promises;
const path = require('path');
const { execute } = require('../../services/insert-executor');
const { chooseAdapter } = require('../../services/adapter-chooser');
const {
  loadQueryConfiguration
} = require('../../services/query-configuration-loader');
const { executeQueries } = require('../../services/query-executor');
const { log } = require('../../services/logger');

/**
 * Save each item in the JSON data to a separate file within a specified directory.
 */
const saveJSONItemsToDirectory = async (group, data) => {
  const baseDir = path.resolve(__dirname, `../../saved-json/${group}`);

  try {
    await fs.mkdir(baseDir, { recursive: true });

    for (const item of data) {
      const id = item.id;
      if (!id) throw new Error(`Item is missing an "id" field: ${JSON.stringify(item)}`);

      const filePath = path.join(baseDir, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(item, null, 2));
      log(`JSON saved at: ${filePath}`);
    }
  } catch (error) {
    log(`Error saving JSON items: ${error.message}`);
    throw new Error('Error saving JSON items');
  }
};

/**
 * Create an object with configured data and configured queries.
 */
const prepareToExecute = async () => {
  log('Preparing data to execute integration.');
  return {
    adapter: await chooseAdapter(),
    queries: await loadQueryConfiguration('selects'),
    dateToFilter: new Date()
  };
};

const saveCustomers = async ({ body }, res) => {
  const group = 'customers';
  const data = body[group];

  try {
    if (data && data.length > 0) {
      await saveJSONItemsToDirectory(group, data);

      log(`Found ${data.length} customers. Running inserts and updates!`);
      const result = await execute(group, data);
      log({ result });
      return res.json(result);
    }

    res.sendStatus(204);
  } catch (error) {
    log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

const saveCustomerSegments = async ({ body }, res) => {
  const group = 'customerSegments';
  const data = body[group];

  try {
    if (data && data.length > 0) {
      await saveJSONItemsToDirectory(group, data);

      log(`Found ${data.length} customer segments. Running inserts and updates!`);
      const result = await execute(group, data);
      log({ result });
      return res.json(result);
    }

    res.sendStatus(204);
  } catch (error) {
    log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

const saveCustomerExtraInformations = async ({ body }, res) => {
  const group = 'customerExtraInformations';
  const data = body[group];

  try {
    if (data && data.length > 0) {
      await saveJSONItemsToDirectory(group, data);

      log(`Found ${data.length} customer extra informations. Running inserts and updates!`);
      const result = await execute(group, data);
      log({ result });
      return res.json(result);
    }

    res.sendStatus(204);
  } catch (error) {
    log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

const getCustomerFromClienteFW = async ({ params }, res) => {
  log(`Consulting customer with codseq ${params.codseq}`);

  try {
    const { adapter } = await prepareToExecute();
    const foundCustomer = await executeQueries(
      adapter,
      [{ query: 'select_cliente_fw.sql' }],
      params
    );

    log(`Customer found: ${JSON.stringify(foundCustomer[0])}`);
    res.json(foundCustomer[0]);
  } catch (error) {
    log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

const getCustomerFromDocument = async ({ params }, res) => {
  log(`Consulting customer with document ${params.document}`);

  try {
    const { adapter } = await prepareToExecute();
    const foundCustomer = await executeQueries(
      adapter,
      [{ query: 'select_cliente_documento.sql' }],
      { document: params.document }
    );

    log(`Customer found: ${JSON.stringify(foundCustomer[0])}`);
    res.json(foundCustomer[0]);
  } catch (error) {
    log(error.message);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  saveCustomers,
  saveCustomerSegments,
  saveCustomerExtraInformations,
  getCustomerFromClienteFW,
  getCustomerFromDocument
};
