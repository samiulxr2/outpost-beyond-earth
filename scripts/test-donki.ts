async function testDONKI() {
  const endpoints = [
    'https://api.nasa.gov/DONKI/FLR?startDate=2024-01-01&endDate=2024-01-20&api_key=DEMO_KEY',
    'https://api.nasa.gov/DONKI/CME?startDate=2024-01-01&endDate=2024-01-20&api_key=DEMO_KEY',
    'https://api.nasa.gov/DONKI/SEP?startDate=2024-01-01&endDate=2024-01-20&api_key=DEMO_KEY',
  ];

  for (const url of endpoints) {
    console.log(`\nTesting URL: ${url}`);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      console.log(`Response Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(`Response Snippet (first 300 chars):`);
      console.log(text.slice(0, 300));
    } catch (err: unknown) {
      console.log(`Fetch Exception: ${(err as Error).message}`);
    }
  }
}

testDONKI();
