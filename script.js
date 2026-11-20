
document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // CURRENT LANGUAGE
    // ========================================

    let currentLanguage =
        localStorage.getItem("nextech-language") || "en";

    if (!["en", "ar"].includes(currentLanguage)) {
        currentLanguage = "en";
    }

    // ========================================
    // TRANSLATIONS
    // ========================================

    const translations = {
        en: {
            home: "Home",
            categories: "Categories",
            products: "Products",
            about: "About",
            contact: "Contact",

            heroBadge: "NEXT GENERATION TECHNOLOGY",
            heroTitle: "Discover The Future Of Technology",
            heroDescription: "Explore premium electronics and innovative technology designed for your lifestyle.",
            shopNow: "Shop Now",

            explore: "EXPLORE",
            categoriesTitle: "Shop By Category",
            categoriesDescription: "Discover technology for every need.",

            laptops: "Laptops",
            phones: "Smartphones",
            headphones: "Headphones",
            accessories: "Accessories",

            featured: "FEATURED COLLECTION",
            productsTitle: "Featured Products",
            productsDescription: "Explore our selected technology products.",

            all: "All",
            searchPlaceholder: "Search products...",
            noProducts: "No products found.",

            whoWeAre: "WHO WE ARE",
            aboutTitle: "Technology Made Simple",
            aboutDescription: "NEXTECH brings together innovation, quality, and modern technology in one place.",

            newsletterTitle: "Stay Updated",
            newsletterDescription: "Discover the latest technology and product updates.",

            getInTouch: "GET IN TOUCH",
            contactTitle: "Contact Us",
            contactDescription: "Have a question? We'd love to hear from you.",

            footer: "© 2026 NEXTECH. All rights reserved.",

            addToCart: "Add to Cart",
            cartTitle: "Your Shopping Cart",
            emptyCart: "Your cart is empty.",
            total: "Total",
            currency: "EGP",
            emailAddress: "Email address",
            subscribe: "Subscribe",
            subscribed: "You are subscribed!",
            name: "Name",
            message: "Message",
            sendMessage: "Send Message",
            messageSent: "Your message has been sent.",
            checkout: "Checkout",
            remove: "Remove",
            quantity: "Quantity",
            checkoutMessage: "Thank you! This demo checkout has no payment processing.",
            checkoutTitle: "Complete Your Order",
            phone: "Phone",
            address: "Address",
            placeOrder: "Place Order",
            orderPlaced: "Your order has been placed successfully.",

            descriptions: {
                laptop: "Powerful performance and modern design for everyday productivity.",
                phone: "Modern smartphone with an elegant design and advanced features.",
                headphones: "Enjoy immersive sound and comfortable listening.",
                earbuds: "Compact wireless design with clear and powerful sound.",
                watch: "Smart technology designed for your everyday lifestyle.",
                gaming: "Designed for an immersive and exciting gaming experience.",
                tablet: "A versatile tablet for entertainment and productivity.",
                accessory: "A practical technology accessory for everyday use."
            }
        },

        ar: {
            home: "الرئيسية",
            categories: "التصنيفات",
            products: "المنتجات",
            about: "من نحن",
            contact: "تواصل معنا",

            heroBadge: "تكنولوجيا الجيل القادم",
            heroTitle: "اكتشف مستقبل التكنولوجيا",
            heroDescription: "اكتشف مجموعة مميزة من الإلكترونيات والتكنولوجيا الحديثة المصممة لتناسب أسلوب حياتك.",
            shopNow: "تسوق الآن",

            explore: "اكتشف",
            categoriesTitle: "تسوق حسب التصنيف",
            categoriesDescription: "اكتشف التكنولوجيا التي تناسب احتياجاتك.",

            laptops: "لابتوبات",
            phones: "هواتف ذكية",
            headphones: "سماعات",
            accessories: "إكسسوارات",

            featured: "مجموعة مختارة",
            productsTitle: "منتجات مميزة",
            productsDescription: "اكتشف مجموعة مختارة من منتجات التكنولوجيا.",

            all: "الكل",
            searchPlaceholder: "ابحث عن المنتجات...",
            noProducts: "لم يتم العثور على منتجات.",

            whoWeAre: "من نحن",
            aboutTitle: "التكنولوجيا أصبحت أسهل",
            aboutDescription: "يجمع NEXTECH بين الابتكار والجودة والتكنولوجيا الحديثة في مكان واحد.",

            newsletterTitle: "ابقَ على اطلاع",
            newsletterDescription: "اكتشف أحدث أخبار التكنولوجيا والمنتجات.",

            getInTouch: "تواصل معنا",
            contactTitle: "اتصل بنا",
            contactDescription: "هل لديك سؤال؟ يسعدنا التواصل معك.",

            footer: "© 2026 NEXTECH. جميع الحقوق محفوظة.",

            addToCart: "أضف إلى السلة",
            cartTitle: "سلة مشترياتك",
            emptyCart: "سلة المشتريات فارغة.",
            total: "الإجمالي",
            currency: "جنيه",
            emailAddress: "البريد الإلكتروني",
            subscribe: "اشترك",
            subscribed: "تم الاشتراك بنجاح!",
            name: "الاسم",
            message: "الرسالة",
            sendMessage: "إرسال الرسالة",
            messageSent: "تم إرسال رسالتك بنجاح.",
            checkout: "إتمام الطلب",
            remove: "إزالة",
            quantity: "الكمية",
            checkoutMessage: "شكرًا لك! هذه تجربة ولا تحتوي على دفع حقيقي.",
            checkoutTitle: "إتمام الطلب",
            phone: "رقم الهاتف",
            address: "العنوان",
            placeOrder: "تأكيد الطلب",
            orderPlaced: "تم تأكيد طلبك بنجاح.",

            descriptions: {
                laptop: "أداء قوي وتصميم عصري للاستخدام اليومي والعمل.",
                phone: "هاتف ذكي حديث بتصميم أنيق ومميزات متطورة.",
                headphones: "استمتع بصوت غامر وراحة أثناء الاستماع.",
                earbuds: "تصميم لاسلكي صغير مع صوت واضح وقوي.",
                watch: "تكنولوجيا ذكية تناسب أسلوب حياتك اليومي.",
                gaming: "مصمم لتجربة ألعاب ممتعة وغامرة.",
                tablet: "تابلت متعدد الاستخدامات للترفيه والإنتاجية.",
                accessory: "إكسسوار تقني عملي للاستخدام اليومي."
            }
        }
    };

    // ========================================
    // PRODUCTS DATA - 64 PRODUCTS
    // ========================================

    // Prices are demonstration prices and can be changed later.

    const productList = [

        // LAPTOPS 01 - 11

        ["NEXTECH NovaBook Pro 14", "نيكستك نوفابوك برو 14", "laptops", 25999, "laptop"],
        ["NEXTECH WorkMate 15", "نيكستك وورك ميت 15", "laptops", 22999, "laptop"],
        ["NEXTECH AirBook Slim 14", "نيكستك إير بوك سليم 14", "laptops", 27999, "laptop"],
        ["NEXTECH CreatorBook X16", "نيكستك كريتور بوك X16", "laptops", 38999, "laptop"],
        ["NEXTECH FlexBook 360", "نيكستك فليكس بوك 360", "laptops", 31999, "laptop"],
        ["NEXTECH CoreBook 15", "نيكستك كور بوك 15", "laptops", 21999, "laptop"],
        ["NEXTECH ShadowBook G15", "نيكستك شادو بوك G15", "laptops", 42999, "laptop"],
        ["NEXTECH AeroBook 13", "نيكستك إيرو بوك 13", "laptops", 28999, "laptop"],
        ["NEXTECH TouchBook Pro 15", "نيكستك تاتش بوك برو 15", "laptops", 33999, "laptop"],
        ["NEXTECH DualView X17", "نيكستك ديو فيو X17", "laptops", 49999, "laptop"],
        ["NEXTECH TitanBook G16", "نيكستك تايتان بوك G16", "laptops", 45999, "laptop"],

        // SMARTPHONES 12 - 24

        ["NEXTECH Nova X5", "نيكستك نوفا X5", "phones", 8999, "phone"],
        ["NEXTECH Prime S12", "نيكستك برايم S12", "phones", 13999, "phone"],
        ["NEXTECH Neo X7", "نيكستك نيو X7", "phones", 10999, "phone"],
        ["NEXTECH Vision Pro 5G", "نيكستك فيجن برو 5G", "phones", 18999, "phone"],
        ["NEXTECH Phantom X9", "نيكستك فانتوم X9", "phones", 21999, "phone"],
        ["NEXTECH Crystal S8", "نيكستك كريستال S8", "phones", 15999, "phone"],
        ["NEXTECH Pure X4", "نيكستك بيور X4", "phones", 7999, "phone"],
        ["NEXTECH Flex Z1", "نيكستك فليكس Z1", "phones", 29999, "phone"],
        ["NEXTECH Titan G5", "نيكستك تايتان G5", "phones", 16999, "phone"],
        ["NEXTECH UltraView X12", "نيكستك ألترا فيو X12", "phones", 24999, "phone"],
        ["NEXTECH Nova X6 Pro", "نيكستك نوفا X6 برو", "phones", 19999, "phone"],
        ["NEXTECH Prime Max 12", "نيكستك برايم ماكس 12", "phones", 22999, "phone"],
        ["NEXTECH Vision Lite 5G", "نيكستك فيجن لايت 5G", "phones", 11999, "phone"],

        // HEADPHONES 25 - 28

        ["NEXTECH Sonic Pro 700", "نيكستك سونيك برو 700", "headphones", 3499, "headphones"],
        ["NEXTECH AirSound 500", "نيكستك إير ساوند 500", "headphones", 2799, "headphones"],
        ["NEXTECH Studio Max", "نيكستك ستوديو ماكس", "headphones", 4299, "headphones"],
        ["NEXTECH Pulse G7", "نيكستك بالس G7", "headphones", 3199, "headphones"],

        // EARBUDS 29 - 32

        ["NEXTECH Buds Neo", "نيكستك بادز نيو", "headphones", 1299, "earbuds"],
        ["NEXTECH AirBuds S2", "نيكستك إير بادز S2", "headphones", 1699, "earbuds"],
        ["NEXTECH Buds Pro X", "نيكستك بادز برو X", "headphones", 2199, "earbuds"],
        ["NEXTECH SportBuds 4", "نيكستك سبورت بادز 4", "headphones", 1499, "earbuds"],

        // SMARTWATCHES 33 - 38

        ["NEXTECH Watch Classic 4", "نيكستك واتش كلاسيك 4", "accessories", 2499, "watch"],
        ["NEXTECH Watch Steel S5", "نيكستك واتش ستيل S5", "accessories", 3299, "watch"],
        ["NEXTECH Watch Square X3", "نيكستك واتش سكوير X3", "accessories", 2199, "watch"],
        ["NEXTECH Watch AMOLED Pro", "نيكستك واتش أموليد برو", "accessories", 3899, "watch"],
        ["NEXTECH Watch Minimal S2", "نيكستك واتش مينيمال S2", "accessories", 1999, "watch"],
        ["NEXTECH Watch Ranger 6", "نيكستك واتش رينجر 6", "accessories", 2999, "watch"],

        // GAMING 39 - 48

        ["NEXTECH Frost Gaming PC", "نيكستك فروست كمبيوتر ألعاب", "accessories", 55999, "gaming"],
        ["NEXTECH Shadow Gaming PC", "نيكستك شادو كمبيوتر ألعاب", "accessories", 49999, "gaming"],
        ["NEXTECH MechKeys RGB K9", "نيكستك ميك كيز RGB K9", "accessories", 1899, "gaming"],
        ["NEXTECH Phantom Mouse M9", "نيكستك فانتوم ماوس M9", "accessories", 999, "gaming"],
        ["NEXTECH Vision Gaming 27", "نيكستك فيجن جيمينج 27", "accessories", 8999, "gaming"],
        ["NEXTECH UltraWide GX34", "نيكستك ألترا وايد GX34", "accessories", 14999, "gaming"],
        ["NEXTECH GamePad X2", "نيكستك جيم باد X2", "accessories", 1499, "gaming"],
        ["NEXTECH VoiceCast Pro", "نيكستك فويس كاست برو", "accessories", 2299, "gaming"],
        ["NEXTECH GlowPad XL", "نيكستك جلو باد XL", "accessories", 799, "gaming"],
        ["NEXTECH Gaming Tower G1", "نيكستك جيمينج تاور G1", "accessories", 45999, "gaming"],

        // TABLETS 49 - 54

        ["NEXTECH Tab Pro 11", "نيكستك تاب برو 11", "accessories", 11999, "tablet"],
        ["NEXTECH TabWork S10", "نيكستك تاب وورك S10", "accessories", 9999, "tablet"],
        ["NEXTECH NoteTab X8", "نيكستك نوت تاب X8", "accessories", 8499, "tablet"],
        ["NEXTECH MiniTab 8", "نيكستك ميني تاب 8", "accessories", 6999, "tablet"],
        ["NEXTECH MegaTab 13", "نيكستك ميجا تاب 13", "accessories", 15999, "tablet"],
        ["NEXTECH AndroidTab A10", "نيكستك أندرويد تاب A10", "accessories", 8999, "tablet"],

        // ACCESSORIES 55 - 64

        ["NEXTECH ChargePro 65W", "نيكستك تشارج برو 65 واط", "accessories", 899, "accessory"],
        ["NEXTECH WirelessDock S2", "نيكستك وايرلس دوك S2", "accessories", 1499, "accessory"],
        ["NEXTECH PowerCore 20K", "نيكستك باور كور 20 ألف", "accessories", 1799, "accessory"],
        ["NEXTECH ConnectHub 8-in-1", "نيكستك كونكت هب 8 في 1", "accessories", 1999, "accessory"],
        ["NEXTECH FlashDrive SSD 1TB", "نيكستك فلاش درايف SSD واحد تيرابايت", "accessories", 3999, "accessory"],
        ["NEXTECH BoomBox Mini", "نيكستك بوم بوكس ميني", "accessories", 1299, "accessory"],
        ["NEXTECH TravelPack Pro", "نيكستك ترافل باك برو", "accessories", 1599, "accessory"],
        ["NEXTECH LiftStand X", "نيكستك ليفت ستاند X", "accessories", 999, "accessory"],
        ["NEXTECH MagCharge Pad", "نيكستك ماج تشارج باد", "accessories", 1199, "accessory"],
        ["NEXTECH DockStation Pro 12", "نيكستك دوك ستيشن برو 12", "accessories", 2799, "accessory"]

    ];

    // ========================================
    // CATEGORY ICONS
    // ========================================

    const icons = {
        laptops: "💻",
        phones: "📱",
        headphones: "🎧",
        accessories: "⌚"
    };

    // ========================================
    // CREATE PRODUCTS
    // ========================================

    const products = productList.map(function (item, index) {

        const productId = index + 1;

        return {
            id: productId,
            nameEn: item[0],
            nameAr: item[1],
            category: item[2],
            price: item[3],
            image: "images/products/product-" + productId + ".jpg",

            type: item[4],
            icon: icons[item[2]] || "📦"
        };

    });

    // ========================================
    // CART DATA
    // ========================================

    let cart = [];

    try {
        const savedCart = JSON.parse(localStorage.getItem("nextech-cart"));

        if (Array.isArray(savedCart)) {
            cart = savedCart
                .map(function (item) {
                    const product = products.find(function (entry) {
                        return entry.id === item.productId;
                    });

                    return product
                        ? { product: product, quantity: Math.max(1, Number(item.quantity) || 1) }
                        : null;
                })
                .filter(Boolean);
        }
    } catch (error) {
        cart = [];
    }

    let currentFilter = "all";

    // ========================================
    // ELEMENTS
    // ========================================

    const languageButton =
        document.querySelector("#language-toggle");

    const productGrid =
        document.querySelector("#product-grid");

    const searchInput =
        document.querySelector("#product-search");

    const filterButtons =
        document.querySelectorAll(".filter-button");

    const cartButton =
        document.querySelector("#cart-button");

    const cartCount =
        document.querySelector("#cart-count");

    const menuButton =
        document.querySelector("#menu-toggle");

    const navLinks =
        document.querySelector("#nav-links");

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    function getTranslation() {
        return translations[currentLanguage];
    }

    function getProductName(product) {
        return currentLanguage === "ar"
            ? product.nameAr
            : product.nameEn;
    }

    function getProductDescription(product) {
        return getTranslation().descriptions[product.type];
    }

    function closeMenu() {

        if (navLinks) {
            navLinks.classList.remove("active");
        }

    }

    // ========================================
    // HOME BUTTON - INSTANT SCROLL FIX
    // ========================================

    document.querySelectorAll('a[href="#home"]').forEach(function (homeLink) {

        homeLink.addEventListener("click", function (event) {

            event.preventDefault();

            closeMenu();

            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "instant"
            });

        });

    });

    // ========================================
    // UPDATE PAGE LANGUAGE
    // ========================================

    function changeLanguage() {

        const t = getTranslation();

        document.documentElement.lang = currentLanguage;

        document.documentElement.dir =
            currentLanguage === "ar" ? "rtl" : "ltr";

        document.querySelectorAll("[data-i18n]").forEach(function (element) {

            const key = element.dataset.i18n;

            if (typeof t[key] === "string") {
                element.textContent = t[key];
            }

        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach(
            function (element) {

                const key = element.dataset.i18nPlaceholder;

                if (t[key]) {
                    element.placeholder = t[key];
                }

            }
        );

        if (languageButton) {

            languageButton.textContent =
                currentLanguage === "ar"
                    ? "English"
                    : "العربية";

        }

        localStorage.setItem(
            "nextech-language",
            currentLanguage
        );

        renderProducts();

    }

    // ========================================
    // FORMAT PRICE
    // ========================================

    function formatPrice(price) {

        const t = getTranslation();

        return new Intl.NumberFormat(
            currentLanguage === "ar" ? "ar-EG" : "en-US"
        ).format(price) + " " + t.currency;

    }

    // ========================================
    // RENDER PRODUCTS
    // ========================================

    function renderProducts() {

        if (!productGrid) return;

        const t = getTranslation();

        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const filteredProducts = products.filter(function (product) {

            const name = getProductName(product).toLowerCase();

            const description =
                getProductDescription(product).toLowerCase();

            const matchesCategory =
                currentFilter === "all" ||
                product.category === currentFilter;

            const matchesSearch =
                name.includes(searchTerm) ||
                description.includes(searchTerm) ||
                String(product.id).includes(searchTerm);

            return matchesCategory && matchesSearch;

        });

        productGrid.innerHTML = "";

        filteredProducts.forEach(function (product) {

            const card = document.createElement("article");

            card.className = "product-card";

            card.innerHTML = `

                <div class="product-image">

                    <span class="product-fallback">
                        ${product.icon}
                    </span>

                    <img
                        src="${product.image}"
                        alt="${getProductName(product)}"
                        loading="lazy"
                    >

                </div>

                <div class="product-info">

                    <h3>${getProductName(product)}</h3>

                    <p>${getProductDescription(product)}</p>

                    <div class="product-price">
                        ${formatPrice(product.price)}
                    </div>

                    <button
                        class="add-to-cart"
                        type="button"
                        data-product-id="${product.id}"
                    >
                        ${t.addToCart}
                    </button>

                </div>

            `;

            const productImage = card.querySelector("img");
            const fallback = card.querySelector(".product-fallback");

            productImage.addEventListener("load", function () {

                fallback.style.display = "none";

                productImage.style.visibility = "visible";

            });

            productImage.addEventListener("error", function () {

                productImage.style.display = "none";

                fallback.style.display = "flex";

            });

            productGrid.appendChild(card);

        });

        const noProducts =
            document.querySelector("#no-products");

        if (noProducts) {

            noProducts.hidden =
                filteredProducts.length !== 0;

        }

    }

    // ========================================
    // PRODUCT FILTERS
    // ========================================

    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            currentFilter = button.dataset.filter;

            filterButtons.forEach(function (item) {
                item.classList.remove("active");
            });

            button.classList.add("active");

            renderProducts();

        });

    });

    // ========================================
    // PRODUCT SEARCH
    // ========================================

    if (searchInput) {

        searchInput.addEventListener("input", function () {

            renderProducts();

        });

    }

    // ========================================
    // ADD TO CART
    // ========================================

    if (productGrid) {

        productGrid.addEventListener("click", function (event) {

            const button =
                event.target.closest(".add-to-cart");

            if (!button) return;

            const productId =
                Number(button.dataset.productId);

            const product = products.find(function (item) {
                return item.id === productId;
            });

            if (!product) return;

            const existing = cart.find(function (item) {
                return item.product.id === productId;
            });

            if (existing) {
                existing.quantity++;
            } else {
                cart.push({ product: product, quantity: 1 });
            }

            updateCartCount();
            saveCart();

        });

    }

    // ========================================
    // UPDATE CART COUNT
    // ========================================

    function updateCartCount() {

        if (cartCount) {
            cartCount.textContent = cart.reduce(function (total, item) {
                return total + item.quantity;
            }, 0);
        }

    }

    function saveCart() {
        localStorage.setItem("nextech-cart", JSON.stringify(
            cart.map(function (item) {
                return {
                    productId: item.product.id,
                    quantity: item.quantity
                };
            })
        ));
    }

    function renderCart() {
        const cartItems = document.querySelector("#cart-items");
        const cartTotal = document.querySelector("#cart-total");
        const t = getTranslation();

        if (!cartItems || !cartTotal) return;

        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="cart-empty">' + t.emptyCart + '</p>';
            cartTotal.textContent = formatPrice(0);
            return;
        }

        let total = 0;
        cartItems.innerHTML = "";

        cart.forEach(function (item) {
            const itemTotal = item.product.price * item.quantity;
            total += itemTotal;

            const row = document.createElement("div");
            row.className = "cart-item";
            row.innerHTML =
                '<div class="cart-item-info">' +
                    '<strong>' + getProductName(item.product) + '</strong>' +
                    '<span>' + formatPrice(item.product.price) + '</span>' +
                '</div>' +
                '<div class="cart-item-actions">' +
                    '<label>' + t.quantity +
                        '<input type="number" min="1" max="99" value="' + item.quantity + '" data-cart-quantity="' + item.product.id + '">' +
                    '</label>' +
                    '<button type="button" data-cart-remove="' + item.product.id + '">' + t.remove + '</button>' +
                '</div>';
            cartItems.appendChild(row);
        });

        cartTotal.textContent = formatPrice(total);
    }

    function openCart() {
        const drawer = document.querySelector("#cart-drawer");
        const overlay = document.querySelector("#cart-overlay");

        if (!drawer || !overlay) return;

        renderCart();
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
        overlay.hidden = false;
        document.body.classList.add("cart-open");

        if (cartButton) cartButton.setAttribute("aria-expanded", "true");
    }

    function closeCart() {
        const drawer = document.querySelector("#cart-drawer");
        const overlay = document.querySelector("#cart-overlay");

        if (!drawer || !overlay) return;

        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
        overlay.hidden = true;
        document.body.classList.remove("cart-open");

        if (cartButton) cartButton.setAttribute("aria-expanded", "false");
    }

    // ========================================
    // SHOW CART
    // ========================================

    if (cartButton) {

        cartButton.addEventListener("click", function () {
            openCart();

        });

    }

    const cartClose = document.querySelector("#cart-close");
    const cartOverlay = document.querySelector("#cart-overlay");
    const cartItemsContainer = document.querySelector("#cart-items");
    const checkoutButton = document.querySelector("#checkout-button");

    if (cartClose) cartClose.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

    if (cartItemsContainer) {
        cartItemsContainer.addEventListener("change", function (event) {
            const input = event.target.closest("[data-cart-quantity]");
            if (!input) return;

            const productId = Number(input.dataset.cartQuantity);
            const item = cart.find(function (entry) {
                return entry.product.id === productId;
            });

            if (item) {
                item.quantity = Math.min(99, Math.max(1, Number(input.value) || 1));
                saveCart();
                updateCartCount();
                renderCart();
            }
        });

        cartItemsContainer.addEventListener("click", function (event) {
            const button = event.target.closest("[data-cart-remove]");
            if (!button) return;

            const productId = Number(button.dataset.cartRemove);
            cart = cart.filter(function (item) {
                return item.product.id !== productId;
            });
            saveCart();
            updateCartCount();
            renderCart();
        });
    }

    if (checkoutButton) {
        checkoutButton.addEventListener("click", function () {
            if (cart.length === 0) {
                alert(getTranslation().emptyCart);
                return;
            }
            openCheckout();
        });
    }

    const checkoutModal = document.querySelector("#checkout-modal");
    const checkoutClose = document.querySelector("#checkout-close");
    const checkoutForm = document.querySelector("#checkout-form");
    const checkoutStatus = document.querySelector("#checkout-status");
    const checkoutTotal = document.querySelector("#checkout-total");

    function openCheckout() {
        if (!checkoutModal) return;

        let total = cart.reduce(function (sum, item) {
            return sum + item.product.price * item.quantity;
        }, 0);

        if (checkoutTotal) {
            checkoutTotal.textContent = formatPrice(total);
        }

        closeCart();
        checkoutModal.classList.add("open");
        checkoutModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("cart-open");
    }

    function closeCheckout() {
        if (!checkoutModal) return;

        checkoutModal.classList.remove("open");
        checkoutModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("cart-open");
    }

    if (checkoutClose) {
        checkoutClose.addEventListener("click", closeCheckout);
    }

    if (checkoutModal) {
        checkoutModal.addEventListener("click", function (event) {
            if (event.target === checkoutModal) {
                closeCheckout();
            }
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function (event) {
            event.preventDefault();

            if (checkoutStatus) {
                checkoutStatus.textContent = getTranslation().orderPlaced;
            }

            cart = [];
            saveCart();
            updateCartCount();
            renderCart();
            checkoutForm.reset();

            window.setTimeout(closeCheckout, 900);
        });
    }

    // ========================================
    // MOBILE MENU
    // ========================================

    if (menuButton && navLinks) {

        menuButton.addEventListener("click", function () {

            navLinks.classList.toggle("active");
            menuButton.setAttribute(
                "aria-expanded",
                navLinks.classList.contains("active") ? "true" : "false"
            );

        });

        navLinks.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

                closeMenu();
                menuButton.setAttribute("aria-expanded", "false");

            });

        });

    }

    // ========================================
    // NEWSLETTER AND CONTACT FORMS
    // ========================================

    const newsletterForm = document.querySelector("#newsletter-form");
    const newsletterStatus = document.querySelector("#newsletter-status");

    if (newsletterForm) {
        newsletterForm.addEventListener("submit", function (event) {
            event.preventDefault();
            if (newsletterStatus) {
                newsletterStatus.textContent = getTranslation().subscribed;
            }
            newsletterForm.reset();
        });
    }

    const contactForm = document.querySelector("#contact-form");
    const contactStatus = document.querySelector("#contact-status");

    if (contactForm) {
        contactForm.addEventListener("submit", function (event) {
            event.preventDefault();
            if (contactStatus) {
                contactStatus.textContent = getTranslation().messageSent;
            }
            contactForm.reset();
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeCart();
            closeCheckout();
            closeMenu();
            if (menuButton) menuButton.setAttribute("aria-expanded", "false");
        }
    });

    // ========================================
    // CATEGORY SHORTCUTS
    // ========================================

    document.querySelectorAll(".category-card").forEach(
        function (card) {

            card.addEventListener("click", function () {

                const category = card.dataset.category;

                if (!category) return;

                currentFilter = category;

                filterButtons.forEach(function (button) {

                    button.classList.toggle(
                        "active",
                        button.dataset.filter === category
                    );

                });

                renderProducts();

            });

        }
    );

    // ========================================
    // LANGUAGE TOGGLE
    // ========================================

    if (languageButton) {

        languageButton.addEventListener("click", function () {

            currentLanguage =
                currentLanguage === "en" ? "ar" : "en";

            changeLanguage();

        });

    }

    // ========================================
    // INITIALIZE WEBSITE
    // ========================================

    changeLanguage();

    updateCartCount();

    console.log("NEXTECH is ready with " + products.length + " products!");

});
