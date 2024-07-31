export const runFor = async (cb: (t: number) => void, ms: number) =>
  new Promise<void>((resolve) => {
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

export const waitFor = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
