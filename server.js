"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const SESSION_COOKIE = "damashqi_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_LOGIN_ATTEMPTS = 6;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map();
const STATIC_FILES = new Set(["index.html", "restaurant.css", "restaurant.js", "style.css", "script.js"]);

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function passwordHash(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString("hex");
}

function initializeDatabase(db, options) {
    db.exec(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS organizations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'owner',
            active INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS branches (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            area TEXT NOT NULL,
            phone TEXT,
            hours TEXT NOT NULL,
            rating REAL,
            reviews INTEGER,
            price TEXT,
            services TEXT NOT NULL,
            note TEXT,
            daily_sales REAL NOT NULL DEFAULT 0,
            daily_orders INTEGER NOT NULL DEFAULT 0,
            change_pct REAL NOT NULL DEFAULT 0,
            occupancy INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            time TEXT NOT NULL,
            priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
            done INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            phone TEXT,
            time TEXT NOT NULL,
            guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 30),
            table_name TEXT,
            status TEXT NOT NULL CHECK (status IN ('confirmed', 'waiting', 'cancelled')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            unit TEXT NOT NULL,
            amount REAL NOT NULL CHECK (amount >= 0),
            minimum REAL NOT NULL CHECK (minimum >= 0),
            icon TEXT NOT NULL DEFAULT '📦'
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_expiration ON sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_org_branch ON tasks(organization_id, branch_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_org_branch ON bookings(organization_id, branch_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory(organization_id);
    `);

    const orgId = "damashqi-demo";
    db.prepare("INSERT OR IGNORE INTO organizations (id, name) VALUES (?, ?)").run(orgId, "الدمشقي");
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(options.adminEmail);
    if (!existingUser) {
        const salt = crypto.randomBytes(16).toString("hex");
        db.prepare(`INSERT INTO users (id, organization_id, name, email, password_salt, password_hash, role)
            VALUES (?, ?, ?, ?, ?, ?, 'owner')`).run(
            crypto.randomUUID(), orgId, "مصطفي محمد", options.adminEmail, salt, passwordHash(options.adminPassword, salt)
        );
    }

    const branchCount = db.prepare("SELECT COUNT(*) AS count FROM branches WHERE organization_id = ?").get(orgId).count;
    if (branchCount === 0) {
        const seedBranches = [
            ["rahbat", "الدمشقى للمأكولات السورية", "شارع الراهبات، سكنيدة، قسم دمنهور، البحيرة", "+20 45 3233808", "مفتوح 24 ساعة", 3.6, 105, "اقتصادي", "جلسات داخلية وخارجية · سفري · توصيل (نقداً)", null, 48200, 186, 12.4, 78],
            ["kertasa", "مطعم الدمشقي · قرطسا", "قرطسا، قسم دمنهور، البحيرة", null, "غير متوفر", 4.1, 36, "اقتصادي", "جلسات مريحة · مناسب للمجموعات", "تشير المعلومات المقدمة إلى طزاجة الطعام ونظافة المكان.", 39600, 149, 8.2, 64],
            ["shubra", "البيت الدمشقي", "شارع عبد السلام الشاذلي، شبرا، قسم دمنهور، البحيرة", "+20 10 06114912", "مفتوح 24 ساعة", null, null, null, "صالة عائلية · مناسب للأطفال · سفري · توصيل", null, 32500, 127, -2.1, 51]
        ];
        const insertBranch = db.prepare(`INSERT INTO branches
            (id, organization_id, name, area, phone, hours, rating, reviews, price, services, note, daily_sales, daily_orders, change_pct, occupancy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        db.exec("BEGIN");
        try {
            for (const branch of seedBranches) insertBranch.run(branch[0], orgId, ...branch.slice(1));
            const insertTask = db.prepare(`INSERT INTO tasks (id, organization_id, branch_id, title, time, priority, done)
                VALUES (?, ?, ?, ?, ?, ?, ?)`);
            [
                ["t1", "rahbat", "استلام توريد الخضار الطازجة", "09:30", "high", 0],
                ["t2", "kertasa", "مراجعة حرارة براد اللحوم", "10:00", "high", 0],
                ["t3", "shubra", "تجهيز صلصة الثوم لفترة الغداء", "10:30", "medium", 1],
                ["t4", "shubra", "تأكيد جدول مناوبة المساء", "11:00", "low", 0],
                ["t5", "rahbat", "فحص جهاز نقاط البيع", "11:15", "medium", 0]
            ].forEach(task => insertTask.run(task[0], orgId, ...task.slice(1)));
            const insertBooking = db.prepare(`INSERT INTO bookings
                (id, organization_id, branch_id, name, phone, time, guests, table_name, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            [
                ["b1", "rahbat", "عائلة العطار", "01•• ••• 284", "13:00", 5, "طاولة 12", "confirmed"],
                ["b2", "kertasa", "نور حداد", "01•• ••• 671", "13:30", 2, "طاولة 04", "confirmed"],
                ["b3", "shubra", "مجموعة السالم", "01•• ••• 395", "14:00", 8, "طاولة 08", "waiting"],
                ["b4", "rahbat", "كريم شرف", "01•• ••• 147", "14:30", 4, "طاولة 06", "confirmed"],
                ["b5", "shubra", "هبة منصور", "01•• ••• 812", "15:00", 3, "طاولة 02", "waiting"]
            ].forEach(booking => insertBooking.run(booking[0], orgId, ...booking.slice(1)));
            const insertItem = db.prepare(`INSERT INTO inventory (id, organization_id, name, category, unit, amount, minimum, icon)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            [
                ["s1", "لحم غنم بلدي", "لحوم", "كغ", 8, 12, "🥩"],
                ["s2", "لبن زبادي", "ألبان", "كغ", 24, 15, "🥛"],
                ["s3", "خبز عربي", "مخبوزات", "ربطة", 9, 20, "🥖"],
                ["s4", "بقدونس طازج", "خضار", "ربطة", 6, 10, "🌿"],
                ["s5", "طحينة", "مواد أساسية", "كغ", 14, 8, "🫙"],
                ["s6", "دبس رمان", "مواد أساسية", "لتر", 11, 5, "🍯"],
                ["s7", "دجاج طازج", "لحوم", "كغ", 19, 12, "🍗"]
            ].forEach(item => insertItem.run(item[0], orgId, ...item.slice(1)));
            db.exec("COMMIT");
        } catch (error) {
            db.exec("ROLLBACK");
            throw error;
        }
    }
}

function jsonResponse(res, status, value, headers = {}) {
    const body = JSON.stringify(value);
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "same-origin",
        ...headers
    });
    res.end(body);
}

function cookieValue(req, name) {
    const cookies = (req.headers.cookie || "").split(";");
    for (const cookie of cookies) {
        const separator = cookie.indexOf("=");
        if (separator < 0) continue;
        if (cookie.slice(0, separator).trim() === name) return cookie.slice(separator + 1).trim();
    }
    return "";
}

function setSessionCookie(res, token, secure) {
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION / 1000}${secure ? "; Secure" : ""}`);
}

function clearSessionCookie(res, secure) {
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? "; Secure" : ""}`);
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        const contentType = (req.headers["content-type"] || "").split(";")[0].trim();
        if (contentType !== "application/json") {
            reject(new HttpError(415, "يجب إرسال البيانات بصيغة JSON."));
            return;
        }
        let size = 0;
        let tooLarge = false;
        const chunks = [];
        req.on("data", chunk => {
            if (tooLarge) return;
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
                tooLarge = true;
                chunks.length = 0;
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => {
            if (tooLarge) {
                reject(new HttpError(413, "حجم الطلب أكبر من المسموح."));
                return;
            }
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
            } catch {
                reject(new HttpError(400, "صيغة البيانات غير صحيحة."));
            }
        });
        req.on("error", reject);
    });
}

