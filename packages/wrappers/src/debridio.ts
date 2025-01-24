import { AddonDetail, ParsedNameData, StreamRequest } from '@aiostreams/types';
import { parseFilename, extractSizeInBytes } from '@aiostreams/parser';
import { ParsedStream, Stream, Config } from '@aiostreams/types';
import { BaseWrapper } from './base';
import { addonDetails, serviceDetails } from '@aiostreams/utils';
import { Settings } from '@aiostreams/utils';
import { emojiToLanguage } from '@aiostreams/formatters';

export class Debridio extends BaseWrapper {
  constructor(
    configString: string | null,
    overrideUrl: string | null,
    addonName: string = 'Debridio',
    addonId: string,
    userConfig: Config,
    indexerTimeout?: number
  ) {
    let url = overrideUrl
      ? overrideUrl
      : Settings.DEBRIDIO_URL + (configString ? configString + '/' : '');

    super(
      addonName,
      url,
      addonId,
      userConfig,
      indexerTimeout || Settings.DEFAULT_DEBRIDIO_TIMEOUT
    );
  }

  protected parseStream(stream: Stream): ParsedStream {
    const [filename, metaString, languageString] =
      stream.title?.split('\n') || [];

    const parsedFilename: ParsedNameData = parseFilename(
      filename || stream.title || ''
    );

    const sizeInBytes = stream.behaviorHints?.videoSize
      ? stream.behaviorHints.videoSize
      : metaString
        ? extractSizeInBytes(metaString, 1024)
        : undefined;

    const debrid = this.parseServiceData(
      stream.name?.split('\n')?.[0] || ''
    ) || {
      id: 'easydebrid',
      cached: false,
    };
    const seedersMatch = RegExp(/👤 (\d+)/).exec(stream.title!);
    const seeders = seedersMatch ? parseInt(seedersMatch[1]) : undefined;

    const indexerMatch = RegExp(/⚙️ (.+)/).exec(
      stream.title?.split('\n')[1] || ''
    );
    const indexer = indexerMatch ? indexerMatch[1] : undefined;

    if (languageString) {
      const languages = languageString.replace('🌐', '').split('|');
      languages.forEach((language, index) => {
        let convertedLanguage = language.trim();
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

const getDebridioConfigString = (provider: string, apiKey: string) => {
  const config = {
    provider,
    apiKey,
  };
  return Buffer.from(JSON.stringify(config)).toString('base64');
};

export async function getDebridioStreams(
  config: Config,
  debridioOptions: {
    prioritiseDebrid?: string;
    overrideName?: string;
    overrideUrl?: string;
    indexerTimeout?: string;
  },
  streamRequest: StreamRequest,
  addonId: string
): Promise<ParsedStream[]> {
  const supportedServices: string[] =
    addonDetails.find((addon: AddonDetail) => addon.id === 'debridio')
      ?.supportedServices || [];
  const parsedStreams: ParsedStream[] = [];
  const indexerTimeout = debridioOptions.indexerTimeout
    ? parseInt(debridioOptions.indexerTimeout)
    : undefined;

  // If overrideUrl is provided, use it to get streams and skip all other steps
  if (debridioOptions.overrideUrl) {
    const debridio = new Debridio(
      null,
      debridioOptions.overrideUrl as string,
      debridioOptions.overrideName,
      addonId,
      config,
      indexerTimeout
    );
    return debridio.getParsedStreams(streamRequest);
  }

  // find all usable and enabled services
  const usableServices = config.services.filter(
    (service) => supportedServices.includes(service.id) && service.enabled
  );

  // if no usable services found, throw an error
  if (usableServices.length < 1) {
    throw new Error('No supported service(s) enabled');
  }

  // otherwise, depending on the configuration, create multiple instances of comet or use a single instance with the prioritised service

  if (
    debridioOptions.prioritiseDebrid &&
    !supportedServices.includes(debridioOptions.prioritiseDebrid)
  ) {
    throw new Error('Invalid debrid service');
  }

  if (debridioOptions.prioritiseDebrid) {
    const debridService = usableServices.find(
      (service) => service.id === debridioOptions.prioritiseDebrid
    );
    if (!debridService) {
      throw new Error(
        'Debrid service not found for ' + debridioOptions.prioritiseDebrid
      );
    }
    if (!debridService.credentials.apiKey) {
      throw new Error(
        'Debrid service API key not found for ' +
          debridioOptions.prioritiseDebrid
      );
    }

    // get the comet config and b64 encode it
    const debridioConfigString = getDebridioConfigString(
      debridioOptions.prioritiseDebrid,
      debridService.credentials.apiKey
    );

    const debridio = new Debridio(
      debridioConfigString,
      null,
      debridioOptions.overrideName,
      addonId,
      config,
      indexerTimeout
    );

    return debridio.getParsedStreams(streamRequest);
  }

  // if no prioritised service is provided, create a debridio instance for each service
  const servicesToUse = usableServices.filter((service) => service.enabled);
  if (servicesToUse.length < 1) {
    throw new Error('No supported service(s) enabled');
  }

  const streamPromises = servicesToUse.map(async (service) => {
    const debridioConfigString = getDebridioConfigString(
      service.id,
      service.credentials.apiKey
    );
    const debridio = new Debridio(
      debridioConfigString,
      null,
      debridioOptions.overrideName,
      addonId,
      config,
      indexerTimeout
    );
    return debridio.getParsedStreams(streamRequest);
  });

  const streamsArray = await Promise.all(streamPromises);
  streamsArray.forEach((streams) => parsedStreams.push(...streams));

  return parsedStreams;
}
