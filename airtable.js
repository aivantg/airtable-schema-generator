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

const apiKey = process.env.REACT_APP_AIRTABLE_API_KEY;

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
  return new Promise(function(resolve, reject) {
    const transformedRecord = toAirtableFormat(record, table);
    base(table).create([{ fields: transformedRecord }], function(err, records) {
      if (err) {
        reject(err);
        return;
      }

      const expectedLen = 1;
      if (records.length !== expectedLen) {
        reject(
          new Error(
            `${records.length} records returned from creating 1 record. Expected: ${expectedLen}`
          )
        );
        return;
      }

      resolve(records[0].getId());
    });
  });
}

// TODO pagination?
// TODO: current implementation only fetches the first page
function getAllRecords(table) {
  return new Promise(function(resolve, reject) {
    base(table)
      .select({
        view: VIEW
      })
      .eachPage(
        function page(records, fetchNextPage) {
          if (records === null || records.length < 1) {
            const msg = `No record was retrieved using this ${table}.`;
            reject(msg);
            return;
          }

          resolve(
            records.map(record => fromAirtableFormat(record.fields, table))
          );

          // To fetch the next page of records, call `fetchNextPage`.
          // If there are more records, `page` will get called again.
          // If there are no more records, `done` will get called.
          fetchNextPage();
        },
        function done(err) {
          if (err) {
            reject(err);
          }
        }
      );
  });
}

// Given a table and record ID, return the associated record object using a Promise.
function getRecordById(table, id) {
  return new Promise(function(resolve, reject) {
    base(table).find(id, function(err, record) {
      if (err) {
        reject(err);
        return;
      }

      resolve(fromAirtableFormat(record.fields, table));
    });
  });
}

// TODO: current implementation only returns the first page
/*
  Given the desired table, field type (column), and field ('nick wong' or 'aivant@pppower.io'),
  return the associated record object.
*/
function getRecordsByAttribute(table, fieldType, field) {
  return new Promise(function(resolve, reject) {
    base(table)
      .select({
        view: VIEW,
        filterByFormula: `{${fieldType}}='${field}'`
      })
      .firstPage((err, records) => {
        if (err) {
          reject(err);
          return;
        }
        if (!records || records.length < 1) {
          console.log(`No record was retrieved using this ${fieldType}.`);
          resolve([]);
          // No need for this to throw an error, sometimes there's just no values
          // reject(new Error(`No record was retrieved using this ${fieldType}.`));
          return;
        }

        resolve(
          records.map(record => fromAirtableFormat(record.fields, table))
        );
      });
  });
}

// Given a table and a record object, update a record on Airtable.
function updateRecord(table, id, updatedRecord) {
  return new Promise(function(resolve, reject) {
    const transformedRecord = toAirtableFormat(updatedRecord, table);
    base(table).update(
      [
        {
          id,
          fields: transformedRecord
        }
      ],
      function(err, records) {
        if (err) {
          reject(err);
          return;
        }

        const expectedLen = 1;
        if (records.length !== expectedLen) {
          reject(
            new Error(
              `${records.length} records returned from creating 1 record. Expected: ${expectedLen}`
            )
          );
          return;
        }

        resolve(records[0].id); // TODO
      }
    );
  });
}

function deleteRecord(table, id) {
  return new Promise(function(resolve, reject) {
    base(table).destroy([id], function(err, deletedRecords) {
      if (err) {
        reject(err);
        return;
      }
      const expectedLen = 1;
      if (deletedRecords.length !== expectedLen) {
        reject(
          new Error(
            `${deletedRecords.length} records returned from deleting ${expectedLen} record(s). Expected: ${expectedLen}`
          )
        );
        return;
      }

      resolve(deletedRecords[0].fields);
    });
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
