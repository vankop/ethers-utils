export function columns(data: string[], cols: number) {
  if (data.length === 0) return;
  for (let i = 0; i < data.length; i++) {
    if (i !== 0 && i % cols === 0) process.stdout.write('\n');
    process.stdout.write(`${data[i]}     `);
  }
  process.stdout.write('\n');
}
