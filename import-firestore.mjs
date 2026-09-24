import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';

const ALLOWED_COLLECTIONS = new Set([
  'systemMetadata',
  'serviceCatalog',
  'healthcareSpecialties',
  'catalogHospitals',
  'catalogRestaurants',
  'catalogFoodBanners',
  'catalogGroceryCategories',
  'catalogGroceryProducts',
  'catalogGroceryOffers',
  'catalogServiceProviders',
  'catalogPharmacies',
  'catalogMedicines',
]);

function isAllowedCollectionPath(pathParts) {
  if (pathParts.length === 1) return ALLOWED_COLLECTIONS.has(pathParts[0]);
  if (pathParts[0] === 'catalogRestaurants') {
    return pathParts.length === 3 && pathParts[2] === 'menuItems';
  }
  if (pathParts[0] === 'catalogHospitals') {
    return (pathParts.length === 3 && ['departments', 'doctors'].includes(pathParts[2]))
      || (pathParts.length === 5 && pathParts[2] === 'doctors' && pathParts[4] === 'availability');
  }
  if (pathParts[0] === 'catalogPharmacies') {
    return pathParts.length === 3 && pathParts[2] === 'inventory';
  }
  return false;
}

function readArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--apply') args.apply = true;
    else if (key === '--project' || key === '--file') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`${key} requires a value`);
      args[key.slice(2)] = value;
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${key}`);
    }
  }
  return args;
}

function convertSpecialValues(value, location = 'data') {
  if (Array.isArray(value)) {
    return value.map((item, index) => convertSpecialValues(item, `${location}[${index}]`));
  }
  if (value && typeof value === 'object') {
    if (value.__type === 'timestamp') {
      const date = new Date(value.value);
      if (Number.isNaN(date.getTime())) throw new Error(`Invalid timestamp at ${location}`);
      return Timestamp.fromDate(date);
    }
    if (value.__type === 'geopoint') {
      const { latitude, longitude } = value;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
        || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error(`Invalid GeoPoint at ${location}`);
      }
      return new GeoPoint(latitude, longitude);
    }
    if (Object.hasOwn(value, '__type')) throw new Error(`Unknown special value at ${location}`);
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, convertSpecialValues(child, `${location}.${key}`)])
    );
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error(`Non-finite number at ${location}`);
  }
  return value;
}

function validateSeed(seed) {
  if (!seed || typeof seed !== 'object' || !seed.collections || typeof seed.collections !== 'object') {
    throw new Error('Seed file must have a top-level "collections" object');
  }
  let count = 0;
  for (const [collectionPath, documents] of Object.entries(seed.collections)) {
    const pathParts = collectionPath.split('/');
    if (pathParts.some((part) => !part) || pathParts.length % 2 !== 1) {
      throw new Error(`Invalid collection path: ${collectionPath}`);
    }
    if (!isAllowedCollectionPath(pathParts)) {
      throw new Error(`Import is restricted to catalog/reference collections; rejected: ${collectionPath}`);
    }
    if (!Array.isArray(documents)) throw new Error(`Collection value must be an array: ${collectionPath}`);
    const ids = new Set();
    for (const entry of documents) {
      if (!entry || typeof entry.id !== 'string' || !entry.id.trim() || entry.id.includes('/')) {
        throw new Error(`Every ${collectionPath} document needs a non-empty ID without slashes`);
      }
      if (ids.has(entry.id)) throw new Error(`Duplicate document ID ${entry.id} in ${collectionPath}`);
      ids.add(entry.id);
      if (!entry.data || typeof entry.data !== 'object' || Array.isArray(entry.data)) {
        throw new Error(`Document ${collectionPath}/${entry.id} needs a data object`);
      }
      convertSpecialValues(entry.data, `${collectionPath}/${entry.id}`);
      count += 1;
    }
  }
  return count;
}

async function main() {
  const args = readArgs(process.argv.slice(2));
  if (!args.project || !args.file) {
    throw new Error('Usage: node import-firestore.mjs --project PROJECT_ID --file seed-data.json [--apply]');
  }
  const filePath = resolve(args.file);
  const seed = JSON.parse(await readFile(filePath, 'utf8'));
  const documentCount = validateSeed(seed);
  const collectionCount = Object.keys(seed.collections).length;

  if (!args.apply) {
    console.log(`Dry run OK: ${documentCount} documents across ${collectionCount} collection paths.`);
    console.log('No Firebase writes were made. Add --apply to write these seed records.');
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId: args.project });
  const db = getFirestore();
  const writer = db.bulkWriter();
  let written = 0;
  writer.onWriteResult(() => { written += 1; });

  for (const [collectionPath, documents] of Object.entries(seed.collections)) {
    for (const { id, data } of documents) {
      const ref = db.collection(collectionPath).doc(id);
      writer.set(ref, convertSpecialValues(data, `${collectionPath}/${id}`));
    }
  }

  await writer.close();
  console.log(`Imported ${written} documents to Firebase project ${args.project}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Import failed: ${error.message}`);
    process.exitCode = 1;
  });
}
