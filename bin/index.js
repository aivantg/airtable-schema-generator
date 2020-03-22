#! /usr/bin/env node
const fetchSchema = require('../lib/scraper');
const path = require('path');
const { existsSync } = require('fs');
const {
  generateRequestFile,
  generateAirtableFile,
  generateConstantsFile,
  generateSchemaFile
} = require('../lib/generators');

// Get Airtable Credentials into environment
// require('dotenv-safe').config({
//   path: '.airtable-schema-generator.env',
//   example: path.resolve(__dirname, '../.env.example')
// });

const script = `copy(_.mapValues(application.tablesById, table => _.set(_.omit(table, ['sampleRows']),'columns',_.map(table.columns, item =>_.set(item, 'foreignTable', _.get(item, 'foreignTable.id'))))));`;

function readSettings() {
  const packageFile = readFileSync('./package.json');
  const settings = JSON.parse(packageFile)['airtable-schema-generator'];

  if (!settings || !settings.output || !settings.input || !settings.baseId) {
    console.log(
      "Couldn't find Input Folder Path, Output Folder Path and Base ID in Settings Object:"
    );
    console.log(settings);
    console.log(
      "Please add appropriate values for 'baseId', 'input', and 'output' to package.json under 'airtable-schema-generator' key."
    );
    throw 'Invalid package.json settings';
  }
  return {
    outputFolder: settings.output,
    inputFolder: settings.input,
    baseId: settings.baseId,
    defaultView: settings.defaultView || 'Grid view',
    schemaMeta: settings.schemaMeta || {}
  };
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

function readSchemaFromFile(settings) {
  const schemaPath = path.resolve(settings.inputFolder, 'schemaRaw.json');
  let schema = undefined;
  if (existsSync(schemaPath)) {
    schema = JSON.parse(readFileSync(schemaPath));
  }
  return schema;
}

async function main(settings) {
  // Use Electron to fetch schema from API Docs
  // let schema = await fetchSchema({
  //   email: process.env.AIRTABLE_EMAIL,
  //   password: process.env.AIRTABLE_PASSWORD,
  //   baseId: settings.baseId
  // });

  // Because nightmare stopped working :(
  let schema = readSchemaFromFile();
  if (!schema) {
    const baseUrl = `https://airtable.com/login?continue=/${settings.baseId}/api/docs`;
    throw `No Schema Found: Please create a schemaRaw.json file in the input folder.\n\n Navigate to this page in the browser: ${baseUrl} \n\nRun this script in the console:\n\n${script}\n\nThis will save the output to your clipboard. Open up schemaRaw.json and paste!`;
  } else {
    console.log('Found Schema file in `schemaRaw.json` file');
    console.log(
      'Make sure this is the latest schema. If you need to update the schema follow these instructions:\n\n'
    );
    console.log(
      `Navigate to this page in the browser: ${baseUrl} \n\nRun this script in the console:\n\n${script}\n\nThis will save the output to your clipboard. Open up schemaRaw.json, delete everything, and paste!\n\n`
    );
  }

  console.log('Retrieved Airtable Schema');

  // Simplify the schema objects to just include table names and columns
  let simplifiedSchema = simplifySchema(schema);

  console.log(
    'Found Metadata for tables: ' + Object.keys(settings.schemaMeta).toString()
  );

  // Generate outputs
  generateSchemaFile(simplifiedSchema, settings);
  generateRequestFile(simplifiedSchema, settings);
  generateConstantsFile(simplifiedSchema, settings);
  generateAirtableFile(settings);
  console.log('Finished Generating Files!');
}

try {
  const settings = readSettings();
  main(settings);
} catch (e) {
  console.log(e);
}
