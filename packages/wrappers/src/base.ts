import {
  Stream,
  ParsedStream,
  StreamRequest,
  ParsedNameData,
} from '@aiostreams/types';
import { parseFilename } from '@aiostreams/parser';
/*

1. wrapper gets the streams from the addon using the StreamRequest object which contains the type, id, season, and episode
    This returns a dictionary with a streams key that contains an array of Stream objects

2. wrapper parses each stream, and returns an object that contains all the necessary information
*/
export class BaseWrapper {
  private readonly streamPath: string = 'stream/{type}/tt{id}.json';
  private indexerTimeout: number;
  private addonName: string;
  private addonUrl: string;
  constructor(addonName: string, addonUrl: string, indexerTimeout?: number) {
    this.addonName = addonName;
    this.addonUrl = addonUrl;
    this.indexerTimeout = indexerTimeout || 3000;
  }

  public async getParsedStreams(
    streamRequest: StreamRequest
  ): Promise<ParsedStream[]> {
    const streams: Stream[] = await this.getStreams(streamRequest);
    console.log('Streams:', streams);
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
      this.addonUrl +
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
      this.indexerTimeout
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
    filename: string,
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

    if (!filename) {
      return undefined;
    }
    // parse the filename using our parser.
    let parsedInfo: ParsedNameData = parseFilename(filename);

    // see if size is present in behaviorHints
    let size: number | undefined;
    let formattedSize: string | undefined;
    if (stream.behaviorHints?.videoSize) {
      size = stream.behaviorHints.videoSize;
    }

    return this.createParsedResult(parsedInfo, stream, filename, size);
  }
}
