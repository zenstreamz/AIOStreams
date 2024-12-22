import { BaseWrapper } from "./base";
import { ParsedNameData, ParsedStream } from "@aiostreams/types";
import { parseFilename } from "@aiostreams/parser";

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
    private readonly name: string = "Torbox";
    constructor(apiKey: string) {
        super("Torbox", "https://stremio.torbox.app/" + apiKey + "/", 10000);
    }

    protected parseStream(stream: TorboxStream): ParsedStream | undefined {

        if (stream.name.includes("Your Media")) {
            return undefined;
        }
        let type = stream.type;
        const [quality, filename, _, language, ageOrSeeders] = stream.description.split("\n").map(
            (field: string) => {
                if (field.startsWith("Type")) {
                    const [typeField, ageOrSeeders] = field.split("|")
                    if (!["torrent", "usenet"].includes(type)) {
                        type = typeField.split(":")[1].trim().toLowerCase();
                    }
                    const [_, value] = ageOrSeeders.split(":");
                    return value.trim();
                }
                const [_, value] = field.split(":");
                return value.trim();
            }
        )

        const parsedFilename: ParsedNameData = parseFilename(filename);

        if (parsedFilename.quality === "Unknown" && quality !== "Unknown") {
            parsedFilename.quality = quality;
        } 
        if (!parsedFilename.languages.some((lang: string) => lang.toLowerCase() === language.toLowerCase()) && language !== "Unknown") {
            if (!(language === "BENGALI" && RegExp(/(?<![^ [_\-.])(ben[ _\-.]?the[ _\-.]?men)(?=[ \]_.-]|$)/i).test(filename))) {
                parsedFilename.languages.push(language);
            }   
        }
        
        const sizeInBytes = stream.size;

        return {
            ...parsedFilename,
            filename,
            size: sizeInBytes,
            addonName: this.name,
            url: stream.url,
            torrent: type === "torrent" ? {
                seeders: stream.seeders,
            } : undefined,
            usenet: type === "usenet" ? {
                age: parseInt(ageOrSeeders)
            } : undefined,
            provider: {
                name: "TB",
                cached: stream.is_cached
            }
        };
    }
}