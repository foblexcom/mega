// Plan morning-digest § 1. The contract every part of § 2 builds against: one row per job for a
// night, read from runs/<night>.jsonl.

export type RunStatus = 'ok' | 'retry' | 'fail';

// One line of the run log, once parsed.
export type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

export type DigestRow = {
  job: string;
  // null when the log says so; views show it as `—`.
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  // As written in the log, offset kept (styleguide: never convert to UTC).
  firstAt: string;
  lastAt: string;
};

export type Night = {
  night: string;
  // Sorted by job.
  rows: DigestRow[];
  // Lines that didn't parse: counted, never thrown.
  badLines: number;
};

// null when runs/<night>.jsonl does not exist (or `night` is not a YYYY-MM-DD date).
export type ReadNight = (runsDir: string, night: string) => Night | null;
