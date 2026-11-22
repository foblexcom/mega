import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, Night, ReadNight, RunLine, RunStatus } from './types.js';

const NIGHT = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: readonly RunStatus[] = ['ok', 'retry', 'fail'];

// Parse at the edge (styleguide): anything that isn't a well-formed run line is null.
export function parseLine(text: string): RunLine | null {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
  if (!STATUSES.includes(o.status as RunStatus)) return null;
  if (o.owner !== null && o.owner !== undefined && typeof o.owner !== 'string') return null;
  if (o.error !== undefined && typeof o.error !== 'string') return null;
  return {
    at: o.at,
    job: o.job,
    status: o.status as RunStatus,
    owner: (o.owner as string | null | undefined) ?? null,
    ...(o.error === undefined ? {} : { error: o.error as string }),
  };
}

export function digest(lines: RunLine[]): DigestRow[] {
  const byJob = new Map<string, RunLine[]>();
  for (const l of lines) byJob.set(l.job, [...(byJob.get(l.job) ?? []), l]);
  return [...byJob.entries()]
    .map(([job, ls]) => {
      const last = ls[ls.length - 1];
      return {
        job,
        owner: last.owner,
        runs: ls.length,
        retries: ls.filter((l) => l.status === 'retry').length,
        lastStatus: last.status,
        lastError: last.error ?? null,
        firstAt: ls[0].at,
        lastAt: last.at,
      };
    })
    .sort((a, b) => a.job.localeCompare(b.job));
}

export const readNight: ReadNight = (runsDir, night) => {
  if (!NIGHT.test(night)) return null;
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }
  const lines: RunLine[] = [];
  let badLines = 0;
  for (const raw of text.split(/\r?\n/)) {
    if (raw.trim() === '') continue;
    const l = parseLine(raw);
    if (l) lines.push(l);
    else badLines++;
  }
  return { night, rows: digest(lines), badLines } satisfies Night;
};
