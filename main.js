const fetchSchema = require('./scraper');
const snippets = require('./snippets');
const { writeFile, readFileSync, existsSync } = require('fs');
const { writeJson } = require('fs-extra');
const path = require('path');
require('dotenv-safe').config();

async function main() {
  // Use Electron to fetch schema from API Docs
  let schema = await fetchSchema({
    email: process.env.AIRTABLE_EMAIL,
    password: process.env.AIRTABLE_PASSWORD,
    baseId: process.env.AIRTABLE_BASE_ID
  });

  // Simplify the schema objects to just include table names and columns
  let simplifiedSchema = Object.keys(schema).reduce((result, tableId) => {
    let table = schema[tableId];
    result[table.name] = { columns: table.columns.map(c => c.name) };
    return result;
  }, {});

  // Check for metadata input file
  const schemaMetadata = getMetadata();

  // Generate outputs
  generateSchemaFile(simplifiedSchema);
  generateRequestFile(simplifiedSchema, schemaMetadata);
  generateConstantsFile(simplifiedSchema);
  console.log('Finished Generating Files!');
}

const errCatch = err => {
  if (err) {
    console.log(err);
  }
};

// Return data from `input/schemaMeta.json` as object if exists
function getMetadata() {
  const metaPath = path.resolve(__dirname, 'input', 'schemaMeta.json');
  let schemaMetadata = {};
  if (existsSync(metaPath)) {
    schemaMetadata = JSON.parse(readFileSync(metaPath));
  }
  return schemaMetadata;
}

function generateSchemaFile(schema) {
  const savePath = path.resolve(__dirname, 'output', 'schema.json');
  writeJson(savePath, schema, errCatch);
}

// Generate `request.js` based on schema and metadata
function generateRequestFile(schema, metadata) {
  let savePath = path.resolve(__dirname, 'output', 'request.js');
  const tables = Object.keys(schema);

  // initialize file contents with header of `request.js`
  let fileContents = snippets.requestHeader;

  // For each CRUD function, call the corresponding snippet function on each table in schema
  // and append to fileContents.
  ['create', 'read', 'update', 'delete'].forEach(fn => {
    fileContents += snippets[`${fn}RecordsHeader`];
    tables.forEach(tableName => {
      let cleanName = snippets.cleanTableName(tableName);
      fileContents += snippets[`${fn}Record`](
        cleanName,
        metadata[tableName] || {}
      );
    });
  });

  writeFile(savePath, fileContents, errCatch);
}

// Generate `schema.js` based on schema
function generateConstantsFile(schema) {
  let savePath = path.resolve(__dirname, 'output', 'schema.js');
  let fileContents = '';
  const tables = Object.keys(schema);

  // generate an object to represent Airtable Table Names
  fileContents += snippets.tableHeader;
  tables.forEach(tableName => {
    fileContents += snippets.tableConstant(tableName);
  });
  fileContents += snippets.generalConstantsFooter;

  // generate an object to represent mapping between
  // jsFormatted column names and Airtable column names
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
