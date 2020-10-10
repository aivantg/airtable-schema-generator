const snippets = require('../lib/snippets');
const { writeFile, readFileSync } = require('fs');
const { writeJson } = require('fs-extra');
const path = require('path');

const errCatch = (err) => {
  if (err) {
    console.log(err);
  }
};

function generateAirtableFile(settings) {
  const airtablePath = path.resolve(__dirname, '../airtable.js');
  const airtableContent = readFileSync(airtablePath);
  let airtableOutput = airtableContent
    .toString()
    .replace('REPLACE_VIEW', settings.defaultView)
    .replace(
      'REPLACE_IMPORT_LIB',
      settings.airlock ? '@calblueprint/airlock' : 'airtable'
    )
    .replace(
      "'REPLACE_ENDPOINT'",
      settings.airlock
        ? 'process.env.REACT_APP_AIRTABLE_ENDPOINT_URL'
        : "'https://api.airtable.com'"
    )
    .replace(
      "'REPLACE_API_KEY'",
      settings.airlock ? "'airlock'" : 'process.env.REACT_APP_AIRTABLE_API_KEY'
    );

  const savePath = path.resolve(settings.outputFolder, 'airtable.js');
  writeFile(savePath, airtableOutput, errCatch);
}

// Generate `request.js` based on schema and metadata
function generateRequestFile(schema, settings) {
  let savePath = path.resolve(settings.outputFolder, 'request.js');
  const tables = Object.keys(schema);

  // initialize file contents with header of `request.js`
  let fileContents = snippets.requestHeader;

  // For each CRUD function, call the corresponding snippet function on each table in schema
  // and append to fileContents.
  ['create', 'read', 'update', 'delete'].forEach((fn) => {
    fileContents += snippets[`${fn}RecordsHeader`];
    tables.forEach((tableName) => {
      let cleanName = snippets.cleanTableName(tableName);
      fileContents += snippets[`${fn}Record`](
        cleanName,
        settings.schemaMeta[tableName] || {}
      );
    });
  });

  // End file with newline
  fileContents += '\n';

  writeFile(savePath, fileContents, errCatch);
}

// Generate `schema.js` based on schema
function generateSchemaFile(schema, settings) {
  let savePath = path.resolve(settings.outputFolder, 'schema.js');
  let fileContents = '';
  const tables = Object.keys(schema);

  // generate an object to represent Airtable Table Names
  fileContents += snippets.tableHeader;
  tables.forEach((tableName) => {
    fileContents += snippets.tableConstant(tableName);
  });
  fileContents += snippets.generalConstantsFooter;

  // generate an object to represent mapping between
  // jsFormatted column names and Airtable column names
  fileContents += snippets.columnsHeader;
  tables.forEach((tableName) => {
    fileContents += snippets.columnConstant(
      tableName,
      schema[tableName].columns
    );
  });
  fileContents += snippets.generalConstantsFooter;

  writeFile(savePath, fileContents, errCatch);
}

module.exports = {
  generateRequestFile,
  generateSchemaFile,
  generateAirtableFile,
};
