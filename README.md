# airtable-schema

Simple script to download an Airtable schema, and generate schema file + request helpers!

## Setup

Clone the repository and run `npm install` inside the repo

`git clone https://github.com/aivantg/airtable-schema.git && cd airtable-schema && npm install`

### Create a .env

Create a file called `.env` (identical to `.env.example`) and fill in the values with your airtable account email and password, as well as your Airtable Base ID. You can find your Base ID in the API URL: airtable.com/`{baseId}`/api/docs.

Make sure you have password enabled on your Airtable account.

## Running the script

Running `npm start` will open an electron app browser window that will fill in your username and password. Once the api page loads it will output 3 files: `schema.json`, `request.js`, and `schema.js`.

The first file is a simplified JSON object representing your airtable base. The last two files work with the sample `airtable.js` file to create nice CRUD helpers and constants for a javascript project using Airtable.

You can edit the `schema.json` to add a `lookupFields` attribute to each table object to specify attributes that you want to create a `getRecordsByAttribute` helper function for. In future runs of this script, it will preserve any `lookupFields` you have, so be sure to save your customized `schema.json` for future runs!

## Notes

Airtable Schema Downloading Code Credit: https://github.com/cape-io/airtable-schema

This generator was made specifically for this a Blueprint project. Learn more about what we do here: https://calblueprint.org/
