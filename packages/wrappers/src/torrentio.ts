import { ParsedNameData } from '@aiostreams/types';
import { parseFilename, extractSizeInBytes } from '@aiostreams/parser';
import { ParsedStream, Stream, Config } from '@aiostreams/types';
import { BaseWrapper } from './base';

const supportedServices: string[] = [
  'realdebrid',
  'alldebrid',
  'premiumize',
  'putio',
  'torbox',
  'offcloud',
  'debridlink',
];

export class Torrentio extends BaseWrapper {
  private readonly name: string = 'Torrentio';

  constructor(services: Config['services'], overrideUrl?: string) {
    let configString = '';

    if (!overrideUrl) {
      let enabledServices: [string, string][] = [];

      for (const service of services) {
        if (supportedServices.includes(service.id) && service.enabled) {
          if (service.id === 'putio') {
            const clientId = service.credentials.find(
              (cred) => cred.id === 'clientId'
            )?.value;
            const token = service.credentials.find(
              (cred) => cred.id === 'token'
            )?.value;
            if (!clientId || !token) {
              continue;
            }
            enabledServices.push([service.id, `${clientId}@${token}`]);
          } else {
            const apiKey = service.credentials.find(
              (cred) => cred.id === 'apiKey'
            )?.value;
            if (!apiKey) {
              continue;
            }
            enabledServices.push([service.id, apiKey]);
          }
        }
      }
      if (enabledServices.length !== 0) {
        configString =
          enabledServices.map(([id, value]) => `${id}=${value}`).join('|') +
          '/';
      }
    } else {
      configString = overrideUrl
        .replace('https://torrentio.strem.fun/', '')
        .replace('manifest.json', '');
    }

    console.log('Using config string', configString);
    super('Torrentio', 'https://torrentio.strem.fun/' + configString);
  }

  protected parseStream(stream: Stream): ParsedStream {
    const filename = stream?.behaviorHints?.filename
      ? stream.behaviorHints.filename.trim()
      : stream.title!.split('\n')[0];
    const parsedFilename: ParsedNameData = parseFilename(filename);
    const sizeInBytes = stream.title
      ? extractSizeInBytes(stream.title, 1024)
      : 0;
    const debridMatch = RegExp(/^\[([a-zA-Z]{2})(\+| download)\]/).exec(
      stream.name!
    );
    const debrid = debridMatch
      ? {
          provider: debridMatch[1],
          cached: debridMatch[2] === '+',
        }
      : undefined;
    const seedersMatch = RegExp(/👤 (\d+)/).exec(stream.title!);
    const seeders = seedersMatch ? parseInt(seedersMatch[1]) : undefined;

    const indexerMatch = RegExp(/⚙️ ([a-zA-Z0-9]+)/).exec(stream.title!);
    const indexer = indexerMatch ? indexerMatch[1] : undefined;

    return {
      ...parsedFilename,
      filename,
      size: sizeInBytes,
      addonName: this.name,
      url: stream.url,
      externalUrl: stream.externalUrl,
      torrent: {
        infoHash: stream.infoHash,
        fileIdx: stream.fileIdx,
        seeders: seeders,
        sources: stream.sources,
      },
      indexers: indexer,
      provider: debrid
        ? {
            name: debrid.provider,
            cached: debrid.cached,
          }
        : undefined,
    };
  }
}
