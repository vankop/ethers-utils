export function hyperLink(url: string, title: string) {
  return `\x1B]8;;${url}\x1B\\${title}\x1B]8;;\x1B\\`;
}
