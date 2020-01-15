# airtable-schema-generators

An NPM package with a script to download an Airtable schema, and generate schema file, constants, and request helpers! 

## What it does

This script open an electron app browser window and opens the Airtable API page for your base using your login credentials. Once the api page loads, the script generates 3 files: `schema.json`, `request.js`, and `schema.js`.

The first file is a simplified JSON object representing your airtable base. The last two files work with the sample `airtable.js` file to create nice CRUD helpers and constants for a javascript project using Airtable. Note that the provided `airtable.js` example transforms records' column names to and from camel case and original airtable format for easy developing!

Details on the design decisions behind the architecture can be found [here](https://www.notion.so/calblueprint/PP-Power-Airtable-Client-Side-6a1b6734af294ef88609a6d6d256ca3d).

## Installation

1. Add package as a dev dependency

`npm install --save-dev airtable-schema-generator`
or
`yarn add -D airtable-schema-generator`

2. Create a `.airtable-schema-generator.env` file.

Create a file called `.airtable-schema-generator.env` (identical to `.env.example`) in the root of your project and fill in the values with your airtable account email and password, as well as your Airtable Base ID. You can find your Base ID in the API URL: airtable.com/`{baseId}`/api/docs.

3. Add new env file to gitignore

Add the line `.airtable-schema-generator.env` to your `.gitignore` file

4. Configure the input and output folder

In your `package.json` add the following: 
```
"airtable-schema-generator": { 
  "input": "path/to/input/folder",
  "output": "path/to/output/folder"
}
```
specifying where your `schemaMetadata.json` file lives as the input folder and where you'd like to store your utility functions as the output folder

5. Add convenient run script

Update your scripts object in `package.json` to include the following

```
"scripts": { 
  "generateSchema": "generate-airtable-schema"
}
```

## Running the script

Run `npm run generateSchema` to re-generate your utility functions every time your airtable base updates!

## Optional Inputs

Optionally, you can create a `schemaMeta.json` file inside the folder you specify as `input`. This file lets you specify info about custom helper functions in `request.js`. Inside `schemaMeta.json` should be an object that has airtable tablenames as keys and metadata as values. Currently the only metada is `lookupFields` (explained below) but more can be added as needed. Sample Structure: 

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
