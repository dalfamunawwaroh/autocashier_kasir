import fetch from 'node-fetch';

async function getOpenAPI() {
  const url = process.env.VITE_SUPABASE_URL || 'https://zhghwaypdgpxlznkammt.supabase.co';
  const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw';
  
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const data = await res.json();
  if (data.definitions && data.definitions.transactions) {
     console.log("Transactions columns:", Object.keys(data.definitions.transactions.properties));
  } else {
     console.log("Definitions keys:", Object.keys(data.definitions || {}));
  }
}

getOpenAPI();
