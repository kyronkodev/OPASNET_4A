const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const loadEnv = require('./config/env');
// 환경변수 로드
loadEnv();

const { postgresPool } = require('./config/database');

const app = express();

// View engine 설정
app.set("views", path.join(__dirname, "app/views"));
app.set("view engine", "ejs");

// Security Headers
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use(logger("dev"));
app.use(expressLayouts);
app.set("layout", "layouts/default");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 세션 설정
app.use(session({
    store: new pgSession({
        pool: postgresPool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'opasnet4a_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24시간
        httpOnly: true,
        secure: false
    }
}));

// 전역 변수 설정 (모든 view에서 접근 가능)
const helpers = require('./utils/helpers');
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.currentPath = req.path;
    res.locals.helpers = helpers;
    next();
});

// 정적 파일
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));

// 라우터
const indexRouter = require('./routes/index_route');
const equipmentRouter = require('./routes/equipment_route');
const rentalRouter = require('./routes/rental_route');
const adminRouter = require('./routes/admin_route');

app.use("/", indexRouter);
app.use("/equipment", equipmentRouter);
app.use("/rental", rentalRouter);
app.use("/admin", adminRouter);

// 404 에러 핸들러
app.use(function (req, res, next) {
    next(createError(404));
});

// 에러 핸들러
app.use(function (err, req, res, next) {
    res.locals.message = process.env.APPLICATION_STATUS === "development" ? err.message : "";
    res.locals.error = process.env.APPLICATION_STATUS === "development" ? err : {};

    res.status(err.status || 500);
    const appLogger = require("./config/logger");
    appLogger.writeLog("error", `code ${err.status}: msg ${err.message}`);
    res.render("error", {
        layout: false,
        err: err.message,
        status: err.status || 500
    });
});

global.stage = process.env.APPLICATION_STATUS;

module.exports = app;
