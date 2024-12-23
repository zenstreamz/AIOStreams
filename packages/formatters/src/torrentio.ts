import { ParsedStream } from '@aiostreams/types';
import { formatSize } from './utils';

export function torrentioFormat(stream: ParsedStream): {
  name: string;
  description: string;
} {
  let name: string = '';

  if (stream.provider) {
    name += stream.provider.cached
      ? `[${stream.provider.name}+]\n`
      : `[${stream.provider.name} download]\n`;
  }

  name += `${stream.addonName} ${stream.resolution} `;

  if (stream.visualTags.length > 0) {
    name += stream.visualTags.join(' | ');
  }

  let description = stream.filename;
  if (
    stream.size ||
    stream.torrent?.seeders ||
    stream.usenet?.age ||
    stream.indexers
  ) {
    description += '\n';

    description += stream.torrent?.seeders
      ? `👤 ${stream.torrent.seeders} `
      : '';

    description += stream.usenet?.age ? `📅 ${stream.usenet.age}d ` : '';

    description += `💾 ${formatSize(stream.size || 0)} `;

    description += stream.indexers ? `⚙️ ${stream.indexers} ` : '';
  }
  if (stream.languages.length !== 0) {
    description += `\n${stream.languages.join(' / ')}`;
  }

  return { name, description };
}
