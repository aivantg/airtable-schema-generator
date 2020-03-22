
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

module.exports = function({ baseId, email, password, headless}) {
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  await page.goto(getUrl(baseId));
  await page.waitForSelector('#sign-in-form-fields-root > div > label > div');
  await page.type(
    '#sign-in-form-fields-root > div > label > input[name="email"]',
    email
  );
  await page.type(
    '#sign-in-form-fields-root > div > label > input[name="password"]',
    password
  );
  await page.click(
    '#sign-in-form-fields-root > div > label > input[type="submit"]'
  );

  await page.waitForSelector('.docs > .languageTabs > .tab');
  const result = await page.evaluate(script);
  await browser.close();
  return result
};
