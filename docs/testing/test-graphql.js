const fetch = require('node-fetch');

const SUPABASE_URL = 'https://uzbozldsdzsfytsteqlb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6Ym96bGRzZHpzZnl0c3RlcWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc1MzIsImV4cCI6MjA3Mzc4MzUzMn0.01VQh8PRqphCIbUCB2gLJjUZPX-AtzAF5ZRjJWyy24g';

async function testGraphQL() {
  const query = `
    query {
      service_categoriesCollection(first: 5) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    console.log('GraphQL Response:', JSON.stringify(data, null, 2));
    
    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
    }
    
    if (data.data) {
      console.log('✅ GraphQL is working!');
      console.log('Categories found:', data.data?.service_categoriesCollection?.edges?.length || 0);
    }
  } catch (error) {
    console.error('Error testing GraphQL:', error);
  }
}

testGraphQL();
