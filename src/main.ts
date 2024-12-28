import { stringify } from 'csv-stringify'
import { gte } from 'drizzle-orm'
import fs from 'node:fs'
import { Transform } from 'node:stream'
import Cursor from 'pg-cursor'
import { schema } from './db/schema'
import { db } from './lib/db'

// Query construida com Drizzle ORM
const { sql, params } = db
  .select()
  .from(schema.users)
  .where(gte(schema.users.age, 18))
  .orderBy(schema.users.name)
  .toSQL()

// Criação de arquivo de saída CSV
const outputFile = './output.csv'
const fileStream = fs.createWriteStream(outputFile)

// Configuração do CSV
const csvStream = stringify({
  delimiter: ',',
  header: true,
  columns: [
    { key: 'name', header: 'Nome' },
    { key: 'age', header: 'Idade' },
    { key: 'email', header: 'Email' },
  ],
})

// Envia para o CSV um item por vez ao inces de 100
const transform = new Transform({
  objectMode: true,
  transform(chunks, _, callback) {
    if (Array.isArray(chunks)) {
      chunks.forEach(item => {
        csvStream.write(item)
      })
    } else {
      csvStream.write(chunks)
    }
    callback()
  },
})

async function fetchDataAndGenerateCSV() {
  try {
    const client = await db.$client.connect()

    if (!client) throw new Error('Erro ao conectar ao banco de dados.')

    const cursorQuery = client.query(new Cursor(sql, params))

    // Função para ler os dados do cursor em lotes
    cursorQuery.read(100, (err, rows) => {
      if (err) {
        console.error('Erro ao ler dados do cursor:', err)
        return
      }

      // console.log(rows)
      if (rows.length === 0) {
        cursorQuery.close(() => {
          console.log('Cursor fechado.')
        })
        transform.end() // Finalizar o processo de escrita no CSV
      }

      // Enviar as linhas para o transform
      transform.write(rows)
      // Continuar a leitura do cursor
      cursorQuery.read(100)
    })

    // Garantir que o CSV seja finalizado corretamente
    csvStream.pipe(fileStream)
  } catch (err) {
    console.error('Erro ao processar dados e gerar CSV:', err)
  }
}

// Função para reconectar ao banco de dados em caso de falha
async function reconnectToDatabase() {
  try {
    await db.$client.connect()
    console.log('Reconectado ao banco de dados.')
  } catch (err) {
    console.error('Erro ao tentar reconectar ao banco de dados:', err)
  }
}

// Função principal para garantir execução segura
async function run() {
  try {
    await fetchDataAndGenerateCSV()
  } catch (err) {
    console.error('Erro durante a execução:', err)
    // Tentar reconectar ao banco de dados em caso de falha
    await reconnectToDatabase()
    await fetchDataAndGenerateCSV() // Tenta novamente após reconectar
  }
}

// Inicia o processo
run()
