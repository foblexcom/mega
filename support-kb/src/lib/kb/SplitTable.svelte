<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { problemRows } from '#lib/kb/split';

  let { ticket }: { ticket: number } = $props();

  const rows = $derived((reports as Report[]).length);
  const unique = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket).length);
  const problems = $derived(problemRows(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const tags = (g: { taggedAs: Record<string, number> }) =>
    Object.entries(g.taggedAs)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{unique}</strong> reports in #{ticket} ({rows} rows exported, {rows - unique} of them repeats) ·
  <strong>{problems.length}</strong> problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tagged as</th><th>tenants</th><th>seen</th></tr>
  </thead>
  <tbody>
    {#each problems as p (p.problem)}
      <tr>
        <td><code>{p.problem}</code></td>
        <td>{p.count}</td>
        <td class="tags">{tags(p)}</td>
        <td>{p.tenants}</td>
        <td>{p.firstSeen} → {p.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each problems as p (p.problem)}
  {#if p.oneDayMove}
    <p class="note">{p.oneDayMove} of the <code>{p.problem}</code> reports read as a one-day move; they are counted here, where they are filed.</p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>
