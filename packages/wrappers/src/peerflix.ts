import { AddonDetail, ParsedNameData, StreamRequest } from '@aiostreams/types';
import { parseFilename, extractSizeInBytes } from '@aiostreams/parser';
import { ParsedStream, Stream, Config } from '@aiostreams/types';
import { BaseWrapper } from './base';
import { addonDetails, serviceDetails } from '@aiostreams/utils';
import { Settings } from '@aiostreams/utils';
import { emojiToLanguage } from '@aiostreams/formatters';

interface PeerflixStream extends Stream {
  seed?: string;
  sizeBytes?: number;
  language?: string;
  quality?: string;
}

export class Peerflix extends BaseWrapper {
  constructor(
    configString: string | null,
    overrideUrl: string | null,
    indexerTimeout: number = Settings.DEFAULT_PEERFLIX_TIMEOUT,
    addonName: string = 'Peerflix',
    addonId: string,
    userConfig: Config
  ) {
    let url = overrideUrl
      ? overrideUrl
      : Settings.PEERFLIX_URL + (configString ? configString + '/' : '');

    super(addonName, url, indexerTimeout, addonId, userConfig);
  }

  protected parseStream(stream: PeerflixStream): ParsedStream {
    const filename = stream.title
      ? stream.title.split('\n')[0]
      : stream.behaviorHints?.filename?.trim();

    const parsedFilename: ParsedNameData = parseFilename(filename || '');
    const sizeInBytes =
      stream.sizeBytes ||
      (stream.title ? extractSizeInBytes(stream.title, 1024) : 0);

    const debrid = this.parseServiceData(stream.name || '');
    const seedersMatch = RegExp(/👤 (\d+)/).exec(stream.title!);
    const seeders =
      parseInt(stream.seed || seedersMatch?.[1] || '0') || undefined;

    const indexerMatch = RegExp(
      /[🌐] ([^\s\p{Emoji_Presentation}]+(?:\s[^\s\p{Emoji_Presentation}]+)*)/u
    ).exec(stream.title || stream.description || '');
    const indexer = indexerMatch ? indexerMatch[1] : undefined;

    if (
      (stream.language == 'en' || stream.name?.includes('🇬🇧')) &&
      !parsedFilename.languages.includes('English')
    ) {
      parsedFilename.languages.push('English');
    } else if (
      (stream.language === 'es' || stream.name?.includes('🇪🇸')) &&
      !parsedFilename.languages.includes('Spanish')
    ) {
      parsedFilename.languages.push('Spanish');
    }

    const parsedStream: ParsedStream = this.createParsedResult(
      parsedFilename,
      stream,
      filename,
      sizeInBytes,
      debrid,
      seeders,
      undefined,
      indexer,
      undefined,
      undefined,
      this.extractInfoHash(stream.url || '')
    );
    return parsedStream;
  }
}

export async function getPeerflixStreams(
  config: Config,
  peerflixOptions: {
    showP2PStreams?: string;
    useMultipleInstances?: string;
    overrideUrl?: string;
    indexerTimeout?: string;
    overrideName?: string;
  },
  streamRequest: StreamRequest,
  addonId: string
): Promise<ParsedStream[]> {
  const supportedServices: string[] =
    addonDetails.find((addon: AddonDetail) => addon.id === 'peerflix')
      ?.supportedServices || [];
  const parsedStreams: ParsedStream[] = [];
  const indexerTimeout = peerflixOptions.indexerTimeout
    ? parseInt(peerflixOptions.indexerTimeout)
    : undefined;
  console.log(JSON.stringify(peerflixOptions));
  // If overrideUrl is provided, use it to get streams and skip all other steps
  if (peerflixOptions.overrideUrl) {
    const peerflix = new Peerflix(
      null,
      peerflixOptions.overrideUrl as string,
      indexerTimeout,
      peerflixOptions.overrideName,
      addonId,
      config
    );
    return peerflix.getParsedStreams(streamRequest);
  }

  // find all usable services
  const usableServices = config.services.filter(
    (service) => supportedServices.includes(service.id) && service.enabled
  );
  console.log(
    `|DBG| wrappers > peerflix: Found ${usableServices.length} usable services: ${usableServices.map((service) => service.id).join(', ')}`
  );

  // if no usable services found, use peerflix without any configuration
  if (usableServices.length < 1) {
    const peerflix = new Peerflix(
      null,
      null,
      indexerTimeout,
      peerflixOptions.overrideName,
      addonId,
      config
    );
    return await peerflix.getParsedStreams(streamRequest);
  }

  // otherwise, depending on the configuration, create multiple instances of peerflix or use a single instance with all services

  const getServicePair = (
    serviceId: string,
    credentials: { [key: string]: string }
  ): [string, string] => {
    return serviceId === 'putio'
      ? [serviceId, `${credentials.clientId}@${credentials.token}`]
      : [serviceId, credentials.apiKey];
  };

  if (peerflixOptions.useMultipleInstances === 'true') {
    let retrievedP2PStreams = false;
    const promises = usableServices.map(async (service) => {
      if (!service.enabled) {
        return [];
      }
      console.log(
        `|DBG| wrappers > peerflix: Creating Peerflix instance with service: ${service.id}`
      );
      let configPairs = [getServicePair(service.id, service.credentials)];
      if (peerflixOptions.showP2PStreams === 'true' && !retrievedP2PStreams) {
        configPairs.push(['debridoptions', 'torrentlinks']);
        retrievedP2PStreams = true;
      }
      const configString = configPairs.map((pair) => pair.join('=')).join('|');
      const peerflix = new Peerflix(
        configString,
        null,
        indexerTimeout,
        peerflixOptions.overrideName,
        addonId,
        config
      );
      return await peerflix.getParsedStreams(streamRequest);
    });
    const results = await Promise.all(promises);
    results.forEach((streams) => parsedStreams.push(...streams));
    return parsedStreams;
  } else {
    let configPairs = [];
    for (const service of usableServices) {
      if (!service.enabled) {
        continue;
      }
      configPairs.push(getServicePair(service.id, service.credentials));
    }
    if (peerflixOptions.showP2PStreams === 'true') {
      configPairs.push(['debridoptions', 'torrentlinks']);
    }
    const configString = configPairs.map((pair) => pair.join('=')).join('|');
    const peerflix = new Peerflix(
      configString,
      null,
      indexerTimeout,
      peerflixOptions.overrideName,
      addonId,
      config
    );
    return await peerflix.getParsedStreams(streamRequest);
  }
}
