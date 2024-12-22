export function extractSizeInBytes(string: string, k: number): number {
    const sizePattern = /(\d+(\.\d+)?)\s?(KB|MB|GB)/;
    const match = string.match(sizePattern);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[3];

    switch (unit) {
        case "GB":
            return value * k * k * k;
        case "MB":
            return value * k * k;
        case "KB":
            return value * k;
        default:
            return 0;
    }
}