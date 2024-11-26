const axios = require('axios'); 
const YAML = require('yamljs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const configs = YAML.load('../../../configs.yml');
const { token, port } = configs.service;

// Definir as variáveis da API
const company_token = `${token}`; // Sem aspas duplas extras
const company_name = `${token}`; // Remover as aspas e verificar se 'company_name' é esperado na API
const url = "https://api.fw7.com.br/launchpad/orders";
const externalApiUrl = `http://localhost:${port}/orders`; // Substitua pela URL da API externa

// Função para inicializar o banco de dados e criar a tabela se não existir
async function initializeDatabase() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS JSON (
      CODSEQ INTEGER PRIMARY KEY,
      CODSIS VARCHAR(255),
      Content TEXT NOT NULL,
      Date TEXT NOT NULL
  )`);

  return db;
}

// Função para inserir os dados no banco de dados com CODSIS inicialmente vazio
async function insertIntoDatabase(db, codseq, content) {
  const timestamp = new Date().toISOString();

  try {
    await db.run(`
      INSERT INTO JSON (CODSEQ, CODSIS, Content, Date) 
      VALUES (?, ?, ?, ?)
    `, [codseq, null, JSON.stringify(content), timestamp]); // CODSIS é NULL no momento da inserção

    console.log(`Registro inserido no banco: CODSEQ=${codseq}`);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      console.warn(`Erro: Pedido já importado (CODSEQ=${codseq}).`);
    } else {
      console.error(`Erro inesperado ao inserir o pedido CODSEQ=${codseq}:`, error.message);
    }
  }
}

// Função para enviar o payload (apenas o conteúdo da coluna Content) para a API externa e atualizar o banco de dados
async function sendPayloadAndUpdate(db, codseq, content) {
  try {
    console.log(`Verificando se CODSEQ=${codseq} deve ser enviado...`);

    // Verificar se CODSIS é NULL antes de enviar para a API
    const row = await db.get(`SELECT CODSIS FROM JSON WHERE CODSEQ = ?`, [codseq]);
    
    if (row.CODSIS !== null) {
      console.log(`CODSEQ=${codseq} já foi processado. Ignorando.`);
      return;
    }

    console.log(`Enviando payload para CODSEQ=${codseq}...`);

    // Formatando o conteúdo para enviar no formato desejado
    const payload = {
      orders: [
        {
          ...content,  // O conteúdo da coluna "Content" já deve ter a estrutura esperada
        }
      ]
    };

    // Enviar apenas o conteúdo (Content) formatado para a API
    const response = await axios.post(externalApiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'company_token': company_token, // Autenticação na requisição POST
        'company_name': company_name,   // Autenticação na requisição POST
      },
    });

    // Atualizar CODSIS como "Integrado" após o sucesso
    await db.run(`
      UPDATE JSON
      SET CODSIS = ?
      WHERE CODSEQ = ?
    `, ['Integrado', codseq]);

    console.log(`Banco atualizado para CODSEQ=${codseq} com CODSIS="Integrado"`);

  } catch (error) {
    console.error(`Erro ao processar CODSEQ=${codseq}:`, error.message);

    // Se ocorrer um erro, atualizar CODSIS como "Erro"
    await db.run(`
      UPDATE JSON
      SET CODSIS = ?
      WHERE CODSEQ = ?
    `, ['Erro', codseq]);

    if (error.response) {
      console.error(`Detalhes do erro da API: ${error.response.status} - ${error.response.data}`);
    }
  }
}

// Função principal para obter os dados da API e salvar no banco, seguida do envio para a API externa
async function fetchAndSave() {
  let db;
  try {
    console.log('Enviando requisição para a API...');
    const response = await axios.get(url, {
      headers: {
        'company_token': company_token,
        'company_name': company_name,
      },
    });

    if (response.status === 200) {
      console.log('Requisição bem-sucedida!');
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        db = await initializeDatabase();

        for (const item of data) {
          const codseq = item.id; // CODSEQ é derivado de `id` no payload

          await insertIntoDatabase(db, codseq, JSON.stringify(item)); // Inserir no banco com CODSIS NULL
          // Após inserir, enviamos o payload (apenas o conteúdo) para a API externa
          await sendPayloadAndUpdate(db, codseq, item); // Enviar item (já inclui o conteúdo)
        }

        console.log('Todos os registros foram processados.');
      } else {
        console.error('A resposta não é uma lista ou está vazia.');
      }
    } else {
      console.error(`Erro: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('Erro ao fazer a requisição:', error.message);
    if (error.response) {
      console.error(`Detalhes do erro: ${error.response.status} - ${error.response.data}`);
    }
  } finally {
    // Garantir que o banco de dados seja fechado mesmo em caso de erro
    if (db) {
      try {
        await db.close();
        console.log('Banco de dados fechado.');
      } catch (closeError) {
        console.error('Erro ao fechar o banco de dados:', closeError.message);
      }
    }
  }
}

// Executa a função principal
fetchAndSave();
