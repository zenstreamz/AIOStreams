import { ParsedNameData } from "@aiostreams/types";
import { parseFilename, extractSizeInBytes } from "@aiostreams/parser";
import { ParsedStream, Stream } from "@aiostreams/types";
import { BaseWrapper } from "./base";

export class Torrentio extends BaseWrapper {
    private readonly name: string = "Torrentio";

    constructor(apiKeys: Record<string, string>) {
        // create a string of name=apikey pairs separated by |
        super("Torrentio", "https://torrentio.strem.fun/" + Object.entries(apiKeys).map(([name, apiKey]) => `${name.toLowerCase()}=${apiKey}`).join("|") + "/");
        
    }

    protected parseStream(stream: Stream): ParsedStream {
        const filename = stream?.behaviorHints?.filename ? stream.behaviorHints.filename.trim() : stream.title!.split("\n")[0];
        const parsedFilename: ParsedNameData = parseFilename(filename);
        const sizeInBytes = stream.title ? extractSizeInBytes(stream.title, 1024) : 0;
        const debridMatch = RegExp(/^\[([a-zA-Z]{2})(\+| download)\]/).exec(stream.name!);
        const debrid = debridMatch ? {
            provider: debridMatch[1],
            cached: debridMatch[2] === "+"
        } : undefined;
        const seedersMatch = RegExp(/👤 (\d+)/).exec(stream.title!)
        const seeders = seedersMatch ? parseInt(seedersMatch[1]) : undefined;

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
                sources: stream.sources
            },
            provider: debrid ? {
                name: debrid.provider,
                cached: debrid.cached
            } : undefined
        };
    }
}