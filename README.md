# airtable-schema-generators

A simple script to download an Airtable schema, and generate schema file, constants, and request helpers! Details on the design decisions behind the architecture can be found [here](https://www.notion.so/calblueprint/PP-Power-Airtable-Client-Side-6a1b6734af294ef88609a6d6d256ca3d).


## Setup

Clone the repository and run `npm install` inside the repo

`git clone https://github.com/aivantg/airtable-schema.git && cd airtable-schema && npm install`

### Create a .env

Create a file called `.env` (identical to `.env.example`) and fill in the values with your airtable account email and password, as well as your Airtable Base ID. You can find your Base ID in the API URL: airtable.com/`{baseId}`/api/docs.

Make sure you have password enabled on your Airtable account.

## Running the script

Running `npm start` will open an electron app browser window that will fill in your username and password. Once the api page loads it will output 3 files: `schema.json`, `request.js`, and `schema.js`.

The first file is a simplified JSON object representing your airtable base. The last two files work with the sample `airtable.js` file to create nice CRUD helpers and constants for a javascript project using Airtable. Note that  the provided `airtable.js` example transforms records' column names to and from camel case and original airtable format for easy developing!

## Optional Inputs

Optionally, you can create a `schemaMeta.json` file inside the `input/` folder. This file lets you specify info about custom helper functions in `request.js`. Inside `schemaMeta.json` should be an object that has airtable tablenames as keys and metadata as values. Currently the only metada is `lookupFields` (explained below) but more can be added as needed. Sample Structure: 

```
{
  "User Login": {
    "lookupFields": ["Email"]
  },
  "Announcement": {
    "lookupFields": ["Project Group"]
  }
}

```

### Lookup Fields
The `lookupFields` meta attribute specifies which fields you would like to create a custom `getRecordsByAttribute` helper function for. For example, one of the functions the above `schemaMeta.json` would create might look like:
```
export const getAnnouncementsByProjectGroup = async value => {
  return getRecordsByAttribute(
    Tables.Announcement,
    Columns.Announcement.projectGroup,
    value
  );
};
```
This is in addition to the two default "get" functions created. 

## Screenshots

![image](https://user-images.githubusercontent.com/5147486/72138426-7286e780-3352-11ea-8582-f6010de2c390.png)
Auto-generated `request.js` and `schema.js`

## Notes

Airtable Schema Downloading Code Credit: https://github.com/cape-io/airtable-schema

This generator was made specifically for this a Blueprint project. Learn more about what we do here: https://calblueprint.org/
