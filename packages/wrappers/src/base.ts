import {
  Stream,
  ParsedStream,
  StreamRequest,
  ParsedNameData,
} from '@aiostreams/types';
import { extractSizeInBytes, parseFilename } from '@aiostreams/parser';
import { serviceDetails, Settings } from '@aiostreams/utils';

export class BaseWrapper {
  private readonly streamPath: string = 'stream/{type}/{id}.json';
  private indexerTimeout: number;
  protected addonName: string;
  private addonUrl: string;
  private addonId: string;
  constructor(
    addonName: string,
    addonUrl: string,
    indexerTimeout: number = Settings.DEFAULT_TIMEOUT,
    addonId: string
  ) {
    this.addonName = addonName;
    this.addonUrl = this.standardizeManifestUrl(addonUrl);
    this.addonId = addonId;
    this.indexerTimeout = indexerTimeout || 3000;
  }

  protected standardizeManifestUrl(url: string): string {
    // remove trailing slash and replace stremio:// with https://
    let manifestUrl = url.replace('stremio://', 'https://').replace(/\/$/, '');
    return manifestUrl.endsWith('/manifest.json')
      ? manifestUrl
      : `${manifestUrl}/manifest.json`;
  }

  public async getParsedStreams(
    streamRequest: StreamRequest
  ): Promise<ParsedStream[]> {
    const streams: Stream[] = await this.getStreams(streamRequest);
    const parsedStreams: ParsedStream[] = streams
      .map((stream) => this.parseStream(stream))
      .filter((parsedStream) => parsedStream !== undefined);
    return parsedStreams;
  }

  private getStreamUrl(streamRequest: StreamRequest) {
    return (
      this.addonUrl.replace('manifest.json', '') +
      this.streamPath
        .replace('{type}', streamRequest.type)
        .replace('{id}', streamRequest.id)
    );
  }

  protected async getStreams(streamRequest: StreamRequest): Promise<Stream[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.indexerTimeout);

    const url = this.getStreamUrl(streamRequest);
    console.log(
      'Fetching streams from',
      this.addonName,
      'with timeout',
      this.indexerTimeout,
    );
    try {
      const response = await fetch(url, { signal: controller.signal });

      clearTimeout(timeout);

      if (!response.ok) {
        let message = await response.text();
        return Promise.reject(
          new Error(`${response.status} - ${response.statusText}: ${message}`)
        );
      }

      let results: { streams: Stream[] } = await response.json();
      return results.streams;
    } catch (error: any) {
      clearTimeout(timeout);
      let message = error.message;
      if (error.name === 'AbortError') {
        message = `${this.addonName} failed to respond within ${this.indexerTimeout}ms`;
      }
      console.error(error);
      return Promise.reject(new Error(message));
    }
  }

  protected createParsedResult(
    parsedInfo: ParsedNameData,
    stream: Stream,
    filename?: string,
    size?: number,
    provider?: ParsedStream['provider'],
    seeders?: number,
    usenetAge?: string,
    indexer?: string,
    duration?: number
  ): ParsedStream {
    return {
      ...parsedInfo,
      addon: { name: this.addonName, id: this.addonId },
      filename: filename,
      size: size,
      url: stream.url,
      externalUrl: stream.externalUrl,
      _infoHash: stream.infoHash || stream.url ? (stream.url.match(/[a-fA-F0-9]{40}/)?.[0]) : undefined,
      torrent: {
        infoHash: stream.infoHash,
        fileIdx: stream.fileIdx,
        sources: stream.sources,
        seeders: seeders,
      },
      provider: provider,
      usenet: {
        age: usenetAge,
      },
      indexers: indexer,
      duration: duration,
      stream: {
        subtitles: stream.subtitles,
        behaviorHints: {
          countryWhitelist: stream.behaviorHints?.countryWhitelist,
          notWebReady: stream.behaviorHints?.notWebReady,
          proxyHeaders: stream.behaviorHints?.proxyHeaders?.request || stream.behaviorHints?.proxyHeaders?.response
          ? {
            request: stream.behaviorHints?.proxyHeaders?.request,
            response: stream.behaviorHints?.proxyHeaders?.response,
            }
          : undefined,
          videoHash: stream.behaviorHints?.videoHash,
        },
      },
    };
  }

  protected parseStream(stream: any): ParsedStream | undefined {
    // attempt to look for filename in behaviorHints.filename, return undefined if not found
    let filename = stream.behaviorHints?.filename;

    // if filename behaviorHint is not present, attempt to look for a filename in the stream description or title
    let description = stream.description || stream.title;

    if (!filename && description) {
      console.log(
        'No filename found in behaviorHints, attempting to determine from description'
      );
      const lines = description.split('\n');
      filename =
        lines.find(
          (line: string) =>
            line.match(
              /(?<![^ [_(\-.]])(?:s(?:eason)?[ .\-_]?(\d+)[ .\-_]?(?:e(?:pisode)?[ .\-_]?(\d+))?|(\d+)[xX](\d+))(?![^ \])_.-])/
            ) || line.match(/(?<![^ [_(\-.])(\d{4})(?=[ \])_.-]|$)/i)
        ) || lines[0];
      console.log('Determined filename from description:', filename);
    } else if (!description) {
      console.log(
        'There was no description to parse for filename nor was it found in behaviorHints'
      );
    }

    let parsedInfo: ParsedNameData = parseFilename(filename || '');

    // look for size in one of the many random places it could be
    let size: number | undefined;
    size =
      stream.behaviorHints?.videoSize ||
      stream.size ||
      stream.sizebytes ||
      description
        ? extractSizeInBytes(description, 1024)
        : undefined;

    // look for seeders
    let seeders: string | undefined;
    if (description) {
      seeders = description.match(/(👥|👤) (\d+)/)?.[2];
    }

    // look for indexer
    let indexer: string | undefined;
    if (description) {
      const indexerMatch = RegExp(/[🌐⚙️🔗] ([^\s\p{Emoji_Presentation}]+(?:\s[^\s\p{Emoji_Presentation}]+)*)/u).exec(
        stream.description || ''
      );
      indexer = indexerMatch ? indexerMatch[1] : undefined
    }

    // look for providers
    const services = serviceDetails;
    const cachedSymbols = ['+', '⚡'];
    const uncachedSymbols = ['⏳', 'download'];

    // look at the stream.name for one of the knownNames in each service
    let provider: ParsedStream['provider'] | undefined;
    if (stream.name) {
      services.forEach((service) => {
        // check if any of the knownNames are in the stream.name using regex
        const found = service.knownNames.some((name) => {
          const regex = new RegExp(`\\[${name}.*?\\]`, 'i');
          return regex.test(stream.name);
        });
        let cached: boolean | undefined = undefined;
        if (found) {
          // check if any of the uncachedSymbols are in the stream.name
          if (uncachedSymbols.some((symbol) => stream.name?.includes(symbol))) {
            cached = false;
          }
          // check if any of the cachedSymbols are in the stream.name
          else if (
            cachedSymbols.some((symbol) => stream.name?.includes(symbol))
          ) {
            cached = true;
          }

          provider = {
            id: service.id,
            cached: cached,
          };
        }
      });
    }

    if (stream.infoHash && provider) {
      // if its a p2p result, it is not from a debrid service
      provider = undefined;
    }
    return this.createParsedResult(
      parsedInfo,
      stream,
      filename,
      size,
      provider,
      seeders ? parseInt(seeders) : undefined,
      undefined,
      indexer
    );
  }
}
