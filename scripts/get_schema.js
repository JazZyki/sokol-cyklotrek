const fs = require('fs');

const supabaseUrl = 'https://qrnorkgpcwjbqxngfzmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybm9ya2dwY3dqYnF4bmdmem16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTkwNTksImV4cCI6MjA4ODIzNTA1OX0.MWk8zc1iA8OU3_jNqOOYb_SJf-Ly8SdC4eewN85pyi0';

async function main() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch schema: ${res.statusText}`);
    }
    const data = await res.json();
    
    // Save raw JSON schema
    fs.writeFileSync('scripts/schema.json', JSON.stringify(data, null, 2));
    console.log('✅ Schema saved to scripts/schema.json');
    
    // Generate a readable summary
    let summary = '# Database Schema (PostgREST OpenAPI)\n\n';
    if (data.definitions) {
      for (const [tableName, definition] of Object.entries(data.definitions)) {
        summary += `## Table: ${tableName}\n`;
        if (definition.description) {
          summary += `${definition.description}\n\n`;
        }
        summary += '| Column | Type | Description |\n|---|---|---|\n';
        if (definition.properties) {
          for (const [propName, prop] of Object.entries(definition.properties)) {
            summary += `| **${propName}** | \`${prop.type || ''}${prop.format ? ` (${prop.format})` : ''}\` | ${prop.description || ''} |\n`;
          }
        }
        summary += '\n';
      }
    }
    fs.writeFileSync('scripts/schema.md', summary);
    console.log('✅ Schema summary written to scripts/schema.md');
  } catch (error) {
    console.error('Error fetching schema:', error);
  }
}

main();
