export function extractSizeInBytes(string: string, k: number): number {
  const sizePattern = /(\d+(\.\d+)?)\s?(KB|MB|GB)/;
  const match = string.match(sizePattern);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[3];

  switch (unit) {
    case 'GB':
      return value * k * k * k;
    case 'MB':
      return value * k * k;
    case 'KB':
      return value * k;
    default:
      return 0;
  }
}

export function extractDurationInMs(string: string): number {
  const durationPattern = /(?:(\d+)h:)?(?:(\d+)m:)?(\d+)s/;
  const match = string.match(durationPattern);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3]);

  return (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
}
