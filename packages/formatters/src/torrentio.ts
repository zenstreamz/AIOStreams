import { ParsedStream } from '@aiostreams/types';
import { formatSize, languageToEmoji } from './utils';

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

  let description = stream.filename ? stream.filename : 'Unknown Name';
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

    description += stream.usenet?.age ? `📅 ${stream.usenet.age} ` : '';

    description += `💾 ${formatSize(stream.size || 0)} `;

    description += stream.indexers ? `⚙️ ${stream.indexers} ` : '';
  }
  const languageEmojis = stream.languages.map((lang) => {
    const emoji = languageToEmoji(lang);
    return emoji ? emoji : lang;
  });
  if (languageEmojis.length > 0) {
    description += `\n${languageEmojis.join(' / ')}`;
  }
  return { name, description };
}
