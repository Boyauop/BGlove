import { countries as countryData } from 'countries-list';
import { City, Country } from 'country-state-city';
import isoCountries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json' with { type: 'json' };

isoCountries.registerLocale(en);

const normalize = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const countryRecords = Object.entries(countryData).map(([iso2, data]) => {
  const upperIso2 = iso2.toUpperCase();
  const cityCountry = Country.getCountryByCode(upperIso2);
  const aliases = [...new Set([data.name, ...(data.alias || []), data.native].filter(Boolean))];
  const capital = data.capital || '';
  return {
    id: upperIso2,
    name: data.name,
    officialName: data.name,
    iso2: upperIso2,
    iso3: isoCountries.alpha2ToAlpha3(upperIso2) || cityCountry?.isoCode || null,
    numericCode: Number(isoCountries.alpha2ToNumeric(upperIso2)) || null,
    flag: cityCountry?.flag || `https://flagcdn.com/${iso2.toLowerCase()}.svg`,
    capital,
    continent: data.continent || cityCountry?.region || null,
    region: cityCountry?.region || null,
    aliases,
    searchableNames: [...new Set([...aliases, capital, upperIso2, isoCountries.alpha2ToAlpha3(upperIso2)].filter(Boolean))],
    active: true
  };
});

const countryById = new Map(countryRecords.map((country) => [country.id, country]));

export function listCountries() {
  return countryRecords;
}

export function getCountry(id) {
  return countryById.get(String(id).toUpperCase()) || countryRecords.find((country) => country.iso3 === String(id).toUpperCase());
}

export function searchLocations(query = '') {
  const needle = normalize(query);
  if (!needle) return countryRecords.slice(0, 20);
  return countryRecords.filter((country) => country.searchableNames.some((value) => normalize(value).includes(needle))).map((country) => ({
    country: country.name,
    capital: country.capital,
    iso2: country.iso2,
    iso3: country.iso3,
    flag: country.flag
  }));
}

export function listCities(countryId, query = '') {
  const country = getCountry(countryId);
  if (!country) return null;
  const needle = normalize(query);
  return City.getCitiesOfCountry(country.iso2).filter((city) => !needle || normalize(city.name).includes(needle)).map((city) => ({
    id: `${city.countryCode}-${city.stateCode || 'NA'}-${city.name}`,
    name: city.name,
    countryId: country.iso2,
    stateCode: city.stateCode || null
  }));
}

export function locationForProfile(countryId, city) {
  const country = getCountry(countryId);
  if (!country) return null;
  const cityName = String(city || '').trim();
  const cityMatch = listCities(country.iso2, cityName).find((item) => normalize(item.name) === normalize(cityName));
  return { countryId: country.iso2, country: country.name, city: cityMatch?.name || cityName, timeZone: Country.getCountryByCode(country.iso2)?.timezones?.[0]?.zoneName || null };
}
