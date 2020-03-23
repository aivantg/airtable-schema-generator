/* eslint no-restricted-imports: 0 */
/*
  THIS IS A GENERATED FILE
  Changes might be overwritten in the future, edit with caution!

  Helper functions that makes airtable API calls directly
  Not meant to be called directly by functions outside of request.js

  If you're adding a new function: make sure you add a corresponding test (at least 1) for it in airtable.spec.js
*/
import Airtable from 'airtable';
import { Columns } from './schema';

const BASE_ID = 'REPLACE_BASE_ID';
const VIEW = 'REPLACE_VIEW';
const ENDPOINT_URL = 'https://api.airtable.com';

const apiKey = process.env.AIRTABLE_API_KEY;

Airtable.configure({
  endpointUrl: ENDPOINT_URL,
  apiKey
});

const base = Airtable.base(BASE_ID);

// Transformation Utilities

const fromAirtableFormat = (record, table) => {
  const columns = Columns[table];
  if (!columns) {
    throw new Error(
      `Error converting record from Airtable. Could not find table: ${table}`
    );
  }

  // Invert columns object
  const invertedColumns = Object.keys(columns).reduce(
    (obj, key) => ({
      ...obj,
      [columns[key].name]: { name: key, type: columns[key].type }
    }),
    {}
  );

  // Create a new object mapping each record attribute
  return Object.keys(record).reduce((obj, origColumn) => {
    const jsFormattedName = invertedColumns[origColumn];

    if (!jsFormattedName) {
      throw new Error(
        `Error converting ${table} record from Airtable. Could not find column of name "${origColumn}" in local copy of schema.js. Please run the schema generator again to get updates`
      );
    }

    let value = record[origColumn];

    // Unwrap array if it's a single foreign key relationship
    if (jsFormattedName.type === 'foreignKey-one') {
      [value] = value; // Array Destructuring
    }

    return {
      ...obj,
      [jsFormattedName.name]: value
    };
  }, {});
};

const toAirtableFormat = (record, table) => {
  const columns = Columns[table];
  if (!columns) {
    throw new Error(
      `Error converting record for Airtable. Could not find table: ${table}`
    );
  }

  return Object.keys(record).reduce((obj, jsFormattedColumnName) => {
    const origColumn = columns[jsFormattedColumnName];

    if (!origColumn) {
      throw new Error(
        `Error converting ${table} record from Airtable. Could not find column of name "${jsFormattedColumnName}" in local copy of schema.js. Please check your "update" and "create" calls and ensure that your column names exist. If that doesn't work, run the schema generator again to get updates.`
      );
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
  return new Promise(function process(resolve, reject) {
    base(table)
      .create([{ fields: transformedRecord }])
      .then(records => {
        resolve(records[0].getId());
      })
      .catch(err => reject(err));
  });
}

function getAllRecords(table, filterByFormula = '', sort = []) {
  return base(table)
    .select({
      view: VIEW,
      filterByFormula,
      sort
    })
    .all()
    .then(records => {
      if (records === null || records.length < 1) {
        const msg = `No record was retrieved using this ${table}.`;
        throw new Error(msg);
      }

      return records.map(record => fromAirtableFormat(record.fields, table));
    })
    .catch(err => {
      throw err;
    });
}

// Given a table and record ID, return the associated record object using a Promise.
function getRecordById(table, id) {
  return base(table)
    .find(id)
    .then(record => {
      return fromAirtableFormat(record.fields, table);
    })
    .catch(err => {
      throw err;
    });
}

/*
  Given the desired table, field type (column), and field ('nick wong' or 'aivant@pppower.io'),
  return the associated record object.
*/
function getRecordsByAttribute(table, fieldType, field, sort = []) {
  return base(table)
    .select({
      view: VIEW,
      filterByFormula: `{${fieldType}}='${field}'`,
      sort
    })
    .all()
    .then(records => {
      if (!records || records.length < 1) {
        return [];
        // No need for this to throw an error, sometimes there're just no values
      }

      return records.map(record => fromAirtableFormat(record.fields, table));
    })
    .catch(err => {
      throw err;
    });
}

// Given a table and a record object, update a record on Airtable.
function updateRecord(table, id, updatedRecord) {
  const transformedRecord = toAirtableFormat(updatedRecord, table);
  return base(table)
    .update([
      {
        id,
        fields: transformedRecord
      }
    ])
    .then(records => {
      return records[0].id;
    })
    .catch(err => {
      throw err;
    });
}

function deleteRecord(table, id) {
  return base(table)
    .destroy([id])
    .then(records => {
      return records[0].fields;
    })
    .catch(err => {
      throw err;
    });
}

export {
  createRecord,
  getAllRecords,
  getRecordById,
  getRecordsByAttribute,
  updateRecord,
  deleteRecord
};
