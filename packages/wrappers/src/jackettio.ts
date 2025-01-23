/*{"maxTorrents":30,"priotizePackTorrents":2,"excludeKeywords":[],"debridId":"alldebrid","hideUncached":false,"sortCached":[["quality",true],["size",true]],"sortUncached":[["seeders",true]],"forceCacheNextEpisode":false,"priotizeLanguages":[],"indexerTimeoutSec":60,"metaLanguage":"","enableMediaFlow":false,"mediaflowProxyUrl":"","mediaflowApiPassword":"","mediaflowPublicIp":"","qualities":[0,360,480,720,1080,2160],"indexers":["bitsearch","eztv","thepiratebay","therarbg","yts"],"debridApiKey":"KfejOmW7c5gUC3WNFCCq"}*/

import { AddonDetail, ParsedNameData, StreamRequest } from '@aiostreams/types';
import { parseFilename, extractSizeInBytes } from '@aiostreams/parser';
import { ParsedStream, Stream, Config } from '@aiostreams/types';
import { BaseWrapper } from './base';
import { addonDetails, serviceDetails } from '@aiostreams/utils';
import { Settings } from '@aiostreams/utils';
import { emojiToLanguage } from '@aiostreams/formatters';

// name, title, url
export class Jackettio extends BaseWrapper {
  constructor(
    configString: string | null,
    overrideUrl: string | null,
    indexerTimeout: number = Settings.DEFAULT_JACKETTIO_TIMEOUT,
    addonName: string = 'Jackettio',
    addonId: string,
    userConfig: Config
  ) {
    let url = overrideUrl
      ? overrideUrl
      : Settings.JACKETTIO_URL + (configString ? configString + '/' : '');

    super(addonName, url, indexerTimeout, addonId, userConfig);
  }

  protected parseStream(stream: Stream): ParsedStream {
    const filename =
      stream.behaviorHints?.filename?.trim() ||
      stream.title?.split('\n')[0] ||
      undefined;

    const parsedFilename: ParsedNameData = parseFilename(
      filename || stream.title || ''
    );
    const sizeInBytes = stream.title
      ? extractSizeInBytes(stream.title, 1024)
      : undefined;

    const debrid = this.parseServiceData(stream.name || '');
    if (debrid?.id && debrid.cached === undefined) {
      debrid.cached = false;
    }

    const indexerAndLanguages = RegExp(
      /⚙️([^\p{Emoji_Presentation}]+)([\p{Emoji_Presentation}\s]*)$/u
    ).exec(stream.title || '');
    const indexer = indexerAndLanguages?.[1];
    indexerAndLanguages?.[2]
      .trim()
      .split(' ')
      .filter((lang) => lang)
      .map((lang) => {
        let convertedLanguage = lang.trim();
        if (convertedLanguage === 'Multi Audio') {
          convertedLanguage = 'Multi';
        }
        convertedLanguage =
          emojiToLanguage(convertedLanguage) || convertedLanguage;
        convertedLanguage = convertedLanguage.replace(/\b\w/g, (char) =>
          char.toUpperCase()
        );
        if (!parsedFilename.languages.includes(convertedLanguage)) {
          parsedFilename.languages.push(convertedLanguage);
        }
      });

    const seederMatch = stream.title?.match(/(👥|👤) (\d+)/)?.[2];
    const seeders = seederMatch ? parseInt(seederMatch[1]) : undefined;

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

const getJackettioConfigString = (
  debridService: string,
  debridApiKey: string
) => {
  return Buffer.from(
    JSON.stringify({
      maxTorrents: 30,
      priotizePackTorrents: 2,
      excludeKeywords: [],
      debridId: debridService,
      hideUncached: false,
      sortCached: [
        ['quality', true],
        ['size', true],
      ],
      sortUncached: [['seeders', true]],
      forceCacheNextEpisode: false,
      priotizeLanguages: [],
      indexerTimeoutSec: 60,
      metaLanguage: '',
      enableMediaFlow: false,
      mediaflowProxyUrl: '',
      mediaflowApiPassword: '',
      mediaflowPublicIp: '',
      qualities: [0, 360, 480, 720, 1080, 2160],
      indexers: ['bitsearch', 'eztv', 'thepiratebay', 'therarbg', 'yts'],
      debridApiKey: debridApiKey,
    })
  ).toString('base64');
};

export async function getJackettioStreams(
  config: Config,
  jackettioOptions: {
    prioritiseDebrid?: string;
    overrideUrl?: string;
    indexerTimeout?: string;
    overrideName?: string;
  },
  streamRequest: StreamRequest,
  addonId: string
): Promise<ParsedStream[]> {
  const supportedServices: string[] =
    addonDetails.find((addon: AddonDetail) => addon.id === 'jackettio')
      ?.supportedServices || [];
  const parsedStreams: ParsedStream[] = [];

  const indexerTimeout = jackettioOptions.indexerTimeout
    ? parseInt(jackettioOptions.indexerTimeout)
    : undefined;

  // If overrideUrl is provided, use it to get streams and skip all other steps
  if (jackettioOptions.overrideUrl) {
    const jackettio = new Jackettio(
      null,
      jackettioOptions.overrideUrl as string,
      indexerTimeout,
      jackettioOptions.overrideName,
      addonId,
      config
    );
    return jackettio.getParsedStreams(streamRequest);
  }

  // find all usable and enabled services
  const usableServices = config.services.filter(
    (service) => supportedServices.includes(service.id) && service.enabled
  );

  // if no usable services found, throw an error
  if (usableServices.length < 1) {
    throw new Error('No supported service(s) enabled');
  }

  // otherwise, depending on the configuration, create multiple instances of jackettio or use a single instance with the prioritised service

  if (
    jackettioOptions.prioritiseDebrid &&
    !supportedServices.includes(jackettioOptions.prioritiseDebrid)
  ) {
    throw new Error('Invalid debrid service');
  }

  if (jackettioOptions.prioritiseDebrid) {
    const debridService = usableServices.find(
      (service) => service.id === jackettioOptions.prioritiseDebrid
    );
    if (!debridService) {
      throw new Error(
        'Debrid service not found for ' + jackettioOptions.prioritiseDebrid
      );
    }
    if (!debridService.credentials.apiKey) {
      throw new Error(
        'Debrid service API key not found for ' +
          jackettioOptions.prioritiseDebrid
      );
    }

    // get the jackettio config and b64 encode it

    const configString = getJackettioConfigString(
      debridService.id,
      debridService.credentials.apiKey
    );
    const jackettio = new Jackettio(
      configString,
      null,
      indexerTimeout,
      jackettioOptions.overrideName,
      addonId,
      config
    );

    return jackettio.getParsedStreams(streamRequest);
  }

  // if no prioritised service is provided, create a jackettio instance for each service
  const servicesToUse = usableServices.filter((service) => service.enabled);
  if (servicesToUse.length < 1) {
    throw new Error('No supported service(s) enabled');
  }

  const streamPromises = servicesToUse.map(async (service) => {
    const configString = getJackettioConfigString(
      service.id,
      service.credentials.apiKey
    );
    const jackettio = new Jackettio(
      configString,
      null,
      indexerTimeout,
      jackettioOptions.overrideName,
      addonId,
      config
    );
    return jackettio.getParsedStreams(streamRequest);
  });

  const streamsArray = await Promise.all(streamPromises);
  streamsArray.forEach((streams) => parsedStreams.push(...streams));

  return parsedStreams;
}
