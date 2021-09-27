const puppeteer = require('puppeteer');

function script() {
  let schema = application.tablesById;
  let tables = Object.keys(schema)
  for (i in tables) { 
    let table = schema[tables[i]]
    table.sampleRows = []
    for (column in table.columns) { 
      table.columns[column].foreignTable = undefined
    }
  }
  return schema
}

function getUrl(baseId) {
  return `https://airtable.com/login?continue=/${baseId}/api/docs`;
}

module.exports = async function({ baseId, email, password, headless }) {
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  await page.goto(getUrl(baseId));
   try {
    await page.click(
      '#sign-in-form-fields-root > div > label > button[type="submit"]'
    );
  } catch (err) {
    await page.click(
      '#sign-in-form-fields-root > div > label > input[type="submit"]'
    );
  }
  console.log('Entering Username and Password into login form...');
  await page.type(
    '#sign-in-form-fields-root > div > label > input[name="email"]',
    email
  );
  await page.type(
    '#sign-in-form-fields-root > div > label > input[name="password"]',
    password
  );
  console.log('Submitting...');
  await page.click(
    '#sign-in-form-fields-root > div > label > input[type="submit"]'
  );

  await page.waitForSelector('.docs > .languageTabs > .tab');
  console.log('Scraping schema from API page...');
  const result = await page.evaluate(script);
  await browser.close();
  console.log('Finished!');
  return result;
};
