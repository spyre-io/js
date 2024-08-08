const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour12: false,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    fractionalSecondDigits: 3,
});
const format = (category, message, ...replacements) => {
    const meta = {};
    const uniqueTokens = [];
    let results;
    while ((results = _tokenSub.exec(message)) !== null) {
        const tokenName = results[1];
        const index = uniqueTokens.indexOf(tokenName);
        if (index === -1) {
            uniqueTokens.push(tokenName);
            meta[tokenName] = replacements[uniqueTokens.length - 1].toString();
        }
    }
    // replace
    for (const [key, value] of Object.entries(meta)) {
        message = message.replaceAll(`@${key}`, value);
    }
    if (category) {
        message = `[${category}] ${message}`;
    }
    // timestamp
    const now = new Date();
    const timestamp = dtf.format(now);
    meta["timestamp"] = timestamp;
    return { formattedMessage: message, meta };
};
const _tokenSub = /@([a-zA-Z0-9_]+)/g;
const _logHistory = [];
const _logHistoryMax = 100;
const addToHistory = (level, message, meta) => {
    _logHistory.push({ level, message, meta });
    while (_logHistory.length > _logHistoryMax) {
        _logHistory.shift();
    }
};
const createLogger = (category) => {
    const instance = {
        consoleLevel: 4,
        debug: (message, ...replacements) => {
            const { formattedMessage, meta } = format(category || "", message, ...replacements);
            if (instance.consoleLevel >= 4) {
                console.debug(`[${meta["timestamp"]}] ${formattedMessage}`, meta);
            }
            addToHistory("debug", formattedMessage, meta);
        },
        info: (message, ...replacements) => {
            const { formattedMessage, meta } = format(category || "", message, ...replacements);
            if (instance.consoleLevel >= 3) {
                console.info(`[${meta["timestamp"]}] ${formattedMessage}`, meta);
            }
            addToHistory("info", formattedMessage, meta);
        },
        warn: (message, ...replacements) => {
            const { formattedMessage, meta } = format(category || "", message, ...replacements);
            if (instance.consoleLevel >= 2) {
                console.warn(`[${meta["timestamp"]}] ${formattedMessage}`, meta);
            }
            addToHistory("warn", formattedMessage, meta);
        },
        error: (message, ...replacements) => {
            const { formattedMessage, meta } = format(category || "", message, ...replacements);
            if (instance.consoleLevel >= 1) {
                console.error(`[${meta["timestamp"]}] ${formattedMessage}`, meta);
            }
            addToHistory("error", formattedMessage, meta);
        },
    };
    return instance;
};
export class ConsoleLogTarget {
    debug = console.debug;
    info = console.info;
    warn = console.warn;
    error = console.error;
}
export const getHistory = () => _logHistory;
export const logger = createLogger();
export const childLogger = (name) => {
    const child = createLogger(name);
    child.consoleLevel = logger.consoleLevel;
    return child;
};
