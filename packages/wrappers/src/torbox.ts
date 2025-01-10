import { BaseWrapper } from './base';
import {
  Config,
  ParsedNameData,
  ParsedStream,
  StreamRequest,
} from '@aiostreams/types';
import { parseFilename } from '@aiostreams/parser';
import { Settings } from '@aiostreams/utils';

interface TorboxStream {
  name: string;
  description: string;
  size: number;
  url: string;
  type: string;
  seeders: number;
  is_cached: boolean;
}

export class Torbox extends BaseWrapper {
  constructor(
    apiKey: string,
    indexerTimeout: number = Settings.DEFAULT_TORBOX_TIMEOUT,
    addonName: string = 'Torbox',
    addonId: string
  ) {
    super(
      addonName,
      Settings.TORBOX_STREMIO_URL + apiKey + '/',
      indexerTimeout,
      addonId
    );
  }

  protected parseStream(stream: TorboxStream): ParsedStream | undefined {
    if (stream.name.includes('Your Media')) {
      return undefined;
    }
    let type = stream.type;
    const [quality, filename, _, language, ageOrSeeders] = stream.description
      .split('\n')
      .map((field: string) => {
        if (field.startsWith('Type')) {
          const [typeField, ageOrSeeders] = field.split('|');
          if (!['torrent', 'usenet'].includes(type)) {
            type = typeField.split(':')[1].trim().toLowerCase();
          }
          const [_, value] = ageOrSeeders.split(':');
          return value.trim();
        }
        const [_, value] = field.split(':');
        return value.trim();
      });

    const parsedFilename: ParsedNameData = parseFilename(filename);

    /* If the quality from Torbox is not one of the qualities in the Config, they get filtered out
    So, for now, we will not update the quality from Torbox
    We can revisit this later and match the quality from Torbox to one of the qualities in the Config
    if (parsedFilename.quality === 'Unknown' && quality !== 'Unknown') {
      parsedFilename.quality = quality;
    }
    */
    if (
      !parsedFilename.languages.some(
        (lang: string) => lang.toLowerCase() === language.toLowerCase()
      ) &&
      language !== 'Unknown'
    ) {
      parsedFilename.languages.push(language.charAt(0).toUpperCase() + language.slice(1).toLowerCase());
    }

    const sizeInBytes = stream.size;
    const provider = {
      id: 'torbox',
      cached: stream.is_cached,
    };

    const seeders = type === 'torrent' ? stream.seeders : undefined;
    const age = type === 'usenet' ? ageOrSeeders : undefined;

    const parsedStream: ParsedStream = this.createParsedResult(
      parsedFilename,
      stream,
      filename,
      sizeInBytes,
      provider,
      seeders,
      age
    );

    return parsedStream;
  }
}

export async function getTorboxStreams(
  config: Config,
  torboxOptions: {
    indexerTimeout?: string;
    overrideName?: string;
  },
  streamRequest: StreamRequest,
  addonId: string
): Promise<ParsedStream[]> {
  const torboxService = config.services.find(
    (service) => service.id === 'torbox'
  );
  if (!torboxService) {
    throw new Error('Torbox service not found');
  }

  const torboxApiKey = torboxService.credentials.apiKey;
  if (!torboxApiKey) {
    throw new Error('Torbox API key not found');
  }

  const torbox = new Torbox(
    torboxApiKey,
    torboxOptions.indexerTimeout
      ? parseInt(torboxOptions.indexerTimeout)
      : undefined,
    torboxOptions.overrideName,
    addonId
  );
  return await torbox.getParsedStreams(streamRequest);
}
