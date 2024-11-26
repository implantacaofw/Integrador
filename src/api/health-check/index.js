const { restartIntegration } = require('../../services/integration-restarter');

const healthCheck = (_, res) => {
  res.sendStatus(200); // Retorna resposta ao cliente
//  console.log('Chamando função restartIntegration...');
  restartIntegration(); // Chama a função do arquivo externo
};

module.exports = {
  healthCheck
};
