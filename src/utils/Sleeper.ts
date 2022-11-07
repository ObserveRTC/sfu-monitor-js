export class Sleeper {
    private _executed = 0;
    private _cancelTimer?: () => void;

    public reset(): void {
        this._executed = 0;
    }

    public cancel() {
        if (this._cancelTimer) {
            this._cancelTimer();
        }
    }

    public async sleep(logger?: (timeoutInMs: number) => void): Promise<void> {
        const base = ++this._executed;
        const random = Math.random();
        const exp = 1 + Math.max(0.1, Math.min(random, 1 / base));
        const timeout = Math.floor(Math.min(Math.pow(base, exp), 60) * 1000);
        return new Promise<void>((resolve) => {
            const timer = setTimeout(() => {
                this._cancelTimer = undefined;
                resolve();
            }, timeout);
            this._cancelTimer = () => {
                clearTimeout(timer);
                this._cancelTimer = undefined;
            };
            if (logger) {
                logger(timeout);
            }
        });
    }
}
