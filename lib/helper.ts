export function ggID() {
    let id = 0;
    return function genId(): number {
        return id++;
    };
}

export function timeout(ms: number = 100): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

export const noop = () => { };

export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
