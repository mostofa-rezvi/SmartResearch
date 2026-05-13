const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const ASSETS_PATH = path.join(__dirname, '../../assets');

async function testParse() {
  const filePath = path.join(ASSETS_PATH, 'scimagojr 2024.csv');
  console.log('Testing parse for:', filePath);
  
  const parser = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ';',
      columns: true,
      to_line: 5,
    })
  );

  for await (const record of parser) {
    console.log('Record:', JSON.stringify(record, null, 2));
  }
}

testParse().then(() => pool.end());
