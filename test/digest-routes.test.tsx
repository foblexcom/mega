import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  const runsDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  mkdirSync(runsDir, { recursive: true });
  const good = (job: string, at: string) =>
    JSON.stringify({ at, job, status: 'ok', owner: 'rook' });
  writeFileSync(
    join(runsDir, '2026-11-01.jsonl'),
    [
      good('a/job', '2026-11-01T23:00:00+01:00'),
      'this is not json',
      good('a/job', '2026-11-01T23:30:00+01:00'),
    ].join('\n') + '\n',
  );
  writeFileSync(join(runsDir, '2026-11-02.jsonl'), '');
  app = createApp({
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir,
  });
});

describe('GET /digest/:night', () => {
  it('200 for a night with a log', async () => {
    const res = await app.request('/digest/2026-11-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('a/job');
  });

  it('404 for a night with no file', async () => {
    expect((await app.request('/digest/2026-11-05')).status).toBe(404);
  });

  it('empty night says nothing ran', async () => {
    const res = await app.request('/digest/2026-11-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('bad line night reports the skipped line', async () => {
    const html = await (await app.request('/digest/2026-11-01')).text();
    expect(html).toContain('1 line didn');
  });
});

describe('GET /api/digest/:night', () => {
  it('200 for a night with a log', async () => {
    const res = await app.request('/api/digest/2026-11-01');
    expect(res.status).toBe(200);
  });

  it('404 for a night with no file', async () => {
    expect((await app.request('/api/digest/2026-11-05')).status).toBe(404);
  });

  it('empty night has no rows and no bad lines', async () => {
    const res = await app.request('/api/digest/2026-11-02');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rows).toEqual([]);
    expect(body.badLines).toBe(0);
  });

  it('bad line night counts the line and keeps the job', async () => {
    const body = await (await app.request('/api/digest/2026-11-01')).json();
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0].job).toBe('a/job');
  });
});

describe('page and JSON agree', () => {
  it('list the same jobs in the same order', async () => {
    const html = await (await app.request('/digest/2026-11-01')).text();
    const body = await (await app.request('/api/digest/2026-11-01')).json();
    const jobs: string[] = body.rows.map((r: { job: string }) => r.job);
    const positions = jobs.map((j) => html.indexOf(j));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});
