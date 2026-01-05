// src/ui/colors.ts

const isTTY = process.stdout.isTTY && process.stderr.isTTY;
const noColor = process.env.NO_COLOR !== undefined || process.env.TERM === 'dumb';

function color(code: string): string {
  return isTTY && !noColor ? code : '';
}

export const COLORS = {
  success: color('\x1b[32m'),
  error: color('\x1b[31m'),
  warning: color('\x1b[33m'),
  info: color('\x1b[36m'),
  dim: color('\x1b[90m'),
  bold: color('\x1b[1m'),
  reset: color('\x1b[0m'),
};

export const SYMBOLS = {
  success: '\u2713',
  error: '\u2717',
  blocked: '\u26D4',
  warning: '\u26A0',
  arrow: '\u2192',
  bullet: '\u2022',
};

const SPINNER_FRAMES = ['\u25D0', '\u25D3', '\u25D1', '\u25D2'];

export function createSpinner(message: string): { stop: () => void } {
  if (!isTTY) {
    console.log(message);
    return { stop: () => {} };
  }

  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(
      `\r${COLORS.dim}${SPINNER_FRAMES[i++ % 4]} ${message}${COLORS.reset}`
    );
  }, 100);

  return {
    stop: () => {
      clearInterval(interval);
      process.stdout.write('\r\x1b[K'); // Clear line
    },
  };
}
