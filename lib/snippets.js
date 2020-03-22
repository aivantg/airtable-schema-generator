// Convert column name to javascript-usable name
const cleanColumnName = column => {
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

const cleanTableName = name => name.replace(/\(|\)|\s/g, '');

const lowercaseFirstChar = s => {
  return s.charAt(0).toLowerCase() + s.substring(1);
};

const uppercaseFirstChar = s => {
  return s.charAt(0).toUpperCase() + s.substring(1);
};

module.exports = {
  cleanColumnName,
  cleanTableName,
  requestHeader: `/* eslint no-restricted-imports: 0 */

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
  updateRecord,
  getAllRecords,
  getRecordsByAttribute,
  getRecordById,
  deleteRecord
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

  createRecord: tableName => `
export const create${tableName} = async record => { 
    return createRecord(Tables.${tableName}, record)
};
`,
  readRecord: (tableName, { lookupFields }) => {
    let result = `
export const get${tableName}ById = async id => { 
  return getRecordById(Tables.${tableName}, id);
};

export const getAll${tableName}${
      tableName.charAt(tableName.length - 1).toLowerCase === 's' ? '' : 's'
    } = async () => { 
  return getAllRecords(Tables.${tableName});
};
`;
    if (lookupFields) {
      lookupFields.forEach(field => {
        let cleanName = cleanColumnName({ name: field });
        result += `
export const get${tableName}sBy${cleanName} = async value => { 
    return getRecordsByAttribute(Tables.${tableName}, Columns[Tables.${tableName}].${lowercaseFirstChar(
          cleanName
        )}.name, value);
};
`;
      });
    }
    return result;
  },
  updateRecord: tableName => `
export const update${tableName} = async (id, recordUpdates) => { 
  return updateRecord(Tables.${tableName}, id, recordUpdates);
};
`,
  deleteRecord: tableName => `
export const delete${tableName} = async id => { 
    return deleteRecord(Tables.${tableName}, id);
};`,
  tableHeader: `/*
    THIS IS A GENERATED FILE
    Changes might be overwritten in the future, edit with caution!
*/\n\nexport const Tables = {\n`,
  columnsHeader: `\nexport const Columns = {\n`,
  generalConstantsFooter: `};\n`,
  tableConstant: tableName => {
    let cleanName = cleanTableName(tableName);
    return `\t${cleanName}: '${tableName}',\n`;
  },
  columnConstant: (tableName, columns) => {
    let result = `\t"${tableName}": {\n`;
    columns.forEach(c => {
      // Lowercase the clean name so follows JS conventions
      let cleanName = lowercaseFirstChar(cleanColumnName(c));
      result += `\t\t${cleanName}: {name:\`${c.name}\`, type:\`${c.type}\`},\n`;
    });
    result += '\t},\n';
    return result;
  }
};
