import { CronJob } from 'cron';

let cronJob: CronJob | null = null;
let cronIntervalHours = 3;
let lastScrapeAt: Date | null = null;

export function getNextScrapeTime(): string | null {
  if (!cronJob) return null;
  try {
    return cronJob.nextDate().toISO() ?? null;
  } catch {
    return null;
  }
}

export function getCronInfo(): { intervalHours: number; nextScrape: string | null; lastScrape: string | null } {
  return {
    intervalHours: cronIntervalHours,
    nextScrape: getNextScrapeTime(),
    lastScrape: lastScrapeAt?.toISOString() ?? null,
  };
}

export function startCron() {
  if (process.env.CRON_ENABLED === 'false') {
    console.log('[cron] Disabled via CRON_ENABLED=false');
    return;
  }

  cronIntervalHours = Math.max(1, parseInt(process.env.CRON_INTERVAL_HOURS ?? '3', 10));
  const cronExpression = `0 */${cronIntervalHours} * * *`;

  cronJob = new CronJob(cronExpression, async () => {
    console.log(`[cron] Starting scheduled scrape...`);
    try {
      // Dynamic import to avoid circular dependencies at startup
      const { runScrapeAll, cleanupUnvisitedQueries } = await import('./scraper/run-scrape');

      await cleanupUnvisitedQueries();
      const results = await runScrapeAll();
      lastScrapeAt = new Date();

      const successful = results.filter((r) => r.status === 'success').length;
      const failed = results.filter((r) => r.status === 'failed').length;
      const snapshots = results.reduce((sum, r) => sum + r.snapshotsCount, 0);
      console.log(`[cron] Scrape complete: ${successful} ok, ${failed} failed, ${snapshots} snapshots`);
    } catch (err) {
      console.error('[cron] Scrape failed:', err instanceof Error ? err.message : err);
    }
  });

  cronJob.start();
  console.log(`[cron] Scheduled every ${cronIntervalHours}h (${cronExpression}), next: ${cronJob.nextDate().toISO()}`);
}

export function stopCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[cron] Stopped');
  }
}
