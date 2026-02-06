const appRoot = require('app-root-path');
const winston = require('winston');
const winstonDaily = require('winston-daily-rotate-file');

const loadEnv = require('../config/env');
// 환경변수 로드
loadEnv();
const { combine, timestamp, printf } = winston.format;

const logFormat = printf(info => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
});

var logger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
    ),
    transports: [
        new (winston.transports.DailyRotateFile)({
            level: 'info',
            filename: `${appRoot}/logs/info-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxFiles: 30,
            zippedArchive: true,
        }),
        new (winston.transports.DailyRotateFile)({
            level: 'error',
            filename: `${appRoot}/logs/error-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxFiles: 30,
            zippedArchive: true,
        })
    ]
});

logger.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
};

logger.writeLog = function (logType, logMessage) {
    console.log(`[${logType}] ${logMessage}`);
    if (process.env.APPLICATION_STATUS == "production") {
        logger.log(logType, logMessage);
    }
};

module.exports = logger;
