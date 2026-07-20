const fs = require('fs');

const supabaseUrl = 'https://qrnorkgpcwjbqxngfzmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybm9ya2dwY3dqYnF4bmdmem16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTkwNTksImV4cCI6MjA4ODIzNTA1OX0.MWk8zc1iA8OU3_jNqOOYb_SJf-Ly8SdC4eewN85pyi0';

async function inspectTable(tableName) {
  const url = `${supabaseUrl}/rest/v1/${tableName}?limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  if (!res.ok) {
    console.log(`❌ Table ${tableName} could not be read: ${res.statusText}`);
    return null;
  }
  const data = await res.json();
  return data[0] || {};
}

async function main() {
  const tables = ['teams', 'poi_points', 'route_display', 'team_tracking', 'team_poi_progress'];
  const schema = {};
  
  for (const table of tables) {
    console.log(`Inspecting table ${table}...`);
    const record = await inspectTable(table);
    if (record) {
      schema[table] = record;
      console.log(`✅ ${table} columns:`, Object.keys(record));
    }
  }
  
  fs.writeFileSync('scripts/table_samples.json', JSON.stringify(schema, null, 2));
  console.log('✅ Sample records saved to scripts/table_samples.json');
}

main();
