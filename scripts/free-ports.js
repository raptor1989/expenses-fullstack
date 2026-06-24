#!/usr/bin/env node

/**
 * Kills whatever process is listening on the given ports.
 * Used as a predev hook so stale Vite/ts-node processes left over from a
 * previous (improperly stopped) `npm run dev` don't block the next run.
 */

const { execSync } = require('child_process');

const ports = process.argv.slice(2).map(Number);

for (const port of ports) {
  let output;
  try {
    output = execSync(`netstat -ano | findstr :${port}`).toString();
  } catch {
    continue; // nothing listening on this port
  }

  const pids = new Set(
    output
      .split('\n')
      .map((line) => line.trim().split(/\s+/).pop())
      .filter((pid) => pid && pid !== '0')
  );

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`Freed port ${port} (killed PID ${pid})`);
    } catch {
      // process already gone
    }
  }
}
