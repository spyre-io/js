export const getBackoffMs = (retries) => {
    const min = 500;
    const base = 100;
    const max = 10000;
    const factor = 2;
    const backoff = Math.min(max, base * Math.pow(factor, retries));
    // add jitter
    return min + Math.random() * backoff;
};
export const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
