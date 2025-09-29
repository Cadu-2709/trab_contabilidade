// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', // seu usuário do postgres
  host: 'localhost',
  database: 'contabilidade', // o nome do seu banco de dados
  password: 'mudei', // sua senha do postgres
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};