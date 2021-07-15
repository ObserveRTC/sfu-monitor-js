
export class MediasoupVersion {

    public static parse(version: any): MediasoupVersion {
        if (!version) {
            throw new Error("Version cannot be null");
        }
        if (typeof version !== 'string') {
            throw new Error("Version must have type of string");
        }
        const arr = version.split('.');
        const major = parseInt(arr[0], 10) || 0;
        const minor = parseInt(arr[1], 10) || 0;
        const patch = parseInt(arr[2], 10) || 0;
        return new MediasoupVersion( major, minor, patch );
    }

    public static compare(a: MediasoupVersion, b: MediasoupVersion): number {
        if (a.major !== b.major) {
            return a.major < b.major ? -1 : 1;
        }
        if (a.minor !== b.minor) {
            return a.minor < b.minor ? -1 : 1;
        }
        if (a.patch !== b.patch) {
            return a.patch < b.patch ? -1 : 1;
        }
        return 0;
    }

    public readonly major: number;
    public readonly minor: number;
    public readonly patch: number;

    private constructor(major: number, minor: number, patch: number) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    compareTo(other: MediasoupVersion): number {
        return MediasoupVersion.compare(this, other);
    }

    toString() {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
}
