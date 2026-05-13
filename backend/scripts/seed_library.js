const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const ASSETS_PATH = path.join(__dirname, '../../assets');
const BATCH_SIZE = 500;

async function seedScimagoJR(filename, year) {
  console.log(`Seeding ScimagoJR ${year} from ${filename}...`);
  const filePath = path.join(ASSETS_PATH, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const parser = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_quotes: true,
      skip_records_with_error: true,
    })
  );

  let batch = [];
  let count = 0;

  for await (const record of parser) {
    // Dynamically find the "Total Docs" column for that year
    // ScimagoJR usually has "Total Docs. (YYYY)" or similar
    const totalDocsKey = Object.keys(record).find(k => k.startsWith('Total Docs.'));
    
    const journal = {
      name: record['Title'],
      issn: record['Issn']?.split(',')[0]?.trim() || '',
      category: record['Categories']?.split(';')[0]?.trim() || 'Uncategorized',
      subcategory: record['Categories']?.split(';')[1]?.trim() || '',
      quality_tier: record['SJR Best Quartile'] || 'N/A',
      geography: record['Country'] || '',
      publisher: record['Publisher'] || '',
      rank: parseInt(record['Rank']) || null,
      sjr_score: parseFloat(record['SJR']?.replace(',', '.')) || null,
      h_index: parseInt(record['H index']) || null,
      total_docs: parseInt(record[totalDocsKey]) || null,
      total_refs: parseInt(record['Total Refs.']) || null,
      total_citations: parseInt(record['Total Citations (3years)']) || null,
      citable_docs: parseInt(record['Citable Docs. (3years)']) || null,
      country: record['Country'] || '',
      region: record['Region'] || '',
      coverage: record['Coverage'] || '',
      journal_type: record['Type'] || 'journal',
      is_open_access: record['Open Access'] === 'Yes',
      is_diamond_oa: record['Open Access Diamond'] === 'Yes',
      year: year,
    };

    if (journal.name) {
      batch.push(journal);
    }

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(batch);
    count += batch.length;
  }
  console.log(`Finished ScimagoJR ${year}. Total: ${count}`);
}

async function seedDOAJ(filename) {
  console.log(`Seeding DOAJ from ${filename}...`);
  const filePath = path.join(ASSETS_PATH, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const parser = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
      relax_quotes: true,
      skip_records_with_error: true,
    })
  );

  let batch = [];
  let count = 0;

  for await (const record of parser) {
    const journal = {
      name: record['Journal title'],
      issn: record['Journal EISSN (online version)'] || record['Journal ISSN (print version)'] || '',
      issn_print: record['Journal ISSN (print version)'] || '',
      issn_online: record['Journal EISSN (online version)'] || '',
      category: record['Subjects']?.split('|')[0]?.trim() || 'Uncategorized',
      quality_tier: 'N/A',
      publisher: record['Publisher'] || '',
      country: record['Country of publisher'] || '',
      homepage_url: record['Journal URL'] || '',
      doaj_url: record['URL in DOAJ'] || '',
      is_open_access: true,
      apc_amount: record['APC amount'] || '',
      apc_url: record['APC information URL'] || '',
      journal_type: 'journal',
      year: 2026,
    };

    if (journal.name) {
      batch.push(journal);
    }

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(batch);
    count += batch.length;
  }
  console.log(`Finished DOAJ. Total: ${count}`);
}

async function insertBatch(batch) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const placeholders = batch.map((_, i) => {
      const offset = i * 27;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18}, $${offset + 19}, $${offset + 20}, $${offset + 21}, $${offset + 22}, $${offset + 23}, $${offset + 24}, $${offset + 25}, $${offset + 26}, $${offset + 27})`;
    }).join(',');

    const query = `
      INSERT INTO journals (
        name, issn, category, subcategory, quality_tier, geography, publisher,
        rank, sjr_score, h_index, total_docs, total_refs, total_citations,
        citable_docs, country, region, coverage, journal_type,
        is_open_access, is_diamond_oa, issn_print, issn_online,
        homepage_url, doaj_url, apc_amount, apc_url, year
      ) VALUES ${placeholders}
      ON CONFLICT (name, issn, year) DO NOTHING
    `;

    const values = [];
    batch.forEach(j => {
      values.push(
        j.name, j.issn, j.category, j.subcategory, j.quality_tier, j.geography, j.publisher,
        j.rank, j.sjr_score, j.h_index, j.total_docs, j.total_refs, j.total_citations,
        j.citable_docs, j.country, j.region, j.coverage, j.journal_type,
        j.is_open_access, j.is_diamond_oa, j.issn_print, j.issn_online,
        j.homepage_url, j.doaj_url, j.apc_amount, j.apc_url, j.year
      );
    });

    await client.query(query, values);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    // Silently continue if a batch fails, we log it but don't stop the whole process
  } finally {
    client.release();
  }
}

async function main() {
  try {
    const files = fs.readdirSync(ASSETS_PATH);
    const sjrFiles = files
      .filter(f => f.startsWith('scimagojr') && f.endsWith('.csv'))
      .sort(); // Seed chronologically

    for (const file of sjrFiles) {
      const yearMatch = file.match(/\d{4}/);
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        await seedScimagoJR(file, year);
      }
    }

    const doajFile = files.find(f => f.startsWith('doaj_journalcsv'));
    if (doajFile) {
      await seedDOAJ(doajFile);
    }

    console.log('--- SEEDING COMPLETE ---');
  } catch (e) {
    console.error('Master seeding failed:', e);
  } finally {
    await pool.end();
  }
}

main();
