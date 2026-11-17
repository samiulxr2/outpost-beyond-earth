import * as fs from 'fs';
import * as path from 'path';

function scan(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scan(full);
    } else if (e.name.endsWith('.json')) {
      try {
        const raw = fs.readFileSync(full, 'utf8');
        const content = JSON.parse(raw);
        const origin = content.metadata?.dataOrigin || 'missing';
        const source = content.metadata?.source || 'missing';
        console.log(`${path.relative(process.cwd(), full)} => dataOrigin: "${origin}" | Source: ${source}`);
      } catch (err: unknown) {
        console.log(`${full} => ERROR: ${(err as Error).message}`);
      }
    }
  }
}

scan('src/data');
