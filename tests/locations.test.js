import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../server/src/app.js';

test('location API supports ISO country, capital, alias, and city search', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  const countries = await fetch(`${baseUrl}/locations/countries`).then((response) => response.json());
  assert.equal(countries.success, true);
  assert.ok(countries.data.length >= 249);
  const ethiopia = countries.data.find((country) => country.iso2 === 'ET');
  assert.deepEqual({ name: ethiopia.name, iso3: ethiopia.iso3, capital: ethiopia.capital, numericCode: ethiopia.numericCode }, { name: 'Ethiopia', iso3: 'ETH', capital: 'Addis Ababa', numericCode: 231 });

  const search = await fetch(`${baseUrl}/locations/search?q=addis`).then((response) => response.json());
  assert.equal(search.data[0].iso2, 'ET');
  assert.equal(search.data[0].capital, 'Addis Ababa');

  const cities = await fetch(`${baseUrl}/locations/countries/ET/cities?q=addis`).then((response) => response.json());
  assert.equal(cities.data[0].name, 'Addis Ababa');
});
