/*
  Helper functions that makes airtable API calls directly

  Generated request.js file wraps around this file to provide simple CRUD helpers

  Written by cape-io: https://github.com/cape-io/airtable-schema
*/

import Airtable from 'airtable';
import constants from '../constants';

const { BASE_ID, ENDPOINT_URL, GRID_VIEW } = constants;

// API KEY will reside in ENV variables later.
Airtable.configure({
  endpointUrl: ENDPOINT_URL,
  apiKey: 'API_KEY'
});

const base = Airtable.base(BASE_ID);

// ******** CRUD ******** //
// Given a table and a record object, create a record on Airtable.
function createRecord(table, record) {
  return new Promise(function(resolve, reject) {
    base(table).create([{ fields: record }], function(err, records) {
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

// TODO: pagination?
// TODO: current implementation only fetches the first page
function getAllRecords(table) {
  return new Promise(function(resolve, reject) {
    base(table)
      .select({
        view: GRID_VIEW
      })
      .eachPage(
        function page(records, fetchNextPage) {
          if (records === null || records.length < 1) {
            const msg = `No record was retrieved using this ${table}.`;
            reject(msg);
          }

          resolve(records.map(record => record.fields));

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
        console.error(err);
        reject(err);
      }

      resolve(record.fields);
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
        view: GRID_VIEW,
        filterByFormula: `{${fieldType}}='${field}'`
      })
      .firstPage((err, records) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        if (!records || records.length < 1) {
          console.log(`No record was retrieved using this ${fieldType}.`);
          reject(new Error(`No record was retrieved using this ${fieldType}.`));
        }

        resolve(records.map(record => record.fields));
      });
  });
}

// Given a table and a record object, update a record on Airtable.
function updateRecord(table, id, updatedRecord) {
  return new Promise(function(resolve, reject) {
    base(table).update(
      [
        {
          id,
          fields: updatedRecord
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
        console.error(err);
        reject(err);
      }
      const expectedLen = 1;
      if (deletedRecords.length !== expectedLen) {
        reject(
          new Error(
            `${deletedRecords.length} records returned from deleting ${expectedLen} record(s). Expected: ${expectedLen}`
          )
        );
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
