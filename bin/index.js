#! /usr/bin/env node
const fetchSchema = require('../lib/scraper');
const snippets = require('../lib/snippets');
const { writeFile, readFileSync, existsSync, mkdirSync } = require('fs');
const { writeJson } = require('fs-extra');
const path = require('path');
// require('dotenv-safe').config({
//   path: '.airtable-schema-generator.env',
//   example: path.resolve(__dirname, '../.env.example')
// });

const errCatch = err => {
  if (err) {
    console.log(err);
  }
};

packageInfo = JSON.parse(readFileSync('./package.json'));
settings = packageInfo['airtable-schema-generator'];
let inputFolder = '';
let outputFolder = '';
let AIRTABLE_BASE_ID = '';
let DEFAULT_VIEW = 'Grid view';
if (settings && settings.output) {
  inputFolder = settings.input || '.';
  outputFolder = settings.output;
  AIRTABLE_BASE_ID = settings.baseId || '';
  DEFAULT_VIEW = settings.defaultView || 'Grid view';
  main();
} else {
  console.log("Couldn't find Input and Output Folder Path in Settings Object:");
  console.log(settings);
  console.log(
    "Please add appropriate values for 'input' and 'output' to package.json under 'airtable-schema-generator' key."
  );
}

async function main() {
  // Use Electron to fetch schema from API Docs
  // let schema = await fetchSchema({
  //   email: process.env.AIRTABLE_EMAIL,
  //   password: process.env.AIRTABLE_PASSWORD,
  //   baseId: process.env.AIRTABLE_BASE_ID
  // });

  // Because nightmare stopped working :(
  let schema = readSchemaFromFile();
  if (!schema) {
    const baseUrl = `https://airtable.com/login?continue=/${AIRTABLE_BASE_ID}/api/docs`;
    const script = `copy(_.mapValues(application.tablesById, table => _.set(_.omit(table, ['sampleRows']),'columns',_.map(table.columns, item =>_.set(item, 'foreignTable', _.get(item, 'foreignTable.id'))))));`;
    console.log(
      `No Schema Found: Please create a schemaRaw.json file in the input folder.\n\n Navigate to this page in the browser: ${baseUrl} \n\nRun this script in the console:\n\n${script}\n\nThis will save the output to your clipboard. Open up schemaRaw.json and paste!`
    );
    return;
  }

  console.log('Retrieived Airtable Schema');

  // Simplify the schema objects to just include table names and columns
  let simplifiedSchema = simplifySchema(schema);

  // Check for metadata input file
  const schemaMetadata = getMetadata();

  console.log(
    'Found Metadata for tables: ' + Object.keys(schemaMetadata).toString()
  );

  // Generate outputs
  generateSchemaFile(simplifiedSchema);
  generateRequestFile(simplifiedSchema, schemaMetadata);
  generateConstantsFile(simplifiedSchema);
  generateAirtableFile(AIRTABLE_BASE_ID, DEFAULT_VIEW || 'Grid view');
  console.log('Finished Generating Files!');
}

// Simplify the full detailed schema into tables and column types
function simplifySchema(schema) {
  return Object.keys(schema).reduce((result, tableId) => {
    let table = schema[tableId];
    result[table.name] = {
      columns: table.columns.map(c => ({
        // Append relationship to foreign key type
        type:
          c.type === 'foreignKey'
            ? c.type + c.typeOptions.relationship
            : c.type,
        name: c.name
      }))
    };
    return result;
  }, {});
}

// Return data from `input/schemaMeta.json` as object if exists
function getMetadata() {
  const metaPath = path.resolve(inputFolder, 'schemaMeta.json');
  let schemaMetadata = {};
  if (existsSync(metaPath)) {
    schemaMetadata = JSON.parse(readFileSync(metaPath));
  }
  return schemaMetadata;
}

function readSchemaFromFile() {
  const schemaPath = path.resolve(inputFolder, 'schemaRaw.json');
  let schema = undefined;
  if (existsSync(schemaPath)) {
    schema = JSON.parse(readFileSync(schemaPath));
  }
  return schema;
}

function generateAirtableFile(baseId, defaultView) {
  const airtablePath = path.resolve(__dirname, '../airtable.js');
  const airtableContent = readFileSync(airtablePath);
  const airtableOutput = airtableContent
    .toString()
    .replace('REPLACE_BASE_ID', baseId)
    .replace('REPLACE_VIEW', defaultView);
  const savePath = path.resolve(outputFolder, 'airtable.js');
  writeFile(savePath, airtableOutput, errCatch);
}

function generateSchemaFile(schema) {
  const savePath = path.resolve(outputFolder, 'schema.json');
  writeJson(savePath, schema, errCatch);
}

// Generate `request.js` based on schema and metadata
function generateRequestFile(schema, metadata) {
  let savePath = path.resolve(outputFolder, 'request.js');
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
  let savePath = path.resolve(outputFolder, 'schema.js');
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
