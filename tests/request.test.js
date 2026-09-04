import { describe, expect, it, vi } from 'vitest';
import { createRequestContext, request } from '../src/scraper/lib/utils/request.js';

describe('Workers request adapter', () => {
  it('uses fetch and returns the response body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('google-play-body', { status: 200 })
    );

    const body = await request({
      url: 'https://play.google.com/store/apps/details?id=example',
      method: 'GET',
      fetchImpl: fetchMock,
      requestContext: createRequestContext()
    });

    expect(body).toBe('google-play-body');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://play.google.com/store/apps/details?id=example',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('preserves cookies between requests in the same scraper operation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('first', {
        status: 200,
        headers: { 'set-cookie': 'SID=abc123; Path=/; Secure' }
      }))
      .mockResolvedValueOnce(new Response('second', { status: 200 }));
    const requestContext = createRequestContext();

    await request({ url: 'https://play.google.com/first', fetchImpl: fetchMock, requestContext });
    await request({ url: 'https://play.google.com/second', fetchImpl: fetchMock, requestContext });

    expect(fetchMock.mock.calls[1][1].headers.get('cookie')).toBe('SID=abc123');
  });

  it('exposes upstream status codes for the API error handler', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('not found', { status: 404 })
    );

    await expect(request({
      url: 'https://play.google.com/missing',
      fetchImpl: fetchMock,
      requestContext: createRequestContext()
    })).rejects.toMatchObject({ status: 404 });
  });
});
