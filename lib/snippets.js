// Convert column name to javascript-usable name
const cleanColumnName = (column) => {
  let cleanName = column.name
    .toLowerCase()
    .split(' ')
    .map(uppercaseFirstChar)
    .join('')
    .replace(/\(|\)|\s|"|'|\?/g, '');

  if (column.type && column.type.includes('foreignKey')) {
    return column.type.includes('many')
      ? cleanName.substr(0, cleanName.length - 1) + 'Ids'
      : cleanName + 'Id';
  } else {
    return cleanName;
  }
};

const cleanTableName = (name) => name.replace(/\(|\)|\s/g, '');

const pluralize = (name) =>
  name.charAt(name.length - 1) === 's' ? name : name.concat('s');

const lowercaseFirstChar = (s) => {
  return s.charAt(0).toLowerCase() + s.substring(1);
};

const uppercaseFirstChar = (s) => {
  return s.charAt(0).toUpperCase() + s.substring(1);
};

module.exports = {
  cleanColumnName,
  cleanTableName,
  requestHeader: `/* eslint no-restricted-imports: 0 */
/* eslint-disable no-unused-vars */

/*
  THIS IS A GENERATED FILE
  Changes might be overwritten in the future, edit with caution!

  Wrapper functions around functions in airtable.js that interact with Airtable, designed
  to provide basic functionality

  If you're adding a new function: make sure you add a corresponding test (at least 1) for it in request.spec.js

*/

import { Tables, Columns } from './schema';
import {
  createRecord,
  createRecords,
  updateRecord,
  updateRecords,
  getAllRecords,
  getRecordsByAttribute,
  getRecordById,
  deleteRecord,
} from './airtable';
`,

  createRecordsHeader: `
/*
 ******* CREATE RECORDS *******
 */
`,
  readRecordsHeader: `
/*
 ******* READ RECORDS *******
 */
`,
  updateRecordsHeader: `
/*
 ******* UPDATE RECORDS *******
 */
`,
  deleteRecordsHeader: `
/*
 ******* DELETE RECORDS *******
 */
`,

  createRecord: (tableName) => `
export const create${tableName} = async (record) => {
  return createRecord(Tables.${tableName}, record);
};

export const createMany${pluralize(tableName)} = async (records) => {
  const createPromises = [];
  const numCalls = Math.ceil(records.length / 10);
  for (let i = 0; i < numCalls; i += 1) {
    const subset = records.slice(i * 10, (i + 1) * 10);
    if (subset.length > 0)
      createPromises.push(createRecords(Tables.${tableName}, subset));
  }
  return Promise.all(createPromises);
};
`,
  readRecord: (tableName, { lookupFields }) => {
    let result = `
export const get${tableName}ById = async (id) => {
  return getRecordById(Tables.${tableName}, id);
};

export const get${pluralize(
      tableName
    )}ByIds = async ( ids, filterByFormula = '', sort = []
) => {
  let formula = ${'`OR(${'}ids.reduce(
    (f, id) => ${"`${f} {ID}='${id}',`"},
    ''
  )${'} 1 < 0)`'};
  formula = filterByFormula ? ${'`AND(${filterByFormula}, ${formula})`'} : formula;
  return getAllRecords(Tables.${tableName}, formula, sort);
};

export const getAll${pluralize(
      tableName
    )} = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.${tableName}, filterByFormula, sort);
};
`;
    if (lookupFields) {
      lookupFields.forEach((field) => {
        let cleanName = cleanColumnName({ name: field });
        result += `
export const get${pluralize(tableName)}By${cleanName} = async (
  value,
  filterByFormula = '',
  sort = []
) => {
  return getRecordsByAttribute(Tables.${tableName}, Columns[Tables.${tableName}].${lowercaseFirstChar(
          cleanName
        )}.name, value, filterByFormula, sort);
};
`;
      });
    }
    return result;
  },
  updateRecord: (tableName) => `
export const update${tableName} = async (id, recordUpdates) => {
  return updateRecord(Tables.${tableName}, id, recordUpdates);
};

export const updateMany${pluralize(tableName)} = async (recordUpdates) => {
  const updatePromises = [];
  const numCalls = Math.ceil(recordUpdates.length / 10);
  for (let i = 0; i < numCalls; i += 1) {
    const subset = recordUpdates.slice(i * 10, (i + 1) * 10);
    if (subset.length > 0)
      updatePromises.push(updateRecords(Tables.${tableName}, subset));
  }
  return Promise.all(updatePromises);
};
`,
  deleteRecord: (tableName) => `
export const delete${tableName} = async (id) => {
  return deleteRecord(Tables.${tableName}, id);
};`,
  tableHeader: `/*
    THIS IS A GENERATED FILE
    Changes might be overwritten in the future, edit with caution!
*/\n\nexport const Tables = {\n`,
  columnsHeader: `\nexport const Columns = {\n`,
  generalConstantsFooter: `};\n`,
  tableConstant: (tableName) => {
    let cleanName = cleanTableName(tableName);
    return `\t${cleanName}: '${tableName}',\n`;
  },
  columnConstant: (tableName, columns) => {
    let result = `\t"${tableName}": {\n`;
    columns.forEach((c) => {
      // Lowercase the clean name so follows JS conventions
      let cleanName = lowercaseFirstChar(cleanColumnName(c));
      result += `\t\t${cleanName}: {name:\`${c.name}\`, type:\`${c.type}\`},\n`;
    });
    result += '\t},\n';
    return result;
  },
};
