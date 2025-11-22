import { NextRequest } from 'next/server';
import { POST } from '@/app/api/research/route';

async function main() {
  const req = new NextRequest('http://localhost/api/research', {
    method: 'POST',
    body: JSON.stringify({ query: 'Best pre-rotation Pokémon buys?' }),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  });

  const response = await POST(req);
  const json = await response.json();
  console.log(json);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

