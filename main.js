const fetchSchema = require('./scraper');
const snippets = require('./snippets');
const { writeFile, readFileSync, existsSync } = require('fs');
const { writeJson } = require('fs-extra');
const path = require('path');
require('dotenv-safe').config();

async function main() {
  let schema = await fetchSchema({
    email: process.env.AIRTABLE_EMAIL,
    password: process.env.AIRTABLE_PASSWORD,
    baseId: process.env.AIRTABLE_BASE_ID
  });

  let simplifiedSchema = Object.keys(schema).reduce((result, tableId) => {
    let table = schema[tableId];
    result[table.name] = { columns: table.columns.map(c => c.name) };
    return result;
  }, {});
  simplifiedSchema = updateSchemaFile(simplifiedSchema);
  generateRequestFile(simplifiedSchema);
  generateConstantsFile(simplifiedSchema);
  console.log('Finished!');
}

const errCatch = err => {
  if (err) {
    console.log(err);
  }
};

function updateSchemaFile(schema) {
  let savePath = path.resolve(__dirname, 'output', 'schema.json');
  let curSchema = {};
  let combinedSchema = {};
  if (existsSync(savePath)) {
    curSchema = JSON.parse(readFileSync(savePath));
  }
  let newTables = Object.keys(schema);

  newTables.forEach(tableName => {
    combinedSchema[tableName] = schema[tableName];
    if (curSchema.hasOwnProperty(tableName)) {
      combinedSchema[tableName].lookupFields =
        curSchema[tableName].lookupFields;
    }
  });
  writeJson(savePath, combinedSchema, errCatch);
  return combinedSchema;
}

function generateRequestFile(schema) {
  let savePath = path.resolve(__dirname, 'output', 'request.js');
  let fileContents = snippets.requestHeader;
  const tables = Object.keys(schema);

  ['create', 'read', 'update', 'delete'].forEach(fn => {
    fileContents += snippets[`${fn}RecordsHeader`];
    tables.forEach(tableName => {
      let cleanName = snippets.cleanTableName(tableName);
      fileContents += snippets[`${fn}Record`](
        cleanName,
        schema[tableName].lookupFields
      );
    });
  });

  writeFile(savePath, fileContents, errCatch);
}

function generateConstantsFile(schema) {
  let savePath = path.resolve(__dirname, 'output', 'schema.js');
  let fileContents = '';
  const tables = Object.keys(schema);

  fileContents += snippets.tableHeader;
  tables.forEach(tableName => {
    fileContents += snippets.tableConstant(tableName);
  });
  fileContents += snippets.generalConstantsFooter;

  fileContents += snippets.columnsHeader;
  tables.forEach(tableName => {
    fileContents += snippets.columnConstant(
      tableName,
      schema[tableName].columns
    );
  });
  fileContents += snippets.generalConstantsFooter;

  writeFile(savePath, fileContents, errCatch);
}

main();