function requiredText(value, field, max = 160) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
        throw new HttpError(400, `تحقق من حقل ${field}.`);
    }
    return value.trim();
}

function requiredPassword(value) {
    if (typeof value !== "string" || !value.trim() || value.length > 256) {
        throw new HttpError(400, "تحقق من كلمة المرور.");
    }
    return value;
}

function safeNumber(value, field, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
        throw new HttpError(400, `قيمة ${field} غير صحيحة.`);
    }
    return number;
}

function branchExists(db, organizationId, branchId) {
    return Boolean(db.prepare("SELECT 1 FROM branches WHERE id = ? AND organization_id = ?").get(branchId, organizationId));
}

function mapBranch(row) {
    return {
        ...row,
        sales: Number(row.sales),
        orders: Number(row.orders),
        change: Number(row.change),
        occupancy: Number(row.occupancy)
    };
}

function getBranches(db, organizationId, branchId) {
    const query = `SELECT id, name, area, phone, hours, rating, reviews, price, services, note,
        daily_sales AS sales, daily_orders AS orders, change_pct AS change, occupancy FROM branches
        WHERE organization_id = ?${branchId && branchId !== "all" ? " AND id = ?" : ""} ORDER BY name`;
    const rows = branchId && branchId !== "all" ?
        db.prepare(query).all(organizationId, branchId) :
        db.prepare(query).all(organizationId);
    return rows.map(mapBranch);
}

