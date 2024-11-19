# FW7 - integrador.service

[![Build Status](https://semaphoreci.com/api/v1/projects/98776d66-5d7b-418b-ab51-e9109daee5b0/2271518/badge.svg)](https://semaphoreci.com/fw7/fw7-integrador-service)

## Proposta

Olá amigos! Este projeto é referente ao integrador que colocamos pra rodar nas máquina/servidores de nosso clientes.

Tem por objetivo conectar à um banco, ler algumas views, transformar o resultado em um JSON e nos enviar. Dessa forma garantirmos e facilitamos nossa integração com outros sistemas.

Logo a baixo, você pode conferir a arquitetura proposta pra esse integrador, e perceber que há outros projetos adjacentes a este:

### [Aqui vai a imagem da arquitetura proposta]

## Tecnologias empregadas

Usamos um set de tecnologias de ponta pra este projeto, são elas:

- JavaScript
- NodeJS
- Jest
- Express
- Sequelize

## Deseja rodar o projeto localmente?

Claro, sem problemas! Como de costume, clone o projeto em sua máquina e antes de tudo, por favor:

```javascript
npm install // Para instalar todas as dependências
```

Para então subir os projeto, basta rodar o comando:

```javascript
npm run dev
```

Observe no terminal que será impresso um endereço, algo como *http://localhost:[porta]*, é neste endereço que o serviço responderá. Ah, esqueci de mencionar, dada as tecnologias descritas logo acima, fica claro que você precisa ter um ambiente node configurado e rodando na sua máquina.

## Muito importante

Todas as configurações do serviço são definidas no arquivo **configs.yml**, tenha cuidado ao subir o serviço pois dependendo das configs que você adicionar, vai causar problemas à alguém.

Qualquer dúvida, sugestão, melhoria, não deixe de me procurar ;)

Abraços!