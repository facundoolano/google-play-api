import { describe, expect, it, vi } from 'vitest';
import app from '../src/index.js';

describe('Google Play API Worker', () => {
  it('requires the existing x-api-key header', async () => {
    const response = await app.request('https://api.example.com/api/', {}, {
      API_KEY: 'secret',
      PUBLIC_BASE_URL: 'https://api.example.com'
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Unauthorized - Invalid API Key'
    });
  });

  it('keeps the API index links under the configured public URL', async () => {
    const response = await app.request('https://attacker.example/api/', {
      headers: { 'x-api-key': 'secret' }
    }, {
      API_KEY: 'secret',
      PUBLIC_BASE_URL: 'https://api.example.com'
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      apps: 'https://api.example.com/api/apps',
      developers: 'https://api.example.com/api/developers',
      categories: 'https://api.example.com/api/categories'
    });
  });

  it('serves the app list with or without a trailing slash', async () => {
    const scraper = await import('../src/scraper/index.js');
    vi.spyOn(scraper.default, 'list').mockResolvedValue([]);

    for (const path of ['/api/apps', '/api/apps/']) {
      const response = await app.request(`https://api.example.com${path}`, {
        headers: { 'x-api-key': 'secret' }
      }, {
        API_KEY: 'secret',
        PUBLIC_BASE_URL: 'https://api.example.com'
      });
      expect(response.status).toBe(200);
    }
  });

  it('parses false boolean query values without enabling full detail', async () => {
    const scraper = await import('../src/scraper/index.js');
    vi.spyOn(scraper.default, 'list').mockResolvedValue([]);

    const response = await app.request('https://api.example.com/api/apps/?fullDetail=false', {
      headers: { 'x-api-key': 'secret' }
    }, {
      API_KEY: 'secret',
      PUBLIC_BASE_URL: 'https://api.example.com'
    });

    expect(response.status).toBe(200);
    expect(scraper.default.list).toHaveBeenCalledWith(
      expect.objectContaining({ fullDetail: false })
    );
  });

  it('does not allow query parameters to override the app path', async () => {
    const scraper = await import('../src/scraper/index.js');
    vi.spyOn(scraper.default, 'app').mockResolvedValue({
      appId: 'path-app',
      url: 'https://play.google.com/store/apps/details?id=path-app',
      developer: 'Example Developer'
    });

    const response = await app.request('https://api.example.com/api/apps/path-app?appId=query-app', {
      headers: { 'x-api-key': 'secret' }
    }, {
      API_KEY: 'secret',
      PUBLIC_BASE_URL: 'https://api.example.com'
    });

    expect(response.status).toBe(200);
    expect(scraper.default.app).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'path-app' })
    );
  });

  it('maps upstream errors to their HTTP status family', async () => {
    const scraper = await import('../src/scraper/index.js');
    vi.spyOn(scraper.default, 'app').mockRejectedValue(Object.assign(
      new Error('App not found (404)'),
      { status: 404 }
    ));

    const response = await app.request('https://api.example.com/api/apps/missing', {
      headers: { 'x-api-key': 'secret' }
    }, {
      API_KEY: 'secret',
      PUBLIC_BASE_URL: 'https://api.example.com'
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: 'App not found (404)' });
  });

  it('keeps trailing-slash subresource paths compatible', async () => {
    const scraper = await import('../src/scraper/index.js');
    vi.spyOn(scraper.default, 'permissions').mockResolvedValue([]);
    vi.spyOn(scraper.default, 'reviews').mockResolvedValue({ data: [], nextPaginationToken: null });

    for (const path of ['/permissions/', '/reviews/']) {
      const response = await app.request(`https://api.example.com/api/apps/org.wikipedia${path}`, {
        headers: { 'x-api-key': 'secret' }
      }, {
        API_KEY: 'secret',
        PUBLIC_BASE_URL: 'https://api.example.com'
      });
      expect(response.status).toBe(200);
    }
  });

  it('preserves the reviews result object shape', async () => {
    const scraper = await import('../src/scraper/index.js');
    vi.spyOn(scraper.default, 'reviews').mockResolvedValue({
      data: [{ id: 'review-1' }],
      nextPaginationToken: 'next-token'
    });

    const response = await app.request('https://api.example.com/api/apps/org.wikipedia/reviews', {
      headers: { 'x-api-key': 'secret' }
    }, {
      API_KEY: 'secret',
      PUBLIC_BASE_URL: 'https://api.example.com'
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      results: {
        data: [{ id: 'review-1' }],
        nextPaginationToken: 'next-token'
      }
    });
  });
});
