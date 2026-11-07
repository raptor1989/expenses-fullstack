#!/usr/bin/env node

/**
 * Kills whatever process is LISTENING on the given ports.
 * Used as a predev hook so stale Vite/ts-node processes left over from a
 * previous (improperly stopped) `npm run dev` don't block the next run.
 * Only listeners are killed — clients connected to the port (e.g. a browser
 * tab on 5173) are left alone.
 */

const { execSync } = require('child_process');

const ports = process.argv.slice(2).map(Number);
const isWindows = process.platform === 'win32';

function listeningPids(port) {
  try {
    if (isWindows) {
      const output = execSync(`netstat -ano -p tcp | findstr LISTENING`).toString();
      return output
        .split('\n')
        .map((line) => line.trim().split(/\s+/))
        .filter((cols) => cols.length >= 5 && cols[1].endsWith(`:${port}`))
        .map((cols) => cols[cols.length - 1])
        .filter((pid) => pid && pid !== '0');
    }
    return execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`)
      .toString()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return []; // nothing listening on this port
  }
}

for (const port of ports) {
  for (const pid of new Set(listeningPids(port))) {
    try {
      execSync(isWindows ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`Freed port ${port} (killed PID ${pid})`);
    } catch {
      // process already gone
    }
  }
}