function getTasks(db, organizationId, branchId) {
    const query = `SELECT id, branch_id AS branch, title, time, priority, done FROM tasks
        WHERE organization_id = ?${branchId && branchId !== "all" ? " AND branch_id = ?" : ""} ORDER BY created_at DESC, time`;
    const rows = branchId && branchId !== "all" ?
        db.prepare(query).all(organizationId, branchId) :
        db.prepare(query).all(organizationId);
    return rows.map(row => ({ ...row, done: Boolean(row.done) }));
}

function getBookings(db, organizationId, branchId) {
    const query = `SELECT id, branch_id AS branch, name, phone, time, guests, table_name AS "table", status
        FROM bookings WHERE organization_id = ?${branchId && branchId !== "all" ? " AND branch_id = ?" : ""}
        ORDER BY time, created_at DESC`;
    return branchId && branchId !== "all" ?
        db.prepare(query).all(organizationId, branchId) :
        db.prepare(query).all(organizationId);
}

function getInventory(db, organizationId) {
    return db.prepare(`SELECT id, name, category, unit, amount, minimum, icon FROM inventory
        WHERE organization_id = ? ORDER BY name`).all(organizationId);
}

function getDashboard(db, organizationId, branchId, period) {
    if (!["week", "month"].includes(period)) throw new HttpError(400, "الفترة المطلوبة غير مدعومة.");
    if (branchId !== "all" && !branchExists(db, organizationId, branchId)) throw new HttpError(404, "الفرع غير موجود.");
    const selected = getBranches(db, organizationId, branchId);
    const days = period === "week" ? 7 : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const sales = Math.round(selected.reduce((sum, branch) => sum + branch.sales, 0) * days);
    const orders = Math.round(selected.reduce((sum, branch) => sum + branch.orders, 0) * days);
    const previousSales = Math.round(selected.reduce((sum, branch) => sum + branch.sales * days / (1 + branch.change / 100), 0));
    const previousOrders = Math.round(selected.reduce((sum, branch) => sum + branch.orders * days / (1 + branch.change / 100), 0));
    const labels = period === "week" ? ["س", "ح", "ن", "ث", "ر", "خ", "ج"] : ["١–٧", "٨–١٤", "١٥–٢١", `٢٢–${currencyDigits(days)}`];
    const currentFactors = period === "week" ? [0.82, 0.91, 0.94, 1.02, 1.08, 1.18, 1.05] : [6.8, 7.1, 7.3, 8.8];
    const previousFactors = period === "week" ? [0.88, 0.94, 0.90, 1.03, 1.12, 1.05, 1.08] : [6.4, 6.7, 7.0, 7.9];
    const currentSeries = currentFactors.map(factor => Math.round(selected.reduce((sum, branch) => sum + branch.sales * factor, 0)));
    const previousSeries = previousFactors.map(factor => Math.round(selected.reduce((sum, branch) => sum + branch.sales * factor / (1 + branch.change / 100), 0)));
    return {
        label: period === "week" ? "آخر ٧ أيام" : "هذا الشهر",
        sales,
        orders,
        average: orders ? Math.round(sales / orders) : 0,
        salesChange: previousSales ? (sales - previousSales) / previousSales * 100 : 0,
        ordersChange: previousOrders ? (orders - previousOrders) / previousOrders * 100 : 0,
        currentSeries,
        previousSeries,
        labels
    };
}

function currencyDigits(value) {
    return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value);
}

