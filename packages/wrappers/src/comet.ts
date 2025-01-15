import { AddonDetail, ParsedNameData, StreamRequest } from '@aiostreams/types';
import { parseFilename, extractSizeInBytes } from '@aiostreams/parser';
import { ParsedStream, Stream, Config } from '@aiostreams/types';
import { BaseWrapper } from './base';
import { addonDetails, serviceDetails } from '@aiostreams/utils';
import { Settings } from '@aiostreams/utils';

interface CometStream extends Stream {
  torrentTitle?: string;
  torrentSize?: number;
}

export class Comet extends BaseWrapper {
  constructor(
    configString: string | null,
    overrideUrl: string | null,
    indexerTimeout: number = Settings.DEFAULT_COMET_TIMEOUT,
    addonName: string = 'Comet',
    addonId: string,
    userConfig: Config
  ) {
    let url = overrideUrl
      ? overrideUrl
      : Settings.COMET_URL +
        (configString ? configString + '/' : '');

    super(addonName, url, indexerTimeout, addonId, userConfig);
  }

  protected parseStream(stream: CometStream): ParsedStream {
    const filename =
      stream.behaviorHints?.filename?.trim() ||
      stream.description?.split('\n')[0] ||
      stream.torrentTitle;

    const parsedFilename: ParsedNameData = parseFilename(
      filename || stream.description || ''
    );
    const sizeInBytes = stream.torrentSize
      ? stream.torrentSize
      : stream.description
        ? extractSizeInBytes(stream.description, 1024)
        : undefined;

    const debridMatch = RegExp(/^\[([a-zA-Z]{2})(\⚡)\]/).exec(stream.name!);
    const debrid = debridMatch
      ? {
          id: serviceDetails.find((service) => service.knownNames.includes(debridMatch[1]))?.id || debridMatch[1],
          cached: debridMatch[2] === '⚡',
        }
      : undefined;

    const indexerMatch = RegExp(/🔎 ([a-zA-Z0-9]+)/).exec(
      stream.description || ''
    );
    const indexer = indexerMatch ? indexerMatch[1] : undefined;

    const parsedStream: ParsedStream = this.createParsedResult(
      parsedFilename,
      stream,
      filename,
      sizeInBytes,
      debrid,
      undefined,
      undefined,
      indexer
    );
    return parsedStream;
  }
}

const getCometConfig = (debridService: string, debridApiKey: string) => {
  return {
    indexers: ['bitsearch', 'eztv', 'thepiratebay', 'therarbg', 'yts'],
    maxResults: 0,
    maxResultsPerResolution: 0,
    maxSize: 0,
    reverseResultOrder: false,
    removeTrash: true,
    resultFormat: ['All'],
    resolutions: ['All'],
    languages: ['All'],
    debridService: debridService,
    debridApiKey: debridApiKey,
    stremthruUrl: '',
    debridStreamProxyPassword: '',
  };
};

export async function getCometStreams(
  config: Config,
  cometOptions: {
    prioritiseDebrid?: string;
    overrideUrl?: string;
    indexerTimeout?: string;
    overrideName?: string;
  },
  streamRequest: StreamRequest,
  addonId: string,
): Promise<ParsedStream[]> {
  const supportedServices: string[] =
    addonDetails.find((addon: AddonDetail) => addon.id === 'comet')
      ?.supportedServices || [];
  const parsedStreams: ParsedStream[] = [];
  const indexerTimeout = cometOptions.indexerTimeout
    ? parseInt(cometOptions.indexerTimeout)
    : undefined;

  // If overrideUrl is provided, use it to get streams and skip all other steps
  if (cometOptions.overrideUrl) {
    const comet = new Comet(
      null,
      cometOptions.overrideUrl as string,
      indexerTimeout,
      cometOptions.overrideName,
      addonId,
      config,
    );
    return comet.getParsedStreams(streamRequest);
  }

  // find all usable and enabled services
  const usableServices = config.services.filter(
    (service) =>
      supportedServices.includes(service.id) && service.enabled
  );

  // if no usable services found, throw an error
  if (usableServices.length < 1) {
    throw new Error('No supported service(s) enabled');
  }

  // otherwise, depending on the configuration, create multiple instances of comet or use a single instance with the prioritised service

  if (
    cometOptions.prioritiseDebrid &&
    !supportedServices.includes(cometOptions.prioritiseDebrid)
  ) {
    throw new Error('Invalid debrid service');
  }

  if (cometOptions.prioritiseDebrid) {
    const debridService = usableServices.find(
      (service) => service.id === cometOptions.prioritiseDebrid
    );
    if (!debridService) {
      throw new Error(
        'Debrid service not found for ' + cometOptions.prioritiseDebrid
      );
    }
    if (!debridService.credentials.apiKey) {
      throw new Error(
        'Debrid service API key not found for ' + cometOptions.prioritiseDebrid
      );
    }

    // get the comet config and b64 encode it
    const cometConfig = getCometConfig(
      cometOptions.prioritiseDebrid,
      debridService.credentials.apiKey
    );
    const configString = Buffer.from(JSON.stringify(cometConfig)).toString(
      'base64'
    );
    const comet = new Comet(
      configString,
      null,
      indexerTimeout,
      cometOptions.overrideName,
      addonId,
      config
    );

    return comet.getParsedStreams(streamRequest);
  }

  // if no prioritised service is provided, create a comet instance for each service
  const servicesToUse = usableServices.filter((service) => service.enabled);
  if (servicesToUse.length < 1) {
    throw new Error('No supported service(s) enabled');
  }

  const streamPromises = servicesToUse.map(async (service) => {
    const cometConfig = getCometConfig(service.id, service.credentials.apiKey);
    const configString = Buffer.from(JSON.stringify(cometConfig)).toString(
      'base64'
    );
    const comet = new Comet(
      configString,
      null,
      indexerTimeout,
      cometOptions.overrideName,
      addonId,
      config
    );
    return comet.getParsedStreams(streamRequest);
  });

  const streamsArray = await Promise.all(streamPromises);
  streamsArray.forEach((streams) => parsedStreams.push(...streams));

  return parsedStreams;
}
