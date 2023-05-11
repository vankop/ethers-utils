import { format } from 'date-fns';

const SPINNER_FRAMES = [
  '\u2588',
  '\u2589',
  '\u258A',
  '\u258B',
  '\u258C',
  '\u258D',
  '\u258E',
  '\u258F'
];

export function formatTime(time: Date) {
  return format(time, 'dd.MM.yyyy HH:mm:ss zzzz');
}

const progressBarWidth = 40;
function updateProgressBar(index: number): string {
  const progressBar =
    '[' +
    '#'.repeat(Math.floor((progressBarWidth * index) / 100)) +
    ' '.repeat(
      progressBarWidth - Math.floor((progressBarWidth * index) / 100)
    ) +
    ']';
  return `\x1b[1G${progressBar}\x1b[0m`;
}

export function spinner(getTextInfo: () => string) {
  let frameIndex = 0;

  process.stdout.write('\n');

  const i = setInterval(() => {
    if (frameIndex > 0) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    }
    process.stdout.write(
      `${updateProgressBar(frameIndex++ % 100)} ${getTextInfo()}\r`
    );
  }, 20);
  return () => {
    clearInterval(i);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  };
}
