import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/research`;

test.describe('Research API Smoke Tests', () => {
  test('case 1: POST valid → 200 + schema {ok:true, answer:string, sources:[], requestId:string}', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'What is the best Pokemon card to invest in?' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('ok', true);
    expect(data).toHaveProperty('answer');
    expect(typeof data.answer).toBe('string');
    expect(data).toHaveProperty('sources');
    expect(Array.isArray(data.sources)).toBe(true);
    expect(data).toHaveProperty('requestId');
    expect(typeof data.requestId).toBe('string');
  });

  test('case 2: POST {"query":""} → 400 + {ok:false}', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();

    expect(data).toHaveProperty('ok', false);
    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
    expect(data).toHaveProperty('requestId');
    expect(typeof data.requestId).toBe('string');
  });

  test('case 3: POST no body → 400 + {ok:false}', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(400);
    const data = await response.json();

    expect(data).toHaveProperty('ok', false);
    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
    expect(data).toHaveProperty('requestId');
    expect(typeof data.requestId).toBe('string');
  });
});

