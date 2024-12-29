import {
  Stream,
  ParsedStream,
  StreamRequest,
  ParsedNameData,
} from '@aiostreams/types';
import { extractSizeInBytes, parseFilename } from '@aiostreams/parser';

export class BaseWrapper {
  private readonly streamPath: string = 'stream/{type}/tt{id}.json';
  private indexerTimeout: number;
  protected addonName: string;
  private addonUrl: string;
  constructor(addonName: string, addonUrl: string, indexerTimeout?: number) {
    this.addonName = addonName;
    this.addonUrl = this.standardizeManifestUrl(addonUrl);
    this.indexerTimeout = indexerTimeout || 3000;
  }
  
  private standardizeManifestUrl(url: string): string {
    // remove trailing slash and replace stremio:// with https://
    let manifestUrl = url.replace('stremio://', 'https://').replace(/\/$/, '');
    return manifestUrl.endsWith('/manifest.json') ? manifestUrl : `${manifestUrl}/manifest.json`;
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
    let finalId =
      streamRequest.type === 'series'
        ? `${streamRequest.id}:${streamRequest.season}:${streamRequest.episode}`
        : streamRequest.id;
    return (
      this.addonUrl.replace('manifest.json', '') +
      this.streamPath
        .replace('{type}', streamRequest.type)
        .replace('{id}', finalId)
    );
  }

  protected async getStreams(streamRequest: StreamRequest): Promise<Stream[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.indexerTimeout);

    console.log(
      'Fetching streams from',
      this.getStreamUrl(streamRequest),
      'with timeout',
      this.indexerTimeout,
      'and name',
      this.addonName
    );
    let url = this.getStreamUrl(streamRequest);
    const response = await fetch(url, { signal: controller.signal });

    clearTimeout(timeout);

    if (!response.ok) {
      return Promise.reject(new Error(await response.text()));
    }

    let results: { streams: Stream[] } = await response.json();
    return results.streams;
  }

  protected createParsedResult(
    parsedInfo: ParsedNameData,
    stream: Stream,
    filename?: string,
    size?: number
  ): ParsedStream {
    return {
      ...parsedInfo,
      addonName: this.addonName,
      filename: filename,
      size: size,
      url: stream.url,
      externalUrl: stream.externalUrl,
      torrent: {
        infoHash: stream.infoHash,
        fileIdx: stream.fileIdx,
        sources: stream.sources,
      },
      stream: {
        subtitles: stream.subtitles,
        behaviorHints: {
          countryWhitelist: stream.behaviorHints?.countryWhitelist,
          notWebReady: stream.behaviorHints?.notWebReady,
          proxyHeaders: {
            request: stream.behaviorHints?.proxyHeaders?.request,
            response: stream.behaviorHints?.proxyHeaders?.response,
          },
          videoHash: stream.behaviorHints?.videoHash,
        },
      },
    };
  }

  protected parseStream(stream: Stream): ParsedStream | undefined {
    // attempt to look for filename in behaviorHints.filename, return undefined if not found
    let filename = stream.behaviorHints?.filename || undefined;

    // parse the filename using our parser.

    let parsedInfo: ParsedNameData;
    if (filename) {
      parsedInfo = parseFilename(filename);
    } else {
      console.log('Filename behaviorHint was missing, will attempt to parse stream description', stream.description || stream.title);
      let description = stream.description || stream.title;
      if (description) {
        parsedInfo = parseFilename(description);
      } else {
        console.log('Stream had no filename or description, unable to parse.', stream);
        parsedInfo = {
          quality: 'Unknown',
          languages: ['Unknown'],
          resolution: 'Unknown',
          encode: 'Unknown',
          visualTags: [],
          audioTags: []
        }
      }
    }

    // see if size is present in behaviorHints
    let size: number | undefined;
    if (stream.behaviorHints?.videoSize) {
      size = stream.behaviorHints.videoSize;
    } else if (stream.description || stream.title) {
      size = extractSizeInBytes((stream.description || stream.title) as string, 1024);
    }  

    return this.createParsedResult(parsedInfo, stream, filename, size);
  }
}
