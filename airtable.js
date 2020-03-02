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
  // the `Columns` table in schema.js maps from JS name to Airtable name.
  // Inverting this table lets us go the other way around
  const invertedColumns = {};
  Object.keys(Columns[table]).forEach(key => {
    invertedColumns[Columns[table][key]] = key;
  });

  // Create a new object mapping each record attribute
  const newRecord = {};
  Object.keys(record).forEach(origName => {
    const jsFormattedName = invertedColumns[origName];
    newRecord[jsFormattedName] = record[origName];
  });
  return newRecord;
};

const toAirtableFormat = (record, table) => {
  const columns = Columns[table];

  const newRecord = {};
  Object.keys(record).forEach(jsFormattedName => {
    const origName = columns[jsFormattedName];
    newRecord[origName] = record[jsFormattedName];
  });
  return newRecord;
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

function getAllRecords(table) {
  return new Promise(function(resolve, reject) {
    const allRecords = [];
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

          allRecords.push(...records);

          // To fetch the next page of records, call `fetchNextPage`.
          // If there are more records, `page` will get called again.
          // If there are no more records, `done` will get called.
          fetchNextPage();
        },
        function done(err) {
          if (err) {
            reject(err);
          } else {
            resolve(
              allRecords.map(record => fromAirtableFormat(record.fields, table))
            );
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
