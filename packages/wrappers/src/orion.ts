import { AddonDetail, ParsedNameData, StreamRequest } from '@aiostreams/types';
import { parseFilename, extractSizeInBytes } from '@aiostreams/parser';
import { ParsedStream, Stream, Config } from '@aiostreams/types';
import { BaseWrapper } from './base';
import { addonDetails, serviceDetails } from '@aiostreams/utils';
import { Settings } from '@aiostreams/utils';
import { emojiToLanguage } from '@aiostreams/formatters';

// name, title, url
export class OrionStremioAddon extends BaseWrapper {
  constructor(
    configString: string | null,
    overrideUrl: string | null,
    indexerTimeout: number = Settings.DEFAULT_ORION_TIMEOUT,
    addonName: string = 'Orion',
    addonId: string,
    userConfig: Config
  ) {
    let url = overrideUrl
      ? overrideUrl
      : Settings.ORION_STREMIO_ADDON_URL +
        (configString ? configString + '/' : '');

    super(addonName, url, indexerTimeout, addonId, userConfig);
  }

  protected parseStream(stream: Stream): ParsedStream {
    const filename = stream.title
      ? stream.title.includes('ERROR')
        ? `Error: ${stream.title.split('\n')[1]} - ${stream.title.split('\n')[2]}`
        : stream.title.split('\n')[0]
      : stream.behaviorHints?.filename?.trim();

    const parsedFilename: ParsedNameData = parseFilename(filename || '');
    const sizeInBytes = stream.title
      ? extractSizeInBytes(stream.title, 1024)
      : 0;

    const debrid = this.parseServiceData(stream);
    if (debrid?.id && !debrid.cached) {
      debrid.cached = true;
    }
    const seedersMatch = RegExp(/👤(\d+)/).exec(stream.title!);
    const seeders = seedersMatch ? parseInt(seedersMatch[1]) : undefined;

    const indexerMatch = RegExp(/☁️(.+)/).exec(
      stream.title?.split('\n')[1] || ''
    );
    const indexer = indexerMatch ? indexerMatch[1] : undefined;

    // TODO: orion returns 2 letter language codes, convert them to full names

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

function getOrionConfigString(
  orionApiKey: string,
  linkLimit: string = '10',
  debridServices: string[]
) {
  return Buffer.from(
    JSON.stringify({
      api: orionApiKey,
      linkLimit: linkLimit,
      sortValue: 'best',
      audiochannels: '1,2,6,8',
      videoquality:
        'hd8k,hd6k,hd4k,hd2k,hd1080,hd720,sd,scr1080,scr720,scr,cam1080,cam720,cam',
      listOpt: 'both',
      debridservices: debridServices,
      audiolanguages: [],
      additionalParameters: '',
    })
  ).toString('base64');
}

export async function getOrionStreams(
  config: Config,
  orionOptions: {
    orionApiKey?: string;
    linkLimit?: string;
    overrideUrl?: string;
    indexerTimeout?: string;
    overrideName?: string;
  },
  streamRequest: StreamRequest,
  addonId: string
): Promise<ParsedStream[]> {
  const orionServiceConfig = config.services.find(
    (service) => service.id === 'orion'
  );

  // orion api key can either be in deprecated orionApiKey or in the new orionServiceConfig
  let orionApiKey =
    orionOptions.orionApiKey || orionServiceConfig?.credentials.apiKey || '';
  if (!orionApiKey && !orionOptions.overrideUrl) {
    throw new Error('Missing Orion API key or override URL');
  }

  const supportedServices: string[] =
    addonDetails.find(
      (addon: AddonDetail) => addon.id === 'orion-stremio-addon'
    )?.supportedServices || [];
  const indexerTimeout = orionOptions.indexerTimeout
    ? parseInt(orionOptions.indexerTimeout)
    : undefined;

  // If overrideUrl is provided, use it to get streams and skip all other steps
  if (orionOptions.overrideUrl) {
    const orion = new OrionStremioAddon(
      null,
      orionOptions.overrideUrl as string,
      indexerTimeout,
      orionOptions.overrideName,
      addonId,
      config
    );
    return orion.getParsedStreams(streamRequest);
  }

  // find all usable services
  const usableServices = config.services.filter(
    (service) => supportedServices.includes(service.id) && service.enabled
  );

  // if no usable services found, use orion without any configuration
  if (usableServices.length < 1) {
    const configString = getOrionConfigString(
      orionApiKey,
      orionOptions.linkLimit,
      []
    );
    const orion = new OrionStremioAddon(
      configString,
      null,
      indexerTimeout,
      orionOptions.overrideName,
      addonId,
      config
    );
    return await orion.getParsedStreams(streamRequest);
  }

  // otherwise, pass all the services to orion
  const debridServices = usableServices.map((service) => service.id);
  console.log(
    `|DBG| wrappers > orion > using debrid services: ${debridServices}`
  );
  const configString = getOrionConfigString(
    orionApiKey,
    orionOptions.linkLimit,
    debridServices
  );
  const orion = new OrionStremioAddon(
    configString,
    null,
    indexerTimeout,
    orionOptions.overrideName,
    addonId,
    config
  );
  return await orion.getParsedStreams(streamRequest);
}
