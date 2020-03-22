#! /usr/bin/env node
const fetchSchema = require('../lib/scraper');
const path = require('path');
const { existsSync, readFileSync } = require('fs');
const {
  generateRequestFile,
  generateAirtableFile,
  generateSchemaFile
} = require('../lib/generators');

const script = `copy(_.mapValues(application.tablesById, table => _.set(_.omit(table, ['sampleRows']),'columns',_.map(table.columns, item =>_.set(item, 'foreignTable', _.get(item, 'foreignTable.id'))))));`;

function readSettings() {
  const packageFile = readFileSync('./package.json');
  const settings = JSON.parse(packageFile)['airtable-schema-generator'];
  console.log('Found settings:');
  console.log(settings);

  // Load regular config vars
  require('dotenv-safe').config({
    path: '.env',
    example: path.resolve(__dirname, '../.env.example')
  });

  settings.baseId = process.env.AIRTABLE_BASE_ID;

  if (!settings || !settings.output || !settings.mode) {
    console.log(
      "Couldn't find Input Folder Path, Output Folder Path, and Mode in Settings Object:"
    );
    console.log(
      "Please add appropriate values for 'input', `mode`, and 'output' to package.json under 'airtable-schema-generator' key."
    );
    throw new Error('Invalid package.json settings');
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
        // Append relationship to foreign key type
        type:
          c.type === 'foreignKey'
            ? c.type + '-' + c.typeOptions.relationship
            : c.type,
        name: c.name
      }))
    };
    return result;
  }, {});
}

async function getSchemaFromAirtable(settings) {
  if (settings.mode === 'manual') {
    console.log(
      '\n## Getting Schema using Manual mode ##\nWill look for `schemaRaw.json` in specified input folder...\n\n'
    );
    const schema = readSchemaFromFile(settings);
    const baseUrl = `https://airtable.com/login?continue=/${settings.baseId}/api/docs`;

    if (!schema) {
      throw `No Schema Found: Please create a schemaRaw.json file in the input folder.\n\n Navigate to this page in the browser: ${baseUrl} \n\nRun this script in the console:\n\n${script}\n\nThis will save the output to your clipboard. Open up schemaRaw.json and paste!`;
    } else {
      console.log('Found Schema file in `schemaRaw.json` file');
      console.log(
        '\n*** Make sure this is the latest schema ***\nIf you need to update the schema follow these instructions:\n\n'
      );
      console.log(
        `1. Navigate to this page in the browser: ${baseUrl} \n2. Run this script in the console:\n\n${script}\n\nThis will save the output to your clipboard.\n3. Open up schemaRaw.json, delete everything, and paste!\n\n`
      );
      return schema;
    }
  } else {
    const mode = settings.mode === 'auto-headless' ? settings.mode : 'auto';
    console.log(
      `\n## Getting Schema using ${mode} mode. Will fetch schema from airtable.com... ##\n\n${
        mode === 'auto'
          ? 'Launching browser...'
          : 'Launching headless browser...'
      }`
    );

    // Load auto-mode config vars
    require('dotenv-safe').config({
      path: '.env',
      example: path.resolve(__dirname, '../.auto-env.example')
    });

    return await fetchSchema({
      email: process.env.AIRTABLE_EMAIL,
      password: process.env.AIRTABLE_PASSWORD,
      baseId: settings.baseId,
      headless: mode.includes('headless')
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
  const schema = await getSchemaFromAirtable(settings);

  console.log('Retrieived Airtable Schema');
  // Simplify the schema objects to just include table names and columns
  let simplifiedSchema = simplifySchema(schema);

  console.log(
    'Found Metadata for tables: ' + Object.keys(settings.schemaMeta).toString()
  );

  // Generate outputs
  generateSchemaFile(simplifiedSchema, settings);
  generateRequestFile(simplifiedSchema, settings);
  generateAirtableFile(settings);
  console.log('Finished Generating Files!');
}

try {
  const settings = readSettings();
  main(settings);
} catch (e) {
  console.log(e);
}
