const puppeteer = require('puppeteer');

function script() {
  return _.mapValues(application.tablesById, table =>
    _.set(
      _.omit(table, ['sampleRows']),
      'columns',
      _.map(table.columns, item =>
        _.set(item, 'foreignTable', _.get(item, 'foreignTable.id'))
      )
    )
  );
}

function getUrl(baseId) {
  return `https://airtable.com/login?continue=/${baseId}/api/docs`;
}

module.exports = async function({ baseId, email, password, headless }) {
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  await page.goto(getUrl(baseId));
  await page.waitForSelector('#sign-in-form-fields-root > div > label > div');
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
