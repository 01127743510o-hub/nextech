(() => {
    const root = document.getElementById("restaurant-root");
    const menuItems = ["شاورما عربي", "فتة حمص", "كبة مقلية", "فروج مشوي", "مسبحة شامية", "صفيحة شامية"];
    const currency = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 });
    const state = {
        page: "dashboard",
        branch: "all",
        user: null,
        demoMode: true,
        dashboard: null,
        tasks: [],
        bookings: [],
        stock: [],
        chartPeriod: "week",
        query: ""
    };
    let branches = [];

    async function api(path, options = {}) {
        const headers = { ...(options.headers || {}) };
        if (options.body !== undefined) headers["Content-Type"] = "application/json";
        const response = await fetch(path, { ...options, headers, credentials: "same-origin" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || `تعذر تنفيذ الطلب (${response.status}).`);
        return result;
    }

    async function loadData() {
        const bootstrap = await api("/api/bootstrap");
        branches = bootstrap.branches;
        state.user = bootstrap.user;
        state.tasks = bootstrap.tasks;
        state.bookings = bootstrap.bookings;
        state.stock = bootstrap.stock;
        const query = new URLSearchParams({ branchId: state.branch, period: state.chartPeriod });
        state.dashboard = await api(`/api/dashboard?${query}`);
    }

    async function reloadData() {
        await loadData();
        renderApp();
    }

    function money(value) {
        return `${currency.format(value)} ج.م`;
    }

    function branchById(id) {
        return branches.find(branch => branch.id === id);
    }

    function visibleBranches() {
        return state.branch === "all" ? branches : branches.filter(branch => branch.id === state.branch);
    }

    function visibleItems(items) {
        return state.branch === "all" ? items : items.filter(item => item.branch === state.branch);
    }

    function alertEntries() {
        const pending = visibleItems(state.tasks).filter(task => !task.done);
        const waiting = visibleItems(state.bookings).filter(booking => booking.status === "waiting");
        const lowStock = state.stock.filter(item => item.amount < item.minimum);
        return [
            pending.length && { page: "tasks", icon: "✓", title: `${pending.length} مهام بانتظار الإنجاز`, detail: `${pending.filter(task => task.priority === "high").length} مهام بأولوية عالية` },
            waiting.length && { page: "bookings", icon: "▦", title: `${waiting.length} حجوزات بانتظار التأكيد`, detail: "راجع حجوزات الطاولات" },
            lowStock.length && { page: "inventory", icon: "⚑", title: `${lowStock.length} أصناف مخزون منخفضة`, detail: lowStock.slice(0, 2).map(item => item.name).join("، ") }
        ].filter(Boolean);
    }

    function alertPanel() {
        const alerts = alertEntries();
        return `<div class="alert-panel-head"><strong>مركز التنبيهات</strong><span>${alerts.length} تنبيهات</span></div>${alerts.length ? alerts.map(alert => `<button class="alert-item" type="button" data-alert-page="${alert.page}"><span class="alert-item-icon">${alert.icon}</span><span><strong>${esc(alert.title)}</strong><small>${esc(alert.detail)}</small></span><span class="alert-arrow">←</span></button>`).join("") : `<div class="empty-state">لا توجد تنبيهات حالية.</div>`}<p class="alert-demo-note">تنبيهات العرض مبنية على بيانات تجريبية.</p>`;
    }

    function esc(value) {
        return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    }

    function pageName(page) {
        return ({ dashboard: "نظرة عامة", branches: "الفروع", tasks: "مهام التشغيل", bookings: "حجوزات الطاولات", inventory: "المخزون" })[page] || "نظرة عامة";
    }

    function loginScreen() {
        root.innerHTML = `
            <main class="auth-screen">
                <section class="auth-art" aria-label="الدمشقي">
                    <div class="auth-brand"><img class="brand-logo brand-logo-auth" src="images/damashqi-logo.png" alt="شعار مطعم الدمشقي"></div>
                    <div class="auth-copy"><span class="eyebrow">مذاق شامي · في دمنهور</span><h1>كل تفاصيل مطعمك،<br>في لوحة واحدة.</h1><p>من متابعة المبيعات إلى تنظيم فريق العمل والحجوزات والمخزون — إدارة يومك أسهل مع الدمشقي.</p></div>
                    <div class="auth-footnote">نسخة تجريبية للعرض · البيانات المعروضة افتراضية</div>
                </section>
                <section class="auth-panel">
                    <form class="auth-card" id="login-form">
                        <span class="eyebrow">أهلاً بعودتك</span><h2>تسجيل الدخول</h2><p>سجّل الدخول لاستعراض لوحة إدارة فروعك.</p>
                        <div class="field"><label for="login-email">البريد الإلكتروني</label><input id="login-email" type="email" ${state.demoMode ? 'value="demo@aldamashqi.local"' : ""} autocomplete="username" required></div>
                        <div class="field"><label for="login-password">كلمة المرور</label><input id="login-password" type="password" ${state.demoMode ? 'value="damashqi-demo"' : ""} autocomplete="current-password" required></div>
                        <p class="form-error" id="login-error" role="status" aria-live="polite" hidden></p>
                        <button class="btn btn-primary btn-block" type="submit">الدخول إلى لوحة التحكم <span aria-hidden="true">←</span></button>
                        <div class="demo-note">${state.demoMode ? "حساب تطوير تجريبي جاهز. غيّر بيانات الدخول قبل تشغيل النظام على الإنترنت." : "أدخل بيانات حساب المطعم التي حصلت عليها من مسؤول النظام."}</div>
                    </form>
                </section>
            </main>`;
        root.querySelector("#login-form").addEventListener("submit", async event => {
            event.preventDefault();
            const form = event.currentTarget;
            if (!form.reportValidity()) return;
            const submit = form.querySelector('[type="submit"]');
            submit.disabled = true;
            try {
                const session = await api("/api/login", {
                    method: "POST",
                    body: JSON.stringify({
                        email: form.querySelector("#login-email").value,
                        password: form.querySelector("#login-password").value
                    })
                });
                state.demoMode = session.demoMode;
                await loadData();
                renderApp();
            } catch (error) {
                const message = root.querySelector("#login-error");
                message.textContent = error.message;
                message.hidden = false;
                submit.disabled = false;
            }
        });
    }

    function renderApp() {
        root.innerHTML = `
            <div class="app-shell">
                <aside class="sidebar" id="sidebar">
                    <div class="brand-lockup"><span class="brand-mark"><img src="images/damashqi-logo.png" alt=""></span><span class="brand-name">الدمشقي<span class="brand-subtitle">إدارة المطاعم</span></span></div>
                    <div class="sidebar-label">القائمة الرئيسية</div>
                    <nav class="side-nav" aria-label="القائمة الرئيسية">
                        ${navButton("dashboard", "◫", "نظرة عامة")}
                        ${navButton("branches", "⌂", "الفروع")}
                        ${navButton("tasks", "✓", "مهام التشغيل", state.tasks.filter(task => !task.done && (state.branch === "all" || task.branch === state.branch)).length)}
                        ${navButton("bookings", "▦", "الحجوزات")}
                        ${navButton("inventory", "◉", "المخزون")}
                    </nav>
                    <div class="sidebar-bottom">
                        <div class="branch-mini"><small>الفرع المحدد</small><strong>${state.branch === "all" ? "كل الفروع" : esc(branchById(state.branch)?.name || "")}</strong></div>
                        <div class="profile"><span class="avatar">${esc(state.user?.name?.slice(0, 1) || "م")}</span><span><strong>${esc(state.user?.name || "مدير المطعم")}</strong><small>${state.user?.role === "owner" ? "مدير المطعم" : "فريق المطعم"}</small></span><button type="button" data-action="logout" aria-label="تسجيل الخروج">↪</button></div>
                    </div>
                </aside>
                <div class="main-area">
                    <header class="topbar">
                        <div class="topbar-start"><button class="icon-button mobile-menu" type="button" data-action="menu" aria-label="فتح القائمة">☰</button><span class="topbar-title">إدارة الفروع</span><select class="branch-select" id="branch-select" aria-label="اختيار الفرع"><option value="all">جميع الفروع</option>${branches.map(branch => `<option value="${branch.id}" ${state.branch === branch.id ? "selected" : ""}>${esc(branch.name)}</option>`).join("")}</select></div>
                        <div class="topbar-actions"><span class="topbar-title">${new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span><button class="icon-button alert-toggle" type="button" data-action="alerts" aria-label="فتح مركز التنبيهات" aria-expanded="false">♧${alertEntries().length ? `<span class="alert-count">${alertEntries().length}</span>` : ""}</button><div class="alert-popover" id="alert-popover" hidden>${alertPanel()}</div></div>
                    </header>
                            <main class="main-content" id="page-content"></main>
                </div>
                <div class="overlay" id="sidebar-overlay" hidden></div>
                <div id="modal-host"></div>
                <div id="toast-host" aria-live="polite"></div>
            </div>`;
        renderPage();
        root.querySelector("#branch-select").addEventListener("change", async event => {
            state.branch = event.target.value;
            try {
                await loadData();
                renderApp();
            } catch (error) {
                toast(error.message);
            }
        });
        root.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => {
            state.page = button.dataset.page;
            renderPage();
            root.querySelector("#sidebar").classList.remove("open");
            root.querySelector("#sidebar-overlay").hidden = true;
            root.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.page === state.page));
        }));
        root.querySelector('[data-action="logout"]').addEventListener("click", async () => {
            try {
                await api("/api/logout", { method: "POST", body: "{}" });
                state.user = null;
                loginScreen();
            } catch (error) {
                toast(error.message);
            }
        });
        root.querySelector('[data-action="menu"]').addEventListener("click", () => {
            root.querySelector("#sidebar").classList.add("open");
            root.querySelector("#sidebar-overlay").hidden = false;
        });
        root.querySelector("#sidebar-overlay").addEventListener("click", closeMenu);
        const alertButton = root.querySelector('[data-action="alerts"]');
        const alertPopover = root.querySelector("#alert-popover");
        alertButton.addEventListener("click", () => {
            alertPopover.hidden = !alertPopover.hidden;
            alertButton.setAttribute("aria-expanded", String(!alertPopover.hidden));
        });
        alertPopover.querySelectorAll("[data-alert-page]").forEach(button => button.addEventListener("click", () => {
            state.page = button.dataset.alertPage;
            renderApp();
        }));
    }

    function navButton(page, icon, label, count) {
        return `<button type="button" class="nav-item ${state.page === page ? "active" : ""}" data-page="${page}"><span class="nav-icon">${icon}</span><span>${label}</span>${count ? `<span class="nav-count">${count}</span>` : ""}</button>`;
    }

    function closeMenu() {
        root.querySelector("#sidebar").classList.remove("open");
        root.querySelector("#sidebar-overlay").hidden = true;
    }

    function pageHeader(title, subtitle, actions = "") {
        return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
    }

    function renderPage() {
        const content = root.querySelector("#page-content");
        if (!content) return;
        const renderers = { dashboard: dashboardPage, branches: branchesPage, tasks: tasksPage, bookings: bookingsPage, inventory: inventoryPage };
        content.innerHTML = `${renderers[state.page]()}<footer class="page-footer">الدمشقي · نسخة تجريبية · المبيعات والطلبات المعروضة افتراضية</footer>`;
        bindPageActions(content);
    }

    function dashboardPage() {
        const selected = visibleBranches();
        const period = state.dashboard;
        const pending = visibleItems(state.tasks).filter(task => !task.done);
        const reservations = visibleItems(state.bookings).filter(booking => booking.status !== "cancelled");
        return `${pageHeader("صباح الخير، مصطفي 👋", "ملخص الأداء للفترة المحددة · بيانات توضيحية وليست أرقاماً فعلية", `<button class="btn btn-plain" data-action="print-report">▤ طباعة التقرير</button>`)}
            <section class="quick-actions" aria-label="إجراءات سريعة"><span class="quick-actions-label">إجراءات سريعة</span><button class="btn btn-primary" data-action="new-booking">＋ حجز</button><button class="btn btn-soft" data-action="new-task">＋ مهمة</button><button class="btn btn-plain" data-action="new-stock">＋ صنف مخزون</button></section>
            <section class="stats-grid" aria-label="مؤشرات الفترة">
                ${statCard("مبيعات الفترة", money(period.sales), trendText(period.salesChange), `${period.label} · مقارنة بالسابق`, "◷", trendClass(period.salesChange))}
                ${statCard("الطلبات", currency.format(period.orders), trendText(period.ordersChange), `طلباً · ${period.label}`, "▤", trendClass(period.ordersChange))}
                ${statCard("متوسط الفاتورة", money(period.average), "توضيحي", "لكل طلب خلال الفترة", "◈")}
                ${statCard("حجوزات اليوم", currency.format(reservations.length), `${pending.length} مهام مفتوحة`, "تحتاج إلى متابعة", "▦")}
            </section>
            <section class="dashboard-grid">
                <article class="card"><div class="card-head"><div><h2>مقارنة المبيعات</h2><p>${period.label} مقابل الفترة السابقة · أرقام توضيحية</p></div><select class="select-small" id="chart-period" aria-label="فترة مقارنة المبيعات"><option value="week" ${state.chartPeriod === "week" ? "selected" : ""}>آخر ٧ أيام</option><option value="month" ${state.chartPeriod === "month" ? "selected" : ""}>هذا الشهر</option></select></div>${salesChart()}<div class="chart-legend"><span class="legend-dot"></span> الفترة الحالية <span class="legend-dot legend-dot-previous"></span> الفترة السابقة</div></article>
                <article class="card"><div class="card-head"><div><h2>مقارنة الفروع</h2><p>مبيعات وطلبات ومقارنة يومية افتراضية</p></div><button class="btn btn-plain btn-xs" data-page="branches">كل الفروع</button></div><div class="branch-list">${branchRank(selected)}</div></article>
            </section>
            <section class="dashboard-lower">
                <article class="card"><div class="card-head"><div><h2>مهام التشغيل</h2><p>${pending.length} مهام بانتظار الإنجاز</p></div><div class="table-actions"><button class="btn btn-primary btn-xs" data-action="new-task">＋ إضافة مهمة</button><button class="btn btn-plain btn-xs" data-page="tasks">عرض الكل</button></div></div>${taskRows(visibleItems(state.tasks).slice(0, 4))}</article>
                <article class="card"><div class="card-head"><div><h2>حجوزات قادمة</h2><p>حجوزات الطاولات اليوم</p></div><button class="btn btn-plain btn-xs" data-page="bookings">عرض الكل</button></div>${bookingRows(visibleItems(state.bookings).slice(0, 3))}</article>
            </section>`;
    }

    function trendText(change) {
        return `${change >= 0 ? "↗" : "↘"} ${currency.format(Math.abs(change))}٪`;
    }

    function trendClass(change) {
        return change >= 0 ? "trend-up" : "trend-down";
    }

    function statCard(label, value, trend, foot, icon, trendStyle = "trend-up") {
        return `<article class="card stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><strong class="stat-value">${value}</strong><div class="stat-foot"><span class="${trendStyle}">${trend}</span><span>${foot}</span></div></article>`;
    }

    function salesChart() {
        const { labels, currentSeries: current, previousSeries: previous } = state.dashboard;
        const max = Math.max(...current, ...previous, 1);
        const pointString = values => values.map((value, index) => `${45 + index * (580 / (values.length - 1))},${185 - value / max * 135}`).join(" ");
        const currentPoints = pointString(current);
        const previousPoints = pointString(previous);
        const area = `45,185 ${currentPoints} ${625},185`;
        return `<div class="chart-wrap"><svg viewBox="0 0 660 220" role="img" aria-label="مقارنة توضيحية للمبيعات بين الفترتين"><defs><linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#6da17d" stop-opacity=".2"/><stop offset="100%" stop-color="#6da17d" stop-opacity="0"/></linearGradient></defs>${[35, 85, 135, 185].map(y => `<line class="chart-gridline" x1="40" x2="640" y1="${y}" y2="${y}"/>`).join("")}<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${currentPoints}"/><polyline class="chart-line-previous" points="${previousPoints}"/>${current.map((value, index) => `<circle class="chart-dot" cx="${45 + index * (580 / (current.length - 1))}" cy="${185 - value / max * 135}" r="4"/>`).join("")}${labels.map((label, index) => `<text class="chart-label" x="${45 + index * (580 / (labels.length - 1))}" y="210" text-anchor="middle">${label}</text>`).join("")}</svg></div>`;
    }

    function branchRank(list) {
        const highest = Math.max(...list.map(branch => branch.sales), 1);
        return list.slice().sort((a, b) => b.sales - a.sales).map((branch, index) => `<div class="branch-row"><strong>${index + 1}. ${esc(branch.name)}</strong><span class="branch-sales">${money(branch.sales)}</span><small>${currency.format(branch.orders)} طلب تجريبي · ${branch.occupancy}% إشغال تقديري</small><span class="muted" style="text-align:left;font-size:9px">${branch.change > 0 ? "↗" : "↘"} ${Math.abs(branch.change)}%</span><div class="progress-track"><div class="progress-fill" style="width:${Math.round(branch.sales / highest * 100)}%"></div></div></div>`).join("");
    }

    function taskRows(tasks) {
        if (!tasks.length) return `<div class="empty-state">لا توجد مهام لهذا الفرع.</div>`;
        return `<div class="task-list">${tasks.map(task => `<div class="task-row"><button type="button" class="task-check ${task.done ? "done" : ""}" data-action="toggle-task" data-id="${task.id}" aria-label="${task.done ? "إلغاء إنجاز" : "إنجاز"} المهمة">${task.done ? "✓" : ""}</button><span class="task-text ${task.done ? "done" : ""}">${esc(task.title)}</span><span class="task-meta">${esc(branchById(task.branch)?.name || "")} · ${task.time}</span><span class="priority ${task.priority}">${priorityLabel(task.priority)}</span></div>`).join("")}</div>`;
    }

    function priorityLabel(priority) {
        return ({ high: "عالية", medium: "متوسطة", low: "منخفضة" })[priority];
    }

    function bookingRows(bookings) {
        if (!bookings.length) return `<div class="empty-state">لا توجد حجوزات مسجلة.</div>`;
        return `<div class="booking-list">${bookings.map(booking => `<div class="booking-row"><span class="booking-time">${booking.time}</span><span class="booking-info"><strong>${esc(booking.name)}</strong><small>${esc(branchById(booking.branch)?.name || "")} · ${booking.guests} أشخاص</small></span><span class="status-pill ${booking.status}">${statusLabel(booking.status)}</span></div>`).join("")}</div>`;
    }

    function statusLabel(status) {
        return ({ confirmed: "مؤكد", waiting: "قيد التأكيد", cancelled: "ملغي" })[status] || status;
    }

    function branchesPage() {
        const selected = visibleBranches();
        const totalSales = selected.reduce((sum, branch) => sum + branch.sales, 0);
        const actions = `<button class="btn btn-primary" data-action="new-branch" disabled title="إضافة الفروع متاحة في النسخة القادمة">＋ إضافة فرع</button>`;
        return `${pageHeader("الفروع", "تفاصيل المواقع والتقييمات حسب المعلومات المقدمة؛ مؤشرات الأداء تقديرية.", actions)}
            <section class="stats-grid">${statCard("المطاعم", currency.format(selected.length), "في دمنهور", "المواقع المعروضة", "⌂")}${statCard("مبيعات اليوم", money(totalSales), "توضيحي", "أرقام تجريبية فقط", "◷")}${statCard("الطلبات", currency.format(selected.reduce((sum, branch) => sum + branch.orders, 0)), "توضيحي", "أرقام تجريبية فقط", "▤")}${statCard("متوسط الإشغال", `${Math.round(selected.reduce((sum, branch) => sum + branch.occupancy, 0) / selected.length || 0)}٪`, "توضيحي", "مؤشر افتراضي", "▦")}</section>
            ${branchCards(selected)}
            <article class="card" style="margin-top:16px"><div class="card-head"><div><h2>أصناف مميزة من قائمة المطعم</h2><p>أمثلة على قائمة شامية شعبية · لا تمثل قائمة تشغيل فعلية</p></div></div><div class="toolbar"><div class="toolbar-end">${menuItems.map((item, index) => `<span class="status-pill available">${["🥙", "🧆", "🍽️", "🍗", "🥣", "🥟"][index]} ${item}</span>`).join("")}</div></div></article>`;
    }

    function branchCards(list) {
        return `<section class="branch-profile-grid" aria-label="معلومات الفروع">${list.map(branch => {
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.name} ${branch.area}`)}`;
            return `<article class="card branch-profile-card"><div class="branch-profile-head"><span class="branch-avatar">⌂</span><span class="branch-profile-title"><h2>${esc(branch.name)}</h2><span>${esc(branch.area)}</span></span>${branch.rating ? `<span class="branch-rating">★ ${branch.rating}<small> (${currency.format(branch.reviews)})</small></span>` : `<span class="status-pill">لا يوجد تقييم</span>`}</div><div class="branch-details"><div><small>ساعات العمل</small><strong>${esc(branch.hours)}</strong></div><div><small>مستوى الأسعار</small><strong>${esc(branch.price || "غير متوفر")}</strong></div><div><small>الخدمات</small><strong>${esc(branch.services)}</strong></div></div>${branch.note ? `<p class="branch-note">${esc(branch.note)}</p>` : ""}<div class="branch-demo-stats"><span>مبيعات تجريبية <strong>${money(branch.sales)}</strong></span><span>طلبات تجريبية <strong>${currency.format(branch.orders)}</strong></span></div><div class="branch-card-actions">${branch.phone ? `<a class="btn btn-soft" href="tel:${esc(branch.phone.replace(/\s/g, ""))}">☎ اتصال</a>` : `<span class="muted branch-no-phone">رقم الهاتف غير متوفر</span>`}<a class="btn btn-plain" href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer">⌖ فتح الموقع</a></div></article>`;
        }).join("")}</section>`;
    }

    function tasksPage() {
        const tasks = visibleItems(state.tasks);
        const open = tasks.filter(task => !task.done).length;
        return `${pageHeader("مهام التشغيل", "تابع قائمة المهام اليومية لكل فرع", `<button class="btn btn-primary" data-action="new-task">＋ إضافة مهمة</button>`)}
            <section class="stats-grid">${statCard("إجمالي المهام", currency.format(tasks.length), "اليوم", "في نطاق الفروع", "✓")}${statCard("بانتظار الإنجاز", currency.format(open), "تحتاج متابعة", "المهام المفتوحة", "◷")}${statCard("مكتملة", currency.format(tasks.length - open), "منجزة", "خلال اليوم", "✔")}${statCard("أولوية عالية", currency.format(tasks.filter(task => task.priority === "high" && !task.done).length), "عاجلة", "تحتاج الانتباه", "⚑")}</section>
            <article class="card"><div class="card-head"><div><h2>قائمة مهام اليوم</h2><p>يمكن تحديث حالة المهام في العرض التجريبي</p></div><select class="select-small" id="task-filter"><option value="all">كل الحالات</option><option value="open">غير مكتملة</option><option value="done">مكتملة</option></select></div><div class="task-list" id="task-list">${taskRows(tasks)}</div></article>`;
    }

    function bookingsPage() {
        const list = visibleItems(state.bookings);
        return `${pageHeader("حجوزات الطاولات", "إدارة حجوزات اليوم عبر الفروع", `<button class="btn btn-primary" data-action="new-booking">＋ حجز جديد</button>`)}
            <section class="stats-grid">${statCard("حجوزات اليوم", currency.format(list.filter(item => item.status !== "cancelled").length), "اليوم", "حجزاً تجريبياً", "▦")}${statCard("ضيوف متوقعون", currency.format(list.filter(item => item.status !== "cancelled").reduce((sum, item) => sum + Number(item.guests), 0)), "لليوم", "في كل الفروع", "♙")}${statCard("مؤكدة", currency.format(list.filter(item => item.status === "confirmed").length), "جاهزة", "تم تأكيدها", "✓")}${statCard("بانتظار التأكيد", currency.format(list.filter(item => item.status === "waiting").length), "متابعة", "تحتاج إلى اتصال", "◷")}</section>
            <article class="card"><div class="toolbar"><input class="search-input" type="search" id="booking-search" placeholder="ابحث باسم الضيف أو الفرع..." aria-label="البحث في الحجوزات"><div class="toolbar-end"><select class="select-small" id="booking-status"><option value="all">كل الحالات</option><option value="confirmed">مؤكد</option><option value="waiting">قيد التأكيد</option><option value="cancelled">ملغي</option></select></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>الضيف</th><th>الفرع</th><th>الوقت</th><th>عدد الأشخاص</th><th>الطاولة</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody id="booking-table">${bookingTableRows(list)}</tbody></table></div></article>`;
    }

    function bookingTableRows(bookings) {
        if (!bookings.length) return `<tr><td colspan="7"><div class="empty-state">لا توجد حجوزات مطابقة.</div></td></tr>`;
        return bookings.map(booking => `<tr><td><strong>${esc(booking.name)}</strong><span class="branch-table-meta">${esc(booking.phone || "")}</span></td><td>${esc(branchById(booking.branch)?.name || "")}</td><td>${booking.time}</td><td>${booking.guests}</td><td>${esc(booking.table || "—")}</td><td><span class="status-pill ${booking.status}">${statusLabel(booking.status)}</span></td><td><div class="table-actions">${booking.status === "waiting" ? `<button class="btn btn-soft btn-xs" data-action="confirm-booking" data-id="${booking.id}">تأكيد</button>` : ""}${booking.status !== "cancelled" ? `<button class="btn btn-plain btn-xs" data-action="cancel-booking" data-id="${booking.id}">إلغاء</button>` : ""}</div></td></tr>`).join("");
    }

    function inventoryPage() {
        const stock = state.stock;
        const low = stock.filter(item => item.amount < item.minimum).length;
        return `${pageHeader("المخزون", "مؤشرات مخزون تجريبية لتوضيح التنبيهات", `<button class="btn btn-primary" data-action="new-stock">＋ إضافة صنف</button>`)}
            <section class="stats-grid">${statCard("أصناف المخزون", currency.format(stock.length), "مواد أولية", "في القائمة التجريبية", "◉")}${statCard("تنبيهات النقص", currency.format(low), "تحتاج متابعة", "أقل من الحد الأدنى", "⚑")}${statCard("أصناف متوفرة", currency.format(stock.length - low), "ضمن الحد", "مؤشر توضيحي", "✓")}${statCard("آخر تحديث", "اليوم", "10:15 ص", "وقت افتراضي", "◷")}</section>
            <article class="card"><div class="card-head"><div><h2>قائمة المخزون</h2><p>أصناف شامية ومكونات مطبخ · أرقام افتراضية</p></div><span class="status-pill low-stock">${low} تنبيهات</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>الصنف</th><th>الفئة</th><th>الكمية الحالية</th><th>الحد الأدنى</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>${stock.map(item => `<tr><td><span class="inventory-item"><span class="ingredient-icon">${esc(item.icon)}</span><strong>${esc(item.name)}</strong></span></td><td>${esc(item.category)}</td><td><strong>${item.amount} ${esc(item.unit)}</strong></td><td>${item.minimum} ${esc(item.unit)}</td><td><span class="status-pill ${item.amount < item.minimum ? "low-stock" : "available"}">${item.amount < item.minimum ? "منخفض" : "متوفر"}</span></td><td>${item.amount < item.minimum ? `<button class="btn btn-soft btn-xs" data-action="restock" data-id="${esc(item.id)}">تسجيل توريد</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></article>`;
    }

    function bindPageActions(content) {
        content.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => {
            state.page = button.dataset.page;
            renderApp();
        }));
        content.querySelectorAll('[data-action="new-booking"]').forEach(button => button.addEventListener("click", showBookingModal));
        content.querySelectorAll('[data-action="new-task"]').forEach(button => button.addEventListener("click", showTaskModal));
        content.querySelectorAll('[data-action="new-stock"]').forEach(button => button.addEventListener("click", showStockModal));
        content.querySelectorAll('[data-action="print-report"]').forEach(button => button.addEventListener("click", () => window.print()));
        bindBookingActions(content);
        content.querySelectorAll('[data-action="restock"]').forEach(button => button.addEventListener("click", async () => {
            try {
                await api(`/api/inventory/${encodeURIComponent(button.dataset.id)}/restock`, { method: "POST", body: "{}" });
                await reloadData();
                toast("تم تسجيل التوريد في المخزون.");
            } catch (error) {
                toast(error.message);
            }
        }));
        const chartPeriod = content.querySelector("#chart-period");
        if (chartPeriod) chartPeriod.addEventListener("change", async event => {
            state.chartPeriod = event.target.value;
            try {
                await reloadData();
            } catch (error) {
                toast(error.message);
            }
        });
        const taskFilter = content.querySelector("#task-filter");
        if (taskFilter) taskFilter.addEventListener("change", event => {
            const tasks = visibleItems(state.tasks).filter(task => event.target.value === "all" || (event.target.value === "done" ? task.done : !task.done));
            content.querySelector("#task-list").innerHTML = taskRows(tasks);
            bindTaskToggles(content);
        });
        bindTaskToggles(content);
        const bookingSearch = content.querySelector("#booking-search");
        const bookingStatus = content.querySelector("#booking-status");
        if (bookingSearch && bookingStatus) {
            const filterBookings = () => {
                const query = bookingSearch.value.trim().toLocaleLowerCase("ar");
                const status = bookingStatus.value;
                const filtered = visibleItems(state.bookings).filter(booking =>
                    (status === "all" || booking.status === status) &&
                    `${booking.name} ${branchById(booking.branch)?.name || ""}`.toLocaleLowerCase("ar").includes(query));
                content.querySelector("#booking-table").innerHTML = bookingTableRows(filtered);
                bindBookingActions(content);
            };
            bookingSearch.addEventListener("input", filterBookings);
            bookingStatus.addEventListener("change", filterBookings);
        }
    }

    function bindTaskToggles(content) {
        content.querySelectorAll('[data-action="toggle-task"]').forEach(button => button.addEventListener("click", async () => {
            const task = state.tasks.find(item => item.id === button.dataset.id);
            if (!task) return;
            try {
                await api(`/api/tasks/${encodeURIComponent(button.dataset.id)}`, { method: "PATCH", body: JSON.stringify({ done: !task.done }) });
                await reloadData();
            } catch (error) {
                toast(error.message);
            }
        }));
    }

    function bindBookingActions(content) {
        content.querySelectorAll('[data-action="confirm-booking"]').forEach(button => button.addEventListener("click", () => updateBooking(button.dataset.id, "confirmed")));
        content.querySelectorAll('[data-action="cancel-booking"]').forEach(button => button.addEventListener("click", () => updateBooking(button.dataset.id, "cancelled")));
    }

    async function updateBooking(id, status) {
        try {
            await api(`/api/bookings/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
            await reloadData();
            toast(status === "confirmed" ? "تم تأكيد الحجز." : "تم إلغاء الحجز.");
        } catch (error) {
            toast(error.message);
        }
    }

    function showModal(title, body, submitText, onSubmit) {
        const host = root.querySelector("#modal-host");
        host.innerHTML = `<div class="modal" role="presentation"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${title}</h2><button class="modal-close" type="button" data-close aria-label="إغلاق">×</button></div><form id="modal-form">${body}<p class="form-error" id="modal-error" role="status" aria-live="polite" hidden></p><div class="form-actions"><button class="btn btn-primary" type="submit">${submitText}</button><button class="btn btn-plain" type="button" data-close>إلغاء</button></div></form></section></div>`;
        const close = () => { host.innerHTML = ""; };
        host.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", close));
        host.querySelector(".modal").addEventListener("click", event => { if (event.target.classList.contains("modal")) close(); });
        host.querySelector("#modal-form").addEventListener("submit", async event => {
            event.preventDefault();
            const form = event.currentTarget;
            if (!form.reportValidity()) return;
            const submit = form.querySelector('[type="submit"]');
            submit.disabled = true;
            try {
                await onSubmit(new FormData(form));
                close();
            } catch (error) {
                const message = host.querySelector("#modal-error");
                message.textContent = error.message;
                message.hidden = false;
                submit.disabled = false;
            }
        });
        host.querySelector("input,select")?.focus();
    }

    function branchOptions(selected = "") {
        return branches.map(branch => `<option value="${branch.id}" ${selected === branch.id ? "selected" : ""}>${esc(branch.name)}</option>`).join("");
    }

    function showBookingModal() {
        showModal("إضافة حجز طاولة", `<div class="form-grid"><div class="field"><label for="guest-name">اسم الضيف</label><input id="guest-name" name="name" required></div><div class="field"><label for="guest-phone">رقم الهاتف (اختياري)</label><input id="guest-phone" name="phone" type="tel"></div><div class="field"><label for="booking-branch">الفرع</label><select id="booking-branch" name="branch" required>${branchOptions(state.branch === "all" ? branches[0].id : state.branch)}</select></div><div class="field"><label for="booking-time">الوقت</label><input id="booking-time" name="time" type="time" required value="19:00"></div><div class="field"><label for="guest-count">عدد الضيوف</label><input id="guest-count" name="guests" type="number" min="1" max="30" value="2" required></div><div class="field"><label for="table-name">الطاولة (اختياري)</label><input id="table-name" name="table" placeholder="مثال: طاولة 05"></div></div>`, "حفظ الحجز", async data => {
            await api("/api/bookings", { method: "POST", body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), branchId: data.get("branch"), time: data.get("time"), guests: Number(data.get("guests")), table: data.get("table") }) });
            await loadData();
            renderApp();
            toast("تم حفظ الحجز.");
        });
    }

    function showTaskModal() {
        showModal("إضافة مهمة تشغيل", `<div class="form-grid"><div class="field full"><label for="task-title">عنوان المهمة</label><input id="task-title" name="title" required></div><div class="field"><label for="task-branch">الفرع</label><select id="task-branch" name="branch" required>${branchOptions(state.branch === "all" ? branches[0].id : state.branch)}</select></div><div class="field"><label for="task-priority">الأولوية</label><select id="task-priority" name="priority"><option value="medium">متوسطة</option><option value="high">عالية</option><option value="low">منخفضة</option></select></div><div class="field"><label for="task-time">موعد التنفيذ</label><input id="task-time" name="time" type="time" value="12:00" required></div></div>`, "إضافة المهمة", async data => {
            await api("/api/tasks", { method: "POST", body: JSON.stringify({ title: data.get("title"), branchId: data.get("branch"), priority: data.get("priority"), time: data.get("time") }) });
            await loadData();
            renderApp();
            toast("تمت إضافة المهمة.");
        });
    }

    function showStockModal() {
        showModal("إضافة صنف للمخزون", `<div class="form-grid"><div class="field full"><label for="stock-name">اسم الصنف</label><input id="stock-name" name="name" required></div><div class="field"><label for="stock-category">الفئة</label><select id="stock-category" name="category"><option>خضار</option><option>لحوم</option><option>ألبان</option><option>مخبوزات</option><option>مواد أساسية</option></select></div><div class="field"><label for="stock-unit">وحدة القياس</label><input id="stock-unit" name="unit" placeholder="كغ / لتر / ربطة" required></div><div class="field"><label for="stock-amount">الكمية الحالية</label><input id="stock-amount" name="amount" type="number" min="0" value="0" required></div><div class="field"><label for="stock-minimum">الحد الأدنى</label><input id="stock-minimum" name="minimum" type="number" min="0" value="5" required></div></div>`, "إضافة الصنف", async data => {
            await api("/api/inventory", { method: "POST", body: JSON.stringify({ name: data.get("name"), category: data.get("category"), unit: data.get("unit"), amount: Number(data.get("amount")), minimum: Number(data.get("minimum")), icon: "📦" }) });
            await loadData();
            renderApp();
            toast("تمت إضافة الصنف.");
        });
    }

    let toastTimer;
    function toast(message) {
        const host = root.querySelector("#toast-host");
        if (!host) return;
        host.innerHTML = `<div class="toast">${esc(message)}</div>`;
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => { host.innerHTML = ""; }, 2800);
    }

    async function startApplication() {
        try {
            const session = await api("/api/session");
            state.demoMode = session.demoMode;
            if (!session.authenticated) {
                loginScreen();
                return;
            }
            await loadData();
            renderApp();
        } catch (error) {
            root.innerHTML = `<main class="auth-screen"><section class="auth-panel"><div class="auth-card"><h1>تعذر الاتصال بالخادم</h1><p>${esc(error.message)}</p><button class="btn btn-primary" type="button" id="retry-server">إعادة المحاولة</button></div></section></main>`;
            root.querySelector("#retry-server").addEventListener("click", startApplication);
        }
    }

    startApplication();
})();
