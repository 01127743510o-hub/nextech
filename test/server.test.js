"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");
const { createApplication } = require("../server");

const tempDirectories = [];

after(() => {
    for (const directory of tempDirectories) fs.rmSync(directory, { recursive: true, force: true });
});

async function startApplication() {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "damashqi-test-"));
    tempDirectories.push(directory);
    const application = createApplication({ dbPath: path.join(directory, "app.sqlite") });
    await new Promise((resolve, reject) => {
        application.server.once("error", reject);
        application.server.listen(0, "127.0.0.1", resolve);
    });
    const address = application.server.address();
    let closed = false;
    return {
        application,
        baseUrl: `http://127.0.0.1:${address.port}`,
        directory,
        close: () => {
            if (closed) return Promise.resolve();
            closed = true;
            return application.close();
        }
    };
}

async function request(baseUrl, route, options = {}, cookie) {
    const headers = { ...(options.headers || {}) };
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(`${baseUrl}${route}`, { ...options, headers });
    const body = await response.json().catch(() => null);
    return { response, body, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

async function login(baseUrl) {
    const { response, body, cookie } = await request(baseUrl, "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@aldamashqi.local", password: "damashqi-demo" })
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie"), /HttpOnly/);
    return { body, cookie };
}

test("requires a session and authenticates the seeded development account", async t => {
    const app = await startApplication();
    t.after(() => app.close());

    const unauthorized = await request(app.baseUrl, "/api/bootstrap");
    assert.equal(unauthorized.response.status, 401);

    const session = await login(app.baseUrl);
    assert.equal(session.body.authenticated, true);
    assert.equal(session.body.demoMode, true);

    const bootstrap = await request(app.baseUrl, "/api/bootstrap", {}, session.cookie);
    assert.equal(bootstrap.response.status, 200);
    assert.equal(bootstrap.body.branches.length, 3);
    assert.equal(bootstrap.body.tasks.length, 5);
    assert.equal(bootstrap.body.bookings.length, 5);
    assert.equal(bootstrap.body.stock.length, 7);
});

test("persists task, booking, and inventory changes in SQLite", async t => {
    let app = await startApplication();
    const { cookie } = await login(app.baseUrl);

    const task = await request(app.baseUrl, "/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "مراجعة المخزن", branchId: "rahbat", time: "16:30", priority: "high" })
    }, cookie);
    assert.equal(task.response.status, 201);

    const taskUpdate = await request(app.baseUrl, `/api/tasks/${task.body.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: true })
    }, cookie);
    assert.equal(taskUpdate.response.status, 200);

    const booking = await request(app.baseUrl, "/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "ضيف تجريبي", branchId: "kertasa", time: "18:45", guests: 3 })
    }, cookie);
    assert.equal(booking.response.status, 201);
    const bookingUpdate = await request(app.baseUrl, `/api/bookings/${booking.body.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" })
    }, cookie);
    assert.equal(bookingUpdate.response.status, 200);

    const item = await request(app.baseUrl, "/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "نعناع", category: "خضار", unit: "ربطة", amount: 0, minimum: 4 })
    }, cookie);
    assert.equal(item.response.status, 201);
    const restock = await request(app.baseUrl, `/api/inventory/${item.body.id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
    }, cookie);
    assert.equal(restock.response.status, 200);

    await app.close();
    app = await startApplicationWithDatabase(app.directory);
    t.after(() => app.close());
    const { cookie: restoredCookie } = await login(app.baseUrl);
    const bootstrap = await request(app.baseUrl, "/api/bootstrap", {}, restoredCookie);
    assert.equal(bootstrap.body.tasks.find(entry => entry.id === task.body.id).done, true);
    assert.equal(bootstrap.body.bookings.find(entry => entry.id === booking.body.id).status, "cancelled");
    assert.equal(bootstrap.body.stock.find(entry => entry.id === item.body.id).amount, 10);
});

async function startApplicationWithDatabase(directory) {
    const application = createApplication({ dbPath: path.join(directory, "app.sqlite") });
    await new Promise((resolve, reject) => {
        application.server.once("error", reject);
        application.server.listen(0, "127.0.0.1", resolve);
    });
    const address = application.server.address();
    let closed = false;
    return {
        application,
        baseUrl: `http://127.0.0.1:${address.port}`,
        directory,
        close: () => {
            if (closed) return Promise.resolve();
            closed = true;
            return application.close();
        }
    };
}

test("validates API input and serves the RTL application", async t => {
    const app = await startApplication();
    t.after(() => app.close());

    const page = await fetch(app.baseUrl);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /restaurant-root/);
    const head = await fetch(app.baseUrl, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");

    const { cookie } = await login(app.baseUrl);
    const invalidTask = await request(app.baseUrl, "/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "مهمة", branchId: "unknown", time: "25:00" })
    }, cookie);
    assert.equal(invalidTask.response.status, 400);

    const invalidDashboard = await request(app.baseUrl, "/api/dashboard?branchId=unknown", {}, cookie);
    assert.equal(invalidDashboard.response.status, 404);

    const oversized = await request(app.baseUrl, "/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "x".repeat(65 * 1024) })
    }, cookie);
    assert.equal(oversized.response.status, 413);
});

test("requires explicit production credentials and disables the development login", async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "damashqi-production-test-"));
    tempDirectories.push(directory);
    const dbPath = path.join(directory, "app.sqlite");
    const previousEnvironment = {
        nodeEnv: process.env.NODE_ENV,
        adminEmail: process.env.ADMIN_EMAIL,
        adminPassword: process.env.ADMIN_PASSWORD
    };
    let productionApp;

    try {
        process.env.NODE_ENV = "development";
        delete process.env.ADMIN_EMAIL;
        delete process.env.ADMIN_PASSWORD;
        const developmentApp = createApplication({ dbPath });
        developmentApp.db.close();

        process.env.NODE_ENV = "production";
        assert.throws(() => createApplication({ dbPath }), /ADMIN_EMAIL and ADMIN_PASSWORD/);
        process.env.ADMIN_EMAIL = "manager@example.test";
        process.env.ADMIN_PASSWORD = "a-strong-password-123";
        productionApp = await startApplicationWithDatabase(directory);

        const disabledDemo = await request(productionApp.baseUrl, "/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "demo@aldamashqi.local", password: "damashqi-demo" })
        });
        assert.equal(disabledDemo.response.status, 401);

        const configuredAdmin = await request(productionApp.baseUrl, "/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "manager@example.test", password: "a-strong-password-123" })
        });
        assert.equal(configuredAdmin.response.status, 200);
        assert.match(configuredAdmin.response.headers.get("set-cookie"), /; Secure/);
        assert.equal(configuredAdmin.body.demoMode, false);
    } finally {
        if (productionApp) await productionApp.close();
        if (previousEnvironment.nodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousEnvironment.nodeEnv;
        if (previousEnvironment.adminEmail === undefined) delete process.env.ADMIN_EMAIL;
        else process.env.ADMIN_EMAIL = previousEnvironment.adminEmail;
        if (previousEnvironment.adminPassword === undefined) delete process.env.ADMIN_PASSWORD;
        else process.env.ADMIN_PASSWORD = previousEnvironment.adminPassword;
    }
});
