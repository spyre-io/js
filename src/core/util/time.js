export const runFor = async (cb, ms) => new Promise((resolve) => {
    const now = Date.now();
    const frame = () => {
        const totalMs = Date.now() - now;
        cb(Math.min(1, totalMs / ms));
        if (totalMs >= ms) {
            resolve();
            return;
        }
        requestAnimationFrame(frame);
    };
    cb(0);
    requestAnimationFrame(frame);
});
export const waitFor = async (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});
