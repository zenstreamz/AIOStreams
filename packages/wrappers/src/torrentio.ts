import { ParsedNameData, StreamRequest } from '@aiostreams/types';
import { parseFilename, extractSizeInBytes } from '@aiostreams/parser';
import { ParsedStream, Stream, Config } from '@aiostreams/types';
import { BaseWrapper } from './base';

export class Torrentio extends BaseWrapper {
  private readonly name: string = 'Torrentio';

  constructor(configString: string | null, overrideUrl: string | null, indexerTimeout: number = 10000, addonName: string = 'Torrentio') {
    if (overrideUrl && overrideUrl.endsWith('/manifest.json')) {
      overrideUrl = overrideUrl.replace('/manifest.json', '/');
    }

    let url = overrideUrl
      ? overrideUrl
      : 'https://torrentio.strem.fun/' +
        (configString ? configString + '/' : '');

    super(addonName, url, indexerTimeout);
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

export async function getTorrentioStreams(
  config: Config,
  torrentioOptions: {
    useMultipleInstances?: boolean;
    overrideUrl?: string;
    indexerTimeout?: number;
    overrideName?: string;
  },
  streamRequest: StreamRequest
): Promise<ParsedStream[]> {
  const supportedServices: string[] = [
    'realdebrid',
    'alldebrid',
    'premiumize',
    'putio',
    'torbox',
    'offcloud',
    'debridlink',
  ];
  const parsedStreams: ParsedStream[] = [];

  // If overrideUrl is provided, use it to get streams and skip all other steps
  if (torrentioOptions.overrideUrl) {
    const torrentio = new Torrentio(null, torrentioOptions.overrideUrl as string, torrentioOptions.indexerTimeout);
    return torrentio.getParsedStreams(streamRequest);
  }

  // find all usable services
  const usableServices = config.services.filter((service) =>
    supportedServices.includes(service.id)
  );

  // if no usable services found, use torrentio without any configuration
  if (usableServices.length < 0) {
    const torrentio = new Torrentio(null, null, torrentioOptions.indexerTimeout);
    return await torrentio.getParsedStreams(streamRequest);
  }

  // otherwise, depending on the configuration, create multiple instances of torrentio or use a single instance with all services

  const getServicePair = (
    serviceId: string,
    credentials: { [key: string]: string }
  ) => {
    return serviceId === 'putio'
      ? `${serviceId}=${credentials.clientId}@${credentials.token}`
      : `${serviceId}=${credentials.apiKey}`;
  };

  if (torrentioOptions.useMultipleInstances) {
    for (const service of usableServices) {
      if (!service.enabled) {
        continue;
      }
      console.log('Creating Torrentio instance with service:', service.id);
      let configString = getServicePair(service.id, service.credentials);
      const torrentio = new Torrentio(configString, null, torrentioOptions.indexerTimeout);
      const streams = await torrentio.getParsedStreams(streamRequest);
      parsedStreams.push(...streams);
    }
    return parsedStreams;
  } else {
    let configString = '';
    for (const service of usableServices) {
      if (!service.enabled) {
        continue;
      }
      configString += getServicePair(service.id, service.credentials) + '|';
    }
    const torrentio = new Torrentio(configString, null, torrentioOptions.indexerTimeout, torrentioOptions.overrideName);
    return await torrentio.getParsedStreams(streamRequest);
  }
}
