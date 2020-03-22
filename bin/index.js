#! /usr/bin/env node
const fetchSchema = require('../lib/scraper');
const path = require('path');
const { existsSync } = require('fs');
const {
  generateRequestFile,
  generateAirtableFile,
  generateSchemaFile
} = require('../lib/generators');

function readSettings() {
  const packageFile = readFileSync('./package.json');
  const settings = JSON.parse(packageFile)['airtable-schema-generator'];

  if (!settings || !settings.output || !settings.baseId) {
    console.log(
      "Couldn't find Input Folder Path, Output Folder Path and Base ID in Settings Object:"
    );
    console.log(settings);
    console.log(
      "Please add appropriate values for 'baseId', 'input', and 'output' to package.json under 'airtable-schema-generator' key."
    );
    throw 'Invalid package.json settings';
  }

  if (settings.mode === 'manual' && !settings.input) {
    throw 'If mode is set to manual, input folder must be specified to find `schemaRaw.json`';
  }

  return {
    outputFolder: settings.output,
    inputFolder: settings.input,
    baseId: settings.baseId,
    mode: settings.mode,
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
        type: c.type,
        name: c.name
      }))
    };
    return result;
  }, {});
}

async function getSchemaFromAirtable(settings) {
  if (settings.mode === 'manual') {
    const schema = readSchemaFromFile(settings);
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
      return schema;
    }
  } else {
    // Load config vars
    require('dotenv-safe').config({
      path: '.airtable.env',
      example: path.resolve(__dirname, '../.env.example')
    });

    return await fetchSchema({
      email: process.env.AIRTABLE_EMAIL,
      password: process.env.AIRTABLE_PASSWORD,
      baseId: settings.baseId,
      headless: settings.mode === 'auto-headless'
    });
  }
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
  const schema = getSchemaFromAirtable(settings);

  console.log('Retrieived Airtable Schema');
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
