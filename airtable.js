/* eslint no-restricted-imports: 0 */
/*
  THIS IS A GENERATED FILE
  Changes might be overwritten in the future, edit with caution!

  Helper functions that makes airtable API calls directly
  Not meant to be called directly by functions outside of request.js

  If you're adding a new function: make sure you add a corresponding test (at least 1) for it in airtable.spec.js
*/
import Airtable from 'REPLACE_IMPORT_LIB';
import { Columns } from './schema';

const BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;

const API_KEY = 'REPLACE_API_KEY';
const ENDPOINT_URL = 'REPLACE_ENDPOINT';
const VIEW = 'REPLACE_VIEW';

Airtable.configure({
  endpointUrl: ENDPOINT_URL,
  apiKey: API_KEY,
});

const base = Airtable.base(BASE_ID);

// Transformation Utilities

const fromAirtableFormat = (record, table) => {
  const columns = Columns[table];
  const invalidColumns = [];
  if (!columns) {
    console.log(
      `WARNING [fromAirtableFormat]: Could not convert record from Airtable. Could not find table: ${table}. \n\nIf the Airtable schema has recently changed, please run the schema generator and try again.`
    );
  }

  // Invert columns object
  const invertedColumns = Object.keys(columns).reduce(
    (obj, key) => ({
      ...obj,
      [columns[key].name]: { name: key, type: columns[key].type },
    }),
    {}
  );

  // Create a new object mapping each record attribute
  return Object.keys(record).reduce((obj, origColumn) => {
    const jsFormattedName = invertedColumns[origColumn];

    if (!jsFormattedName) {
      console.log(
        `WARNING [fromAirtableFormat]: Could not convert ${table} record from Airtable. Could not find column of name "${origColumn}" in local copy of schema.js. \n\nIf the Airtable schema has recently changed, please run the schema generator and try again.`
      );
      invalidColumns.push(jsFormattedName);
      return obj;
    }

    let value = record[origColumn];

    // Unwrap array if it's a single foreign key relationship
    if (jsFormattedName.type === 'foreignKey-one') {
      [value] = value; // Array Destructuring
    }

    return {
      ...obj,
      [jsFormattedName.name]: value,
    };
  }, {});
};

const toAirtableFormat = (record, table) => {
  const columns = Columns[table];
  const invalidColumns = [];
  if (!columns) {
    console.log(
      `WARNING [toAirtableFormat]: Could not convert record for Airtable. Could not find table: ${table}. \n\nIf the Airtable schema has recently changed, please run the schema generator and try again.`
    );
  }

  return Object.keys(record).reduce((obj, jsFormattedColumnName) => {
    const origColumn = columns[jsFormattedColumnName];

    if (!origColumn) {
      console.log(
        `WARNING [toAirtableFormat]: Could not convert ${table} record from Airtable. Could not find column of name "${jsFormattedColumnName}" in local copy of schema.js. \n\nPlease check your "update" and "create" calls and ensure that your column names exist. If that doesn't work, run the schema generator again to update.`
      );
      invalidColumns.push(origColumn);
      return obj;
    }

    let value = record[jsFormattedColumnName];
    if (origColumn.type === 'foreignKey-one') {
      value = [value]; // rewrap array if it's a single foreign key relationship
    }

    return { ...obj, [origColumn.name]: value };
  }, {});
};

// ******** CRUD ******** //
// Given a table and a record object, create a record on Airtable.
function createRecord(table, record) {
  const transformedRecord = toAirtableFormat(record, table);
  return base(table)
    .create([{ fields: transformedRecord }])
    .then((records) => {
      return records[0].getId();
    })
    .catch((err) => {
      throw err;
    });
}

function createRecords(table, records) {
  const transformedRecords = records.map((record) => ({
    fields: toAirtableFormat(record, table),
  }));
  return base(table)
    .create(transformedRecords)
    .then((newRecords) => {
      return newRecords.map((newRecord) => newRecord.getId());
    })
    .catch((err) => {
      throw err;
    });
}

// Given a table, get all records from Airtable

function getAllRecords(table, filterByFormula = '', sort = []) {
  return base(table)
    .select({
      view: VIEW,
      filterByFormula,
      sort,
    })
    .all()
    .then((records) => {
      if (records === null || records.length < 1) {
        return [];
      }

      return records.map((record) => fromAirtableFormat(record.fields, table));
    })
    .catch((err) => {
      throw err;
    });
}

// Given a table and record ID, return the associated record object using a Promise.
function getRecordById(table, id) {
  return base(table)
    .find(id)
    .then((record) => {
      return fromAirtableFormat(record.fields, table);
    })
    .catch((err) => {
      throw err;
    });
}

/*
  Given the desired table, field type (column), and field value ('nick wong' or 'aivant@pppower.io'),
  return the associated record object.

  NOTE: `fieldValue` is a generic type - values can be a bit tricky. Notably, string type names must be further escaped.
  Usage:
    - getStoresByStoreName("'A & S Grocery'") --> `{Store Name} = 'A & S Grocery'`
    - getProductsByPoints(325) --> `{Points} = 325`
    - getStoresByOpen('TRUE()') --> `{Open} = TRUE()`
*/
function getRecordsByAttribute(
  table,
  fieldType,
  fieldValue,
  filterByFormula = '',
  sort = []
) {
  return base(table)
    .select({
      view: VIEW,
      filterByFormula: filterByFormula
        ? `AND(${filterByFormula}, {${fieldType}}=${fieldValue})`
        : `({${fieldType}}="${fieldValue}")`,
      sort,
    })
    .all()
    .then((records) => {
      if (!records || records.length < 1) {
        // No need for this to throw an error, sometimes there're just no values
        return [];
      }

      return records.map((record) => fromAirtableFormat(record.fields, table));
    })
    .catch((err) => {
      throw err;
    });
}

// Given a table, a record ID, and an object of fields to update, update a record on Airtable.
function updateRecord(table, id, updatedRecord) {
  const transformedRecord = toAirtableFormat(updatedRecord, table);
  return base(table)
    .update([
      {
        id,
        fields: transformedRecord,
      },
    ])
    .then((records) => {
      return records[0].id;
    })
    .catch((err) => {
      throw err;
    });
}

// Given a table, an array of record IDs, and an array of objects of fields to update, update records on Airtable.
function updateRecords(table, updatedRecords) {
  const transformedRecords = updatedRecords.map((updatedRecord) => ({
    id: updatedRecord.id,
    fields: toAirtableFormat(updatedRecord.fields, table),
  }));
  return base(table)
    .update(transformedRecords)
    .then((records) => {
      return records[0].id;
    })
    .catch((err) => {
      throw err;
    });
}

// Given a table and a record ID, delete a record on Airtable.
function deleteRecord(table, id) {
  return base(table)
    .destroy([id])
    .then((records) => {
      return records[0].fields;
    })
    .catch((err) => {
      throw err;
    });
}

export {
  base,
  fromAirtableFormat,
  toAirtableFormat,
  createRecord,
  createRecords,
  getAllRecords,
  getRecordById,
  getRecordsByAttribute,
  updateRecord,
  updateRecords,
  deleteRecord,
};