function createApplication(options = {}) {
    const staticRoot = path.resolve(options.staticRoot || __dirname);
    const dbPath = path.resolve(options.dbPath || path.join(__dirname, ".data", "damashqi.sqlite"));
    const adminEmail = options.adminEmail || process.env.ADMIN_EMAIL || "demo@aldamashqi.local";
    const adminPassword = options.adminPassword || process.env.ADMIN_PASSWORD || "damashqi-demo";
    const secureCookie = options.secureCookie ?? process.env.NODE_ENV === "production";

    if (process.env.NODE_ENV === "production") {
        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
            throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running in production.");
        }
        if (adminEmail === "demo@aldamashqi.local") {
            throw new Error("Set ADMIN_EMAIL to a real administrator address before running in production.");
        }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) throw new Error("ADMIN_EMAIL must be a valid email address.");
    if (process.env.NODE_ENV === "production" && (adminPassword.trim().length < 12 || adminPassword.length > 256)) {
        throw new Error("ADMIN_PASSWORD must contain at least 12 non-whitespace characters in production.");
    }

    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new DatabaseSync(dbPath);
    initializeDatabase(db, { adminEmail, adminPassword });
    if (process.env.NODE_ENV === "production") {
        db.prepare("UPDATE users SET active = 0 WHERE email = ?").run("demo@aldamashqi.local");
    }
    const demoMode = process.env.NODE_ENV !== "production" && !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD;

    function currentUser(req) {
        const token = cookieValue(req, SESSION_COOKIE);
        if (!/^[a-f0-9]{64}$/.test(token)) return null;
        const tokenHash = hashToken(token);
        const row = db.prepare(`SELECT users.id, users.organization_id, users.name, users.email, users.role, sessions.expires_at
            FROM sessions JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND users.active = 1`).get(tokenHash);
        if (!row) return null;
        if (row.expires_at <= Date.now()) {
            db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
            return null;
        }
        return { id: row.id, organizationId: row.organization_id, name: row.name, email: row.email, role: row.role };
    }

    async function handleApi(req, res, url) {
        if (req.method === "GET" && url.pathname === "/api/session") {
            const user = currentUser(req);
            return jsonResponse(res, 200, { authenticated: Boolean(user), user: user ? { name: user.name, email: user.email, role: user.role } : null, demoMode });
        }

        if (req.method === "POST" && url.pathname === "/api/login") {
            const ip = req.socket.remoteAddress || "unknown";
            let attempts = loginAttempts.get(ip);
            if (!attempts || attempts.resetAt <= Date.now()) attempts = { count: 0, resetAt: Date.now() + LOGIN_WINDOW_MS };
            if (attempts.count >= MAX_LOGIN_ATTEMPTS) throw new HttpError(429, "محاولات كثيرة. حاول مرة أخرى بعد قليل.");
            const body = await readJson(req);
            const email = requiredText(body.email, "البريد الإلكتروني", 254).toLowerCase();
            const password = requiredPassword(body.password);
            const user = db.prepare("SELECT id, organization_id, name, email, password_salt, password_hash, role FROM users WHERE email = ? AND active = 1").get(email);
            const candidateHash = passwordHash(password, user?.password_salt || "invalid-user-salt");
            const valid = user && crypto.timingSafeEqual(Buffer.from(user.password_hash, "hex"), Buffer.from(candidateHash, "hex"));
            if (!valid) {
                attempts.count++;
                loginAttempts.set(ip, attempts);
                throw new HttpError(401, "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
            }
            loginAttempts.delete(ip);
            const token = crypto.randomBytes(32).toString("hex");
            db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(hashToken(token), user.id, Date.now() + SESSION_DURATION);
            setSessionCookie(res, token, secureCookie);
            return jsonResponse(res, 200, { authenticated: true, user: { name: user.name, email: user.email, role: user.role }, demoMode });
        }

        if (req.method === "POST" && url.pathname === "/api/logout") {
            const token = cookieValue(req, SESSION_COOKIE);
            if (/^[a-f0-9]{64}$/.test(token)) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
            clearSessionCookie(res, secureCookie);
            return jsonResponse(res, 200, { authenticated: false });
        }

        const user = currentUser(req);
        if (!user) throw new HttpError(401, "انتهت الجلسة. سجّل الدخول مرة أخرى.");
        const organizationId = user.organizationId;

        if (req.method === "GET" && url.pathname === "/api/bootstrap") {
            return jsonResponse(res, 200, {
                user: { name: user.name, email: user.email, role: user.role },
                branches: getBranches(db, organizationId),
                tasks: getTasks(db, organizationId),
                bookings: getBookings(db, organizationId),
                stock: getInventory(db, organizationId)
            });
        }

        if (req.method === "GET" && url.pathname === "/api/dashboard") {
            return jsonResponse(res, 200, getDashboard(db, organizationId, url.searchParams.get("branchId") || "all", url.searchParams.get("period") || "week"));
        }

        if (req.method === "GET" && url.pathname === "/api/branches") {
            return jsonResponse(res, 200, { branches: getBranches(db, organizationId) });
        }

        if (req.method === "GET" && url.pathname === "/api/tasks") {
            return jsonResponse(res, 200, { tasks: getTasks(db, organizationId, url.searchParams.get("branchId")) });
        }

        if (req.method === "POST" && url.pathname === "/api/tasks") {
            const body = await readJson(req);
            const title = requiredText(body.title, "عنوان المهمة", 200);
            const branchId = requiredText(body.branchId, "الفرع", 80);
            const time = requiredText(body.time, "الوقت", 5);
            const priority = body.priority || "medium";
            if (!branchExists(db, organizationId, branchId)) throw new HttpError(400, "الفرع المحدد غير صحيح.");
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new HttpError(400, "صيغة الوقت غير صحيحة.");
            if (!["high", "medium", "low"].includes(priority)) throw new HttpError(400, "الأولوية غير صحيحة.");
            const id = crypto.randomUUID();
            db.prepare("INSERT INTO tasks (id, organization_id, branch_id, title, time, priority) VALUES (?, ?, ?, ?, ?, ?)")
                .run(id, organizationId, branchId, title, time, priority);
            return jsonResponse(res, 201, { id });
        }

        const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
        if (req.method === "PATCH" && taskMatch) {
            const body = await readJson(req);
            if (typeof body.done !== "boolean") throw new HttpError(400, "حالة المهمة غير صحيحة.");
            const result = db.prepare("UPDATE tasks SET done = ? WHERE id = ? AND organization_id = ?")
                .run(body.done ? 1 : 0, taskMatch[1], organizationId);
            if (!result.changes) throw new HttpError(404, "المهمة غير موجودة.");
            return jsonResponse(res, 200, { updated: true });
        }

        if (req.method === "GET" && url.pathname === "/api/bookings") {
            return jsonResponse(res, 200, { bookings: getBookings(db, organizationId, url.searchParams.get("branchId")) });
        }

        if (req.method === "POST" && url.pathname === "/api/bookings") {
            const body = await readJson(req);
            const name = requiredText(body.name, "اسم الضيف", 120);
            const branchId = requiredText(body.branchId, "الفرع", 80);
            const time = requiredText(body.time, "الوقت", 5);
            const guests = safeNumber(body.guests, "عدد الضيوف", 1, 30);
            const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
            const table = typeof body.table === "string" ? body.table.trim().slice(0, 80) : "";
            if (!branchExists(db, organizationId, branchId)) throw new HttpError(400, "الفرع المحدد غير صحيح.");
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new HttpError(400, "صيغة الوقت غير صحيحة.");
            const id = crypto.randomUUID();
            db.prepare(`INSERT INTO bookings (id, organization_id, branch_id, name, phone, time, guests, table_name, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`).run(id, organizationId, branchId, name, phone, time, guests, table);
            return jsonResponse(res, 201, { id });
        }

        const bookingMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)$/);
        if (req.method === "PATCH" && bookingMatch) {
            const body = await readJson(req);
            if (!["confirmed", "waiting", "cancelled"].includes(body.status)) throw new HttpError(400, "حالة الحجز غير صحيحة.");
            const result = db.prepare("UPDATE bookings SET status = ? WHERE id = ? AND organization_id = ?")
                .run(body.status, bookingMatch[1], organizationId);
            if (!result.changes) throw new HttpError(404, "الحجز غير موجود.");
            return jsonResponse(res, 200, { updated: true });
        }

        if (req.method === "GET" && url.pathname === "/api/inventory") {
            return jsonResponse(res, 200, { stock: getInventory(db, organizationId) });
        }

        if (req.method === "POST" && url.pathname === "/api/inventory") {
            const body = await readJson(req);
            const name = requiredText(body.name, "اسم الصنف", 120);
            const category = requiredText(body.category, "الفئة", 80);
            const unit = requiredText(body.unit, "وحدة القياس", 30);
            const amount = safeNumber(body.amount, "الكمية", 0, 1000000);
            const minimum = safeNumber(body.minimum, "الحد الأدنى", 0, 1000000);
            const icon = typeof body.icon === "string" ? body.icon.slice(0, 8) : "📦";
            const id = crypto.randomUUID();
            db.prepare(`INSERT INTO inventory (id, organization_id, name, category, unit, amount, minimum, icon)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, organizationId, name, category, unit, amount, minimum, icon);
            return jsonResponse(res, 201, { id });
        }

        const inventoryMatch = url.pathname.match(/^\/api\/inventory\/([^/]+)\/restock$/);
        if (req.method === "POST" && inventoryMatch) {
            const body = await readJson(req);
            const item = db.prepare("SELECT amount, minimum FROM inventory WHERE id = ? AND organization_id = ?")
                .get(inventoryMatch[1], organizationId);
            if (!item) throw new HttpError(404, "الصنف غير موجود.");
            const quantity = body.quantity === undefined ? Math.max(item.minimum, 10) : safeNumber(body.quantity, "كمية التوريد", 0.01, 1000000);
            db.prepare("UPDATE inventory SET amount = amount + ? WHERE id = ? AND organization_id = ?")
                .run(quantity, inventoryMatch[1], organizationId);
            return jsonResponse(res, 200, { updated: true });
        }

        throw new HttpError(404, "المسار المطلوب غير موجود.");
    }

    function serveStatic(req, res, pathname) {
        let relativePath;
        try {
            relativePath = decodeURIComponent(pathname === "/" ? "index.html" : pathname.slice(1));
        } catch {
            throw new HttpError(400, "المسار غير صحيح.");
        }
        if (relativePath.includes("..") || relativePath.includes("\\") || relativePath.includes("\0")) {
            throw new HttpError(400, "المسار غير مسموح.");
        }
        const isImage = relativePath.startsWith("images/") && /\.(png|jpe?g|webp|svg)$/i.test(relativePath);
        if (!STATIC_FILES.has(relativePath) && !isImage) throw new HttpError(404, "الملف غير موجود.");
        const filePath = path.resolve(staticRoot, relativePath);
        if (!filePath.startsWith(`${staticRoot}${path.sep}`)) throw new HttpError(400, "المسار غير مسموح.");
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new HttpError(404, "الملف غير موجود.");
        const contentTypes = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".svg": "image/svg+xml"
        };
        res.writeHead(200, {
            "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "same-origin"
        });
        if (req.method === "HEAD") {
            res.end();
            return;
        }
        fs.createReadStream(filePath).pipe(res);
    }

    const server = http.createServer((req, res) => {
        Promise.resolve().then(() => {
            const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
            if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
            if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res, url.pathname);
            throw new HttpError(405, "الطريقة غير مدعومة.");
        }).catch(error => {
            if (res.headersSent) {
                res.destroy(error);
                return;
            }
            if (!(error instanceof HttpError) || error.status >= 500) console.error(error);
            const status = error instanceof HttpError ? error.status : 500;
            const message = status >= 500 ? "حدث خطأ داخلي. راجع سجل الخادم." : error.message;
            jsonResponse(res, status, { error: message });
        });
    });

    return {
        server,
        db,
        close() {
            return new Promise((resolve, reject) => {
                server.close(error => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    db.close();
                    resolve();
                });
            });
        }
    };
}

if (require.main === module) {
    const application = createApplication();
    const port = Number(process.env.PORT || 5500);
    const host = process.env.HOST || "127.0.0.1";
    application.server.listen(port, host, () => {
        console.log(`الدمشقي يعمل على http://${host}:${port}`);
        if (process.env.NODE_ENV !== "production") {
            console.log("حساب التطوير: demo@aldamashqi.local / damashqi-demo");
        }
    });
    const shutdown = () => application.close().then(() => process.exit(0), error => {
        console.error(error);
        process.exit(1);
    });
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

module.exports = { createApplication };
