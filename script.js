// ===================================================================
// VAY PERFUME — контакты
// ===================================================================
// Админ-элементы (редактирование ароматов) скрыты для покупателей.
// Включатся только после подключения авторизации / базы данных.
const IS_ADMIN = false;

const WHATSAPP_NUMBER = "79635997799";
const INSTAGRAM_URL = "https://www.instagram.com/vay.perfum?stkn=MWFla3F4YmdtMG13Mg%3D%3D&utm_source=qr";

function waLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// generic order / contact buttons (not tied to a specific fragrance)
document.querySelectorAll('a[href="WHATSAPP_LINK"]').forEach(a => {
  a.href = waLink("Здравствуйте! Хочу узнать больше об ароматах VAY PERFUME.");
});
document.querySelectorAll('a[href="WHATSAPP_HELP"]').forEach(a => {
  a.href = waLink("Здравствуйте! Помогите, пожалуйста, подобрать аромат.");
});
document.querySelectorAll('a[href="INSTAGRAM_LINK"]').forEach(a => {
  a.href = INSTAGRAM_URL;
});

// ===================================================================
// VAY PERFUME — cinematic intro (plays once per browser session)
// ===================================================================
(function initIntro() {
  const overlay = document.getElementById("introOverlay");
  if (!overlay) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const alreadyPlayed = sessionStorage.getItem("vayIntroPlayed");

  if (reduceMotion || alreadyPlayed) {
    overlay.style.display = "none";
    sessionStorage.setItem("vayIntroPlayed", "1");
    return;
  }

  // scatter a handful of soft gold particles
  const particlesHost = document.getElementById("introParticles");
  const count = 10;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const left = 42 + Math.random() * 16; // cluster near center
    const drift = (Math.random() - 0.5) * 90;
    const delay = 1.1 + Math.random() * 1.6;
    p.style.left = left + "%";
    p.style.setProperty("--px", drift + "px");
    p.style.animationDelay = delay + "s";
    particlesHost.appendChild(p);
  }

  setTimeout(() => {
    overlay.classList.add("fade");
    sessionStorage.setItem("vayIntroPlayed", "1");
  }, 3600);
})();

// ===================================================================
// VAY PERFUME — отзывы
// Реальные скриншоты переписок с клиентами (не выдуманы, не отредактированы).
// Структура специально сделана как отдельный массив с полями
// {id, image, alt, visible, sortOrder}, чтобы позже source можно было
// заменить на Supabase, не переписывая логику карусели.
// ===================================================================
const SEED_REVIEWS = [
  { id: "rev-1", image: "assets/review-1.jpg", alt: "Отзыв клиента VAY PERFUME", visible: true, sortOrder: 1 },
  { id: "rev-2", image: "assets/review-2.jpg", alt: "Отзыв клиента VAY PERFUME", visible: true, sortOrder: 2 },
  { id: "rev-3", image: "assets/review-3.jpg", alt: "Отзыв клиента VAY PERFUME", visible: true, sortOrder: 3 },
  { id: "rev-4", image: "assets/review-4.jpg", alt: "Отзыв клиента VAY PERFUME", visible: true, sortOrder: 4 },
  { id: "rev-5", image: "assets/review-5.jpg", alt: "Отзыв клиента VAY PERFUME", visible: true, sortOrder: 5 },
  { id: "rev-6", image: "assets/review-6.jpg", alt: "Отзыв клиента VAY PERFUME", visible: true, sortOrder: 6 },
  { id: "rev-7", image: "assets/review-7.jpg", alt: "Отзыв клиента VAY PERFUME", visible: true, sortOrder: 7 },
];

const REVIEWS_ADDED_KEY = "vayReviewsAdded";
const REVIEWS_DELETED_KEY = "vayReviewsDeleted";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

let reviewsAdded = IS_ADMIN ? loadJSON(REVIEWS_ADDED_KEY, []) : [];
let reviewsDeleted = IS_ADMIN ? loadJSON(REVIEWS_DELETED_KEY, []) : [];

let remoteReviews = null;

function getReviews() {
  if (remoteReviews) return remoteReviews;
  const seed = SEED_REVIEWS.filter(r => r.visible && !reviewsDeleted.includes(r.id));
  const added = reviewsAdded.filter(r => r.visible !== false && !reviewsDeleted.includes(r.id));
  return [...seed, ...added].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

const reviewsTrack = document.getElementById("reviewsTrack");
const reviewsDots = document.getElementById("reviewsDots");
const reviewsPrev = document.getElementById("reviewsPrev");
const reviewsNext = document.getElementById("reviewsNext");
const reviewLightbox = document.getElementById("reviewLightbox");
const reviewLightboxImg = document.getElementById("reviewLightboxImg");
const reviewLightboxClose = document.getElementById("reviewLightboxClose");

function renderReviews() {
  const list = getReviews();

  reviewsTrack.innerHTML = list.map(r => `
    <div class="review-card" data-id="${r.id}">
      <div class="review-card-frame">
        <img src="${r.image}" alt="${r.alt}" loading="lazy">
      </div>
      <div class="review-card-cap"><span>Отзыв клиента</span><span>Посмотреть отзыв →</span></div>
    </div>
  `).join("");

  reviewsTrack.querySelectorAll(".review-card").forEach(card => {
    card.addEventListener("click", () => {
      const img = card.querySelector("img");
      openLightbox(img.src, img.alt);
    });
  });

  reviewsDots.innerHTML = list.map((_, i) =>
    `<button class="reviews-dot${i === 0 ? " active" : ""}" data-index="${i}" aria-label="Отзыв ${i + 1}"></button>`
  ).join("");

  reviewsDots.querySelectorAll(".reviews-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const cards = reviewsTrack.querySelectorAll(".review-card");
      const target = cards[parseInt(dot.dataset.index, 10)];
      if (target) target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    });
  });
}
renderReviews();

function updateActiveDot() {
  const cards = [...reviewsTrack.querySelectorAll(".review-card")];
  if (!cards.length) return;
  const trackLeft = reviewsTrack.getBoundingClientRect().left;
  let closestIndex = 0;
  let closestDist = Infinity;
  cards.forEach((card, i) => {
    const dist = Math.abs(card.getBoundingClientRect().left - trackLeft);
    if (dist < closestDist) { closestDist = dist; closestIndex = i; }
  });
  reviewsDots.querySelectorAll(".reviews-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === closestIndex);
  });
}
let reviewsScrollTimer;
reviewsTrack.addEventListener("scroll", () => {
  clearTimeout(reviewsScrollTimer);
  reviewsScrollTimer = setTimeout(updateActiveDot, 80);
}, { passive: true });

function scrollReviewsBy(dir) {
  const card = reviewsTrack.querySelector(".review-card");
  if (!card) return;
  const step = card.getBoundingClientRect().width + 14;
  reviewsTrack.scrollBy({ left: dir * step, behavior: "smooth" });
}
reviewsPrev.addEventListener("click", () => scrollReviewsBy(-1));
reviewsNext.addEventListener("click", () => scrollReviewsBy(1));

function openLightbox(src, alt) {
  reviewLightboxImg.src = src;
  reviewLightboxImg.alt = alt;
  reviewLightbox.classList.add("open");
  body.style.overflow = "hidden";
}
function closeLightbox() {
  reviewLightbox.classList.remove("open");
  body.style.overflow = "";
}
reviewLightboxClose.addEventListener("click", closeLightbox);
reviewLightbox.addEventListener("click", (e) => {
  if (e.target === reviewLightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && reviewLightbox.classList.contains("open")) closeLightbox();
});

// ===================================================================
// VAY PERFUME — данные ароматов
// ВАЖНО: фотографии, названия, ноты и цены ниже — ВРЕМЕННЫЕ ЗАГЛУШКИ.
// Реальные фотографии (15 мужских на тёмном фоне, 8 женских на молочном)
// не были предоставлены, поэтому они не придуманы, а помечены как
// "фото будет добавлено". Замените поле photo на путь к реальному
// файлу (например "assets/him-01.jpg"), а name/feel/notes/volume/price
// на настоящие данные, когда они появятся.
// ===================================================================

const SEED_FRAGRANCES = [
  { id: "him-01", gender: "him", brand: "Lattafa", name: "Sehr", photo: "assets/him-01.jpg",
    feel: "Тёплый, пряно-сладкий аромат с мягким миндальным оттенком. Уютный вечер, где пряная корица постепенно становится нежнее, а сладкая ваниль и тёплая амбра создают мягкое, глубокое и немного чувственное звучание. Для тех, кто хочет тепла и заметности без приторной сладости. Подойдёт и ему, и ей.",
    notesTop: "Корица, горький миндаль", notesHeart: "Жасмин, Pomarose, Akigalawood, ваниль", notesBase: "Абсолют ванили, амбра, бобы тонка",
    volume: "100 мл", price: "3 500 ₽" },
  { id: "him-02", gender: "him", brand: "Designer Shaik Arabia", name: "Opulent Shaik Sapphire", photo: "assets/him-02.jpg",
    feel: "Насыщенный, пряно-свежий аромат с ощущением дорогой классики. Сначала звучит ярко и свежо, затем раскрывается тёплыми специями и яблоком, а со временем становится глубже, мягче и древеснее. Для тех, кто хочет аромат с характером — заметный, элегантный и не похожий на обычную свежесть. Подойдёт мужчинам, которые любят выразительные и благородные ароматы.",
    notesTop: "Бергамот, лимон, лаванда, базилик", notesHeart: "Яблоко, корица, гвоздика, герань", notesBase: "Кедр, дубовый мох, пачули, лабданум, ваниль, мускус",
    volume: "100 мл", price: "3 500 ₽" },
  { id: "him-03", gender: "him", brand: "Lattafa", name: "Qaed Al Fursan Untamed", photo: "assets/him-03.jpg",
    feel: "Тёплый, пряный и выразительный аромат с лёгкой свежестью мандарина. Сочетание согревающих специй, свежей лаванды и мягкой карамели — сначала звучит ярко и пряно, затем становится глубже, теплее и древеснее. Для тех, кто хочет аромат с характером, уверенный и заметный, но без тяжёлой сладости. Подойдёт и ему, и ей, особенно тем, кто любит тёплые пряно-древесные композиции.",
    notesTop: "Мускатный орех, кардамон, мандарин, корица", notesHeart: "Лаванда, герань, кипарис, мускатный шалфей, карамель", notesBase: "Кедр, олибанум, ветивер, лабданум, амбра",
    volume: "90 мл", price: "2 500 ₽" },
  { id: "him-04", gender: "him", brand: "Lattafa", name: "Khamrah Qahwa", photo: "assets/him-04.jpg",
    feel: "Тёплый, сладкий и пряный аромат с красивым кофейным акцентом. Чашка свежесваренного кофе рядом с ванильным десертом: сначала раскрывается пряной корицей, имбирём и кардамоном, затем становится мягким, сладким и уютным. Для тех, кто хочет насыщенный аромат с настоящим ощущением кофе, тепла и сладости. Подойдёт и ему, и ей, особенно если нравятся гурманские ароматы.",
    notesTop: "Имбирь, корица, кардамон", notesHeart: "Пралине, засахаренные фрукты, белые цветы", notesBase: "Кофе Arabica, бобы тонка, мускус, бензоин, ваниль",
    volume: "100 мл", price: "3 500 ₽" },
  { id: "him-05", gender: "him", brand: "French Avenue", name: "Veneno", photo: "assets/him-05.jpg",
    feel: "Тёмный, пряный и немного дымный аромат с сочным яблочным оттенком. Тёплое пряное яблоко, окутанное лёгким дымом и табачными нотами — постепенно становится глубже, мягче и теплее благодаря ванили. Для тех, кто хочет что-то выразительное, необычное и с характером. Подойдёт и ему, и ей, особенно если нравятся пряные, дымные и слегка сладковатые ароматы.",
    notesTop: "Яблоко, корица, дым", notesHeart: "Табак, мох", notesBase: "Бурбонская ваниль, Orcanox",
    volume: "100 мл", price: "2 600 ₽" },
  { id: "him-06", gender: "him", brand: "French Avenue", name: "Liquid Brun", photo: "assets/him-06.jpg",
    feel: "Тёплый, сладкий и пряный аромат с кремовой ванилью и лёгким цитрусовым оттенком. Свежий воздух с ароматом корицы и кардамона, а затем мягкая ваниль, сладкое пралине и тёплые древесные ноты. Постепенно становится глубже и уютнее, оставляя сладковатый, ванильный и слегка древесный шлейф — особенно хорошо раскрывается в прохладную погоду и вечером. Для тех, кто любит тёплые сладкие ароматы с ванилью и специями.",
    notesTop: "Корица, бергамот, кардамон, цветок апельсина", notesHeart: "Бурбонская ваниль, элеми", notesBase: "Мускус, пралине, амброксан, гваяковое дерево",
    volume: "100 мл", price: "3 500 ₽", oldPrice: "4 000 ₽" },
  { id: "him-07", gender: "him", brand: "French Avenue", name: "Amber Empire", photo: "assets/him-07.jpg",
    feel: "Тёплый, насыщенный и элегантный аромат с мягкой ванилью, тёплой амброй и древесными нотами. Сладковато-пряный аромат, в котором ваниль и лёгкая ликёрная нота постепенно переходят в тёплую амбру, кедр и мягкое сандаловое дерево. В раскрытии становится глубже и спокойнее, оставляя тёплый, слегка сладкий и древесный шлейф. Для тех, кто хочет выразительный аромат с ощущением тепла, дорогой древесины и мягкой сладости.",
    notesTop: "Ваниль, кашемировое дерево, восточные ноты, ликёр", notesHeart: "Амбра, тростниковый сахар, кедр", notesBase: "Бобы тонка, лабданум, сандаловое дерево, мускус",
    volume: "100 мл", price: "3 500 ₽" },
  { id: "him-08", gender: "him", brand: "Asdaaf", name: "Ameer Al Arab", photo: "assets/him-08.jpg",
    feel: "Свежий, пряный и немного восточный аромат с красивым сочетанием цветов, специй и зелёных нот. В начале ощущается мягкая сладость жасмина и жимолости, затем появляются лаванда, шафран и перец, а в базе — прохладная мята, кардамон и базилик. В итоге аромат получается свежим, пряным и чистым, с заметным восточным характером, но без тяжёлой сладости. Для тех, кто хочет универсальный аромат на каждый день, который звучит ухоженно, свежо и с характером.",
    notesTop: "Жасмин, жимолость", notesHeart: "Лаванда, шафран, перец", notesBase: "Мята, кардамон, базилик",
    volume: "100 мл", price: "2 500 ₽" },
  { id: "him-09", gender: "him", brand: "Lattafa", name: "Qaed Al Fursan Unlimited", photo: "assets/him-09.jpg",
    feel: "Сладкий, кремовый и тропический аромат с сочным ананасом и мягким кокосом. Прохладный тропический напиток с фруктами и кокосовыми сливками — постепенно добавляются нежные белые цветы, а в базе остаются ваниль, мускус и мягкое сандаловое дерево. Лёгкий, солнечный и уютный, без тяжёлой приторности. Хороший вариант, если хочется чего-то сладкого, свежего и немного отпускного по настроению. Подойдёт и ему, и ей.",
    notesTop: "Ананас, цитрусы, кокос", notesHeart: "Жасмин, франжипани, иланг-иланг", notesBase: "Ваниль, белый мускус, сандаловое дерево, сладкие ноты",
    volume: "90 мл", price: "2 500 ₽" },
  { id: "him-10", gender: "him", brand: "Ard Al Zaafaran", name: "Saheb Intense", photo: "assets/him-10.jpg",
    feel: "Свежий, цитрусовый и пряный аромат с лёгкой чайной глубиной. В начале звучит ярко и свежо благодаря цитрусам, бергамоту и апельсину, затем появляются имбирь, нероли и тёплая корица. Постепенно становится спокойнее и глубже — к свежести добавляются чёрный чай, древесные и слегка дымные оттенки. Для тех, кто хочет свежий аромат, но не совсем обычную «свежесть», а с пряным характером и интересным шлейфом. Подойдёт и ему, и ей.",
    notesTop: "Цитрон, калабрийский бергамот, сицилийский апельсин", notesHeart: "Тунисский нероли, нигерийский имбирь, цейлонская корица", notesBase: "Чёрный чай, амброксан, гваяковое дерево, ладан",
    volume: "70 мл", price: "2 900 ₽", oldPrice: "3 500 ₽" },
  { id: "him-11", gender: "him", brand: "Al Haramain", name: "Amber Oud Aqua Dubai", photo: "assets/him-11.jpg",
    feel: "Свежий, сочный и лёгкий аромат с ярким цитрусовым стартом и тропическими фруктами. Прохладный фруктовый напиток: сначала ощущаются бергамот, мандарин и свежие зелёные ноты, затем раскрываются сочная дыня, ананас, чёрная смородина и мягкая амбра. В конце становится спокойнее и мягче — появляется ваниль, мускус и лёгкая зелёная глубина. Для тех, кто хочет свежий, современный и заметный аромат на каждый день, особенно для тёплой погоды. Подойдёт и ему, и ей.",
    notesTop: "Бергамот, мандарин, зелёные ноты", notesHeart: "Дыня, ананас, амбра, чёрная смородина", notesBase: "Мускус, ваниль, гальбанум, петитгрейн",
    volume: "75 мл", price: "7 500 ₽", oldPrice: "8 500 ₽" },
  { id: "him-12", gender: "him", brand: "Maison Alhambra", name: "Megara", photo: "assets/him-12.jpg",
    feel: "Свежий, морской и очень прохладный аромат с яркими цитрусами. Свежий воздух у моря: сначала ощущаются сочный лимон и бергамот, затем появляется влажная морская свежесть с оттенком водорослей, а в базе остаются мягкие древесные и мускусные ноты. Заметный, прохладный и немного солоноватый — совсем не про сладость. Хороший вариант, если хочется ощущения чистоты, свежего воздуха и моря. Подойдёт и ему, и ей.",
    notesTop: "Бергамот, лимон", notesHeart: "Морские водоросли, Calone, Hedione", notesBase: "Амброксан, мускус, кедр",
    volume: "50 мл", price: "4 000 ₽" },
  { id: "him-13", gender: "him", brand: "Lattafa Pride", name: "Pisa", photo: "assets/him-13.jpg",
    feel: "Свежий, сочный и чистый аромат с ярким цитрусовым началом. Свежесрезанный мандарин, лимон и бергамот — звучит солнечно, легко и очень бодро. Постепенно цитрусовая свежесть становится спокойнее, появляются суховатые древесные оттенки кедра, а в финале аромат становится мягче и теплее благодаря сандалу и амбре. Для тех, кто хочет свежий, ухоженный и современный аромат без сладости на каждый день.",
    notesTop: "Мандарин, лимон, бергамот", notesHeart: "Кедр", notesBase: "Сандаловое дерево, амбра",
    volume: "100 мл", price: "4 500 ₽" },
  { id: "him-14", gender: "him", brand: "Lattafa", name: "Qaed Al Fursan", photo: "assets/him-14.jpg",
    feel: "Сочный, сладковато-фруктовый аромат с ярким ананасом и тёплыми пряными оттенками шафрана. Спелый тропический ананас с лёгкой пряностью — постепенно добавляются жасмин и мягкие бальзамические ноты, а в базе остаются тёплая амбра, кедр и уд. Фруктовый, насыщенный и слегка древесный, с заметным восточным характером. Для тех, кто хочет сладкий, сочный и выразительный аромат с ананасом. Подойдёт и ему, и ей.",
    notesTop: "Ананас, шафран", notesHeart: "Жасмин, пихтовый бальзам", notesBase: "Уд, кедр, амбра",
    volume: "90 мл", price: "2 500 ₽" },
  { id: "him-15", gender: "him", brand: "RAVE", name: "Now", photo: "assets/him-15.jpg",
    feel: "Сочный, фруктовый и немного древесный аромат с ярким ананасом. Спелый сочный ананас с яблоком и чёрной смородиной — начало свежее, сладковатое и очень заметное. Постепенно фруктовая свежесть сменяется более глубоким звучанием: появляются сухие древесные оттенки берёзы, роза, жасмин и пачули, а в базе остаются мягкая ваниль, мускус, мох и тёплая амбра. Для тех, кто любит фруктовые ароматы с характером, особенно с ярким ананасом и древесной базой.",
    notesTop: "Ананас, чёрная смородина, бергамот, яблоко", notesHeart: "Роза, сухая берёза, марокканский жасмин, пачули", notesBase: "Мускус, ваниль, дубовый мох, амбра",
    volume: "100 мл", price: "2 500 ₽" },
  { id: "her-01", gender: "her", brand: "French Avenue", name: "Veneno Bianco", photo: "assets/her-01.jpg",
    feel: "Нежный, кремовый и солнечный аромат с молочным акцентом, белыми цветами и кокосом. Тёплый день у моря: сначала звучат свежие бергамот и нероли, затем раскрываются нежные цветы тиаре, иланг-иланг и белые цветы. Постепенно становится мягким и тёплым — появляется кокос, ваниль и лёгкие древесно-амбровые оттенки. Ощущение кремового, цветочного и немного тропического аромата. Для тех, кто хочет что-то нежное, женственное и с ощущением тёплой кожи, солнца и отпуска.",
    notesTop: "Бергамот, нероли, молоко", notesHeart: "Цветок тиаре, иланг-иланг, белые цветы", notesBase: "Кокос, ваниль, гваяковое дерево, лабданум",
    volume: "100 мл", price: "2 600 ₽", oldPrice: "3 000 ₽" },
  { id: "her-02", gender: "her", brand: "Ahmed Al Maghribi", name: "Blush Noire", photo: "assets/her-02.jpg",
    feel: "Свежий, ягодно-цветочный аромат с лёгкой кислинкой ревеня и сочной ежевикой. В начале звучит ярко и свежо, затем становятся заметны нежные белые цветы и прохладные морские оттенки. В базе становится мягче и чище — появляется мускус, минеральные и слегка амбровые ноты, которые оставляют аккуратный, современный шлейф. Для тех, кто хочет женственный аромат, но не приторно-сладкий, а свежий, ягодный и немного необычный.",
    notesTop: "Шалфей, ревень, ежевика", notesHeart: "Египетский жасмин, морские ноты, ландыш", notesBase: "Минеральные ноты, амбергрис, мускус, ваниль",
    volume: "75 мл", price: "3 500 ₽", oldPrice: "4 000 ₽" },
  { id: "her-03", gender: "her", brand: "Anfar London", name: "Rituals of Anfar Chef-D’Oeuvre", photo: "assets/her-03.jpg",
    feel: "Яркий, свежий и немного сладкий цитрусовый аромат с тёплой амброй и мягкой ванилью. Сочный сицилийский апельсин, лимон и бергамот — аромат сразу звучит солнечно и свежо. Через некоторое время цитрусовая свежесть становится мягче, появляются фруктовые и тёплые амбровые оттенки. В финале остаются белый мускус и ваниль, создавая чистый, кремовый и слегка сладковатый шлейф. Для тех, кто хочет свежий аромат, который постепенно становится более тёплым и уютным. Подойдёт и ему, и ей.",
    notesTop: "Сицилийский апельсин, калабрийский бергамот, сицилийский лимон", notesHeart: "Амбра, фруктовые ноты", notesBase: "Белый мускус, мадагаскарская ваниль",
    volume: "80 мл", price: "3 500 ₽", oldPrice: "4 200 ₽" },
  { id: "her-04", gender: "her", brand: "RAVE", name: "Now Women", photo: "assets/her-04.jpg",
    feel: "Нежный, сладкий и фруктовый аромат с красивым оттенком красных ягод и мягкой ванили. Сочные ягоды и апельсин в самом начале, а затем воздушный маршмеллоу и нежные белые цветы. Постепенно становится более мягким и уютным: остаются ваниль, мускус и лёгкая мшистая нота. Женственный, сладковатый и немного пудровый аромат без ощущения тяжести. Для тех, кто хочет что-то нежное, приятное и заметное на каждый день.",
    notesTop: "Красные ягоды, апельсин", notesHeart: "Маршмеллоу, ландыш, жасмин", notesBase: "Ваниль, мускус, мох",
    volume: "100 мл", price: "2 500 ₽" },
  { id: "her-05", gender: "her", brand: "RAVE", name: "Now White", photo: "assets/her-05.jpg",
    feel: "Свежий, чистый и лёгкий аромат с ярким цитрусовым началом. Сочный грейпфрут и бергамот — сначала звучит прохладно и свежо, затем становится мягче благодаря зелёному яблоку и пачули. В базе остаются мускус, кашмеран и тёплая амбра, поэтому аромат постепенно становится более мягким и уютным, сохраняя ощущение чистоты и свежести. Для тех, кто хочет универсальный аромат на каждый день, который не перегружает и легко вписывается в любой образ. Подойдёт и ему, и ей.",
    notesTop: "Грейпфрут, бергамот", notesHeart: "Зелёное яблоко, пачули", notesBase: "Мускус, кашмеран, амбра",
    volume: "100 мл", price: "2 500 ₽" },
  { id: "her-06", gender: "her", brand: "Loui Martin", name: "Diyana Exclusive", photo: "assets/her-06.jpg",
    feel: "Нежный, фруктово-цветочный аромат с сочным личи и лёгкой кислинкой ревеня. В начале звучит свежо и ярко, а затем становится мягче — появляются нежная роза, пион и лёгкая ванильная сладость. Постепенно становится теплее и глубже: к цветам добавляются мягкие древесные и слегка пряные оттенки. Женственный, ухоженный и элегантный аромат с красивым шлейфом. Для тех, кто хочет нежный цветочный аромат, но не слишком простой и не приторно-сладкий.",
    notesTop: "Личи, ревень, бергамот, мускатный орех", notesHeart: "Турецкая роза, пион, мускус, петалия, ваниль", notesBase: "Кашмеран, ладан, кедр, гаитянский ветивер",
    volume: "80 мл", price: "2 500 ₽" },
  { id: "her-07", gender: "her", brand: "Lattafa", name: "Bade’e Al Oud Noble Blush", photo: "assets/her-07.jpg",
    feel: "Нежный, кремовый и сладковатый аромат с мягким оттенком розы. В начале звучит воздушно и молочно, затем раскрывается сочетанием миндальной сладости и лёгкого безе — ощущение нежного десерта. В базе становится теплее и мягче: ваниль, сандал и мускус создают уютный, бархатистый шлейф. Для тех, кто хочет женственный, мягкий и сладкий аромат без тяжёлой восточной насыщенности.",
    notesTop: "Розовое молоко", notesHeart: "Безе, миндаль", notesBase: "Ваниль, сандал, мускус",
    volume: "100 мл", price: "3 800 ₽" },
  { id: "her-08", gender: "her", brand: "Asdaaf", name: "Ameerat Al Arab", photo: "assets/her-08.jpg",
    feel: "Свежий, нежный и женственный аромат с лёгкой восточной ноткой. В начале ощущаются яркие цитрусы и бергамот, затем становится мягче — появляются белый мускус и алоэ вера. Постепенно раскрываются жасмин, древесные оттенки и мягкая амбровая теплота. Чистый, ухоженный и слегка восточный аромат — без ощущения тяжёлой сладости. Для тех, кто хочет женственный аромат на каждый день, который звучит аккуратно, свежо и при этом имеет характер.",
    notesTop: "Цитрусы, бергамот", notesHeart: "Белый мускус, алоэ вера", notesBase: "Жасмин, мускус, древесные ноты, уд",
    volume: "100 мл", price: "2 500 ₽" }
];

// ---------------- fragrance admin storage (this browser only) ----------------
const FRAG_EDITS_KEY = "vayFragEdits";
const FRAG_ADDED_KEY = "vayFragAdded";
const FRAG_DELETED_KEY = "vayFragDeleted";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

let fragEdits = IS_ADMIN ? loadJSON(FRAG_EDITS_KEY, {}) : {};
let fragAdded = IS_ADMIN ? loadJSON(FRAG_ADDED_KEY, []) : [];
let fragDeleted = IS_ADMIN ? loadJSON(FRAG_DELETED_KEY, []) : [];

// Если каталог успешно загружен из Supabase, он становится основным
// источником (см. loadRemoteCatalog ниже). Пока не загружен или
// Supabase не настроен — используются локальные SEED_FRAGRANCES,
// сайт при этом продолжает работать как обычно.
let remoteFragrances = null;

function getFragrances() {
  if (remoteFragrances) return remoteFragrances;

  const fromSeed = SEED_FRAGRANCES
    .filter(f => !fragDeleted.includes(f.id))
    .map((f, idx) => {
      const edit = fragEdits[f.id];
      return edit ? { ...f, ...edit, order: edit.order !== undefined ? edit.order : idx } : { ...f, order: idx };
    });
  const added = fragAdded.filter(f => !fragDeleted.includes(f.id));
  return [...fromSeed, ...added].sort((a, b) => (a.order || 0) - (b.order || 0));
}

// ---------------- render cards ----------------
const grid = document.getElementById("grid");

// cards get their own observer, since the whole grid is too tall
// for a single "15% of the container visible" threshold to ever fire
const cardIo = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      cardIo.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

function observeCards() {
  document.querySelectorAll(".card").forEach(card => {
    if (!card.classList.contains("in")) cardIo.observe(card);
  });
}

function cardTag(f) {
  if (f.type === "original") return " · оригинал";
  if (f.type === "copy") return " · копия / аналог";
  return "";
}

function renderCards() {
  const list = getFragrances();
  let html = list.map((f, idx) => {
    const brand = f.brand && f.brand !== "—" ? f.brand : (f.gender === "him" ? "Мужской аромат" : f.gender === "her" ? "Женский аромат" : "Унисекс аромат");
    const onOrder = f.inStock === false;
    return `
    <div class="card" data-gender="${f.gender}" data-id="${f.id}" tabindex="0" role="button" aria-label="${f.name} — подробнее" style="transition-delay:${(idx % 8) * 0.06}s">
      <div class="card-photo">
        ${f.photo
          ? `<img src="${f.photo}" alt="${f.name}" loading="lazy">`
          : `<div class="placeholder-ph"><span class="drop">◆</span><small>ФОТО БУДЕТ<br>ДОБАВЛЕНО</small></div>`
        }
        ${IS_ADMIN ? `<button class="card-edit-btn" data-edit="${f.id}">✎</button>` : ""}
      </div>
      <div class="card-body">
        <div class="card-name">${f.name}</div>
        <div class="card-desc">${brand}${cardTag(f)}</div>
        ${f.character ? `<div class="card-character">${f.character}</div>` : ""}
        <span class="card-price">${f.oldPrice ? `<span class="price-old">${f.oldPrice}</span>` : ""}${f.price}</span>
        <div class="card-meta">
          <span class="card-status${onOrder ? " order" : ""}">${onOrder ? "Под заказ" : "В наличии"}</span>
          <span class="card-more">Подробнее →</span>
        </div>
      </div>
    </div>`;
  }).join("");

  if (IS_ADMIN) html += `<div class="add-card" id="addFragCard">＋<br>Добавить аромат</div>`;
  grid.innerHTML = html;

  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".card-edit-btn")) return;
      openModal(card.dataset.id);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(card.dataset.id); }
    });
  });
  if (IS_ADMIN) {
    grid.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openFragForm(btn.dataset.edit);
      });
    });
    const addFragCard = document.getElementById("addFragCard");
    if (addFragCard) addFragCard.addEventListener("click", () => openFragForm(null));
  }

  // re-apply active filter after re-render
  const activeFilter = document.querySelector(".filter-btn.active")?.dataset.filter || "all";
  document.querySelectorAll(".card").forEach(card => {
    const match = activeFilter === "all" || card.dataset.gender === activeFilter;
    card.classList.toggle("hidden", !match);
  });

  observeCards();
}
renderCards();

// ---------------- filters ----------------
const filterBtns = document.querySelectorAll(".filter-btn");
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    document.querySelectorAll(".card").forEach(card => {
      const match = filter === "all" || card.dataset.gender === filter;
      card.classList.toggle("hidden", !match);
    });
  });
});

// menu links that also set a filter (Для него / Для неё)
document.querySelectorAll(".menu-link[data-filter]").forEach(link => {
  link.addEventListener("click", () => {
    const target = link.dataset.filter;
    filterBtns.forEach(b => b.classList.toggle("active", b.dataset.filter === target));
    document.querySelectorAll(".card").forEach(card => {
      card.classList.toggle("hidden", card.dataset.gender !== target);
    });
  });
});

// ---------------- mobile menu ----------------
const menuBtn = document.getElementById("menuBtn");
const body = document.body;
menuBtn.addEventListener("click", () => {
  const open = body.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
});
document.addEventListener("click", (e) => {
  if (body.classList.contains("menu-open") && !e.target.closest("#mobileMenu") && !e.target.closest("#menuBtn")) {
    body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});
document.querySelectorAll(".menu-link").forEach(l => {
  l.addEventListener("click", () => body.classList.remove("menu-open"));
});

// ---------------- header background on scroll ----------------
const header = document.getElementById("siteHeader");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

// ---------------- scroll reveal ----------------
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// ---------------- modal ----------------
const overlay = document.getElementById("modalOverlay");
const modalPhoto = document.getElementById("modalPhoto");
const modalPhPh = document.getElementById("modalPhPh");
const modalName = document.getElementById("modalName");
const modalFeel = document.getElementById("modalFeel");
const modalNotesTop = document.getElementById("modalNotesTop");
const modalNotesHeart = document.getElementById("modalNotesHeart");
const modalNotesBase = document.getElementById("modalNotesBase");
const modalVolume = document.getElementById("modalVolume");
const modalPrice = document.getElementById("modalPrice");

function openModal(id) {
  const f = getFragrances().find(x => x.id === id);
  if (!f) return;

  modalPhoto.querySelectorAll("img").forEach(im => im.remove());
  if (f.photo) {
    modalPhPh.style.display = "none";
    const img = document.createElement("img");
    img.src = f.photo;
    img.alt = f.name;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    modalPhoto.prepend(img);
  } else {
    modalPhPh.style.display = "flex";
  }

  document.getElementById("modalBrand").textContent = f.brand && f.brand !== "—" ? f.brand : (f.gender === "him" ? "Мужской аромат" : f.gender === "her" ? "Женский аромат" : "Унисекс аромат");
  modalName.textContent = f.name;
  const badges = [`<span class="badge">${f.inStock === false ? "Под заказ" : "В наличии"}</span>`];
  if (f.type === "original") badges.push(`<span class="badge">Оригинал</span>`);
  if (f.type === "copy") badges.push(`<span class="badge">Копия / аналог</span>`);
  document.getElementById("modalBadges").innerHTML = badges.join("");
  document.getElementById("modalCharacter").textContent = f.character || "";
  modalFeel.textContent = f.feel;
  modalNotesTop.textContent = `Верхние: ${f.notesTop}`;
  modalNotesHeart.textContent = `Сердце: ${f.notesHeart}`;
  modalNotesBase.textContent = `База: ${f.notesBase}`;
  modalVolume.textContent = f.volume;
  modalPrice.innerHTML = f.oldPrice ? `<span class="price-old">${f.oldPrice}</span>${f.price}` : f.price;
  const orderBtn = document.getElementById("modalOrder");
  orderBtn.href = waLink(`Здравствуйте! Хочу узнать подробнее об аромате ${f.name}.`);

  overlay.classList.add("open");
  body.style.overflow = "hidden";
}

function closeModal() {
  overlay.classList.remove("open");
  body.style.overflow = "";
}

document.getElementById("modalClose").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ===================================================================
// VAY PERFUME — редактирование ароматов (этот браузер, до подключения базы)
// ===================================================================
const collectionSection = document.getElementById("collection");
const collectionEditToggle = document.getElementById("collectionEditToggle");
const collectionEditHint = document.getElementById("collectionEditHint");
const fragModalOverlay = document.getElementById("fragModalOverlay");
const fragFormPhotoFile = document.getElementById("fragFormPhotoFile");
const fragFormPhotoPreview = document.getElementById("fragFormPhotoPreview");
const fragFormPhotoImg = document.getElementById("fragFormPhotoImg");
const fragFormBrand = document.getElementById("fragFormBrand");
const fragFormName = document.getElementById("fragFormName");
const fragFormFeel = document.getElementById("fragFormFeel");
const fragFormNotesTop = document.getElementById("fragFormNotesTop");
const fragFormNotesHeart = document.getElementById("fragFormNotesHeart");
const fragFormNotesBase = document.getElementById("fragFormNotesBase");
const fragFormVolume = document.getElementById("fragFormVolume");
const fragFormOrder = document.getElementById("fragFormOrder");
const fragFormPrice = document.getElementById("fragFormPrice");
const fragFormOldPrice = document.getElementById("fragFormOldPrice");
const fragFormType = document.getElementById("fragFormType");
const fragFormCharacter = document.getElementById("fragFormCharacter");
const fragFormInStock = document.getElementById("fragFormInStock");
const fragFormDelete = document.getElementById("fragFormDelete");
const fragGenderBtns = document.querySelectorAll(".frag-gender-btn");

let editingFragId = null;
let pendingPhoto = null;
let currentGender = "him";

if (collectionEditToggle) collectionEditToggle.addEventListener("click", () => {
  collectionSection.classList.toggle("editing");
  collectionEditToggle.classList.toggle("active");
  collectionEditHint.style.display = collectionSection.classList.contains("editing") ? "block" : "none";
  renderCards();
});

fragGenderBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentGender = btn.dataset.gender;
    fragGenderBtns.forEach(b => b.classList.toggle("active", b === btn));
  });
});

fragFormPhotoFile.addEventListener("change", () => {
  const file = fragFormPhotoFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 900;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      pendingPhoto = canvas.toDataURL("image/jpeg", 0.78);
      fragFormPhotoImg.src = pendingPhoto;
      fragFormPhotoPreview.style.display = "block";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

function openFragForm(id) {
  editingFragId = id;
  pendingPhoto = null;
  fragFormPhotoFile.value = "";

  if (id) {
    const f = getFragrances().find(x => x.id === id);
    fragFormBrand.value = f.brand === "—" ? "" : (f.brand || "");
    fragFormName.value = f.name || "";
    fragFormFeel.value = f.feel || "";
    fragFormNotesTop.value = f.notesTop || "";
    fragFormNotesHeart.value = f.notesHeart || "";
    fragFormNotesBase.value = f.notesBase || "";
    fragFormVolume.value = f.volume || "";
    fragFormOrder.value = f.order || 0;
    fragFormPrice.value = f.price || "";
    fragFormOldPrice.value = f.oldPrice || "";
    fragFormType.value = f.type || "";
    fragFormCharacter.value = f.character || "";
    fragFormInStock.checked = f.inStock !== false;
    currentGender = f.gender;
    if (f.photo) {
      fragFormPhotoImg.src = f.photo;
      fragFormPhotoPreview.style.display = "block";
    } else {
      fragFormPhotoPreview.style.display = "none";
    }
    fragFormDelete.style.display = "block";
  } else {
    fragFormBrand.value = "";
    fragFormName.value = "";
    fragFormFeel.value = "";
    fragFormNotesTop.value = "";
    fragFormNotesHeart.value = "";
    fragFormNotesBase.value = "";
    fragFormVolume.value = "";
    fragFormOrder.value = getFragrances().length;
    fragFormPrice.value = "Цена по запросу";
    fragFormOldPrice.value = "";
    fragFormType.value = "";
    fragFormCharacter.value = "";
    fragFormInStock.checked = true;
    currentGender = "him";
    fragFormPhotoPreview.style.display = "none";
    fragFormDelete.style.display = "none";
  }
  fragGenderBtns.forEach(b => b.classList.toggle("active", b.dataset.gender === currentGender));

  fragModalOverlay.classList.add("open");
  body.style.overflow = "hidden";
}
function closeFragForm() {
  fragModalOverlay.classList.remove("open");
  body.style.overflow = "";
}

document.getElementById("fragFormCancel").addEventListener("click", closeFragForm);
fragModalOverlay.addEventListener("click", (e) => {
  if (e.target === fragModalOverlay) closeFragForm();
});

document.getElementById("fragFormSave").addEventListener("click", () => {
  const name = fragFormName.value.trim();
  if (!name) return;

  const fields = {
    gender: currentGender,
    brand: fragFormBrand.value.trim() || "—",
    name,
    feel: fragFormFeel.value.trim() || "Описание появится позже.",
    notesTop: fragFormNotesTop.value.trim() || "уточняется",
    notesHeart: fragFormNotesHeart.value.trim() || "уточняется",
    notesBase: fragFormNotesBase.value.trim() || "уточняется",
    volume: fragFormVolume.value.trim() || "уточняется",
    order: parseInt(fragFormOrder.value, 10) || 0,
    price: fragFormPrice.value.trim() || "Цена по запросу",
    oldPrice: fragFormOldPrice.value.trim() || "",
    type: fragFormType.value || "",
    character: fragFormCharacter.value.trim(),
    inStock: fragFormInStock.checked,
  };
  if (pendingPhoto) fields.photo = pendingPhoto;

  if (editingFragId) {
    const isSeed = SEED_FRAGRANCES.some(x => x.id === editingFragId);
    if (isSeed) {
      fragEdits[editingFragId] = { ...(fragEdits[editingFragId] || {}), ...fields };
      saveJSON(FRAG_EDITS_KEY, fragEdits);
    } else {
      const item = fragAdded.find(x => x.id === editingFragId);
      Object.assign(item, fields);
      saveJSON(FRAG_ADDED_KEY, fragAdded);
    }
  } else {
    const newItem = { id: "custom-" + Date.now(), photo: pendingPhoto || null, ...fields };
    fragAdded.push(newItem);
    saveJSON(FRAG_ADDED_KEY, fragAdded);
  }

  renderCards();
  // make sure the just-saved item is visible regardless of active filter
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === "all"));
  document.querySelectorAll(".card").forEach(c => c.classList.remove("hidden"));
  closeFragForm();
});

fragFormDelete.addEventListener("click", () => {
  if (!editingFragId) return;
  const isSeed = SEED_FRAGRANCES.some(x => x.id === editingFragId);
  if (isSeed) {
    if (!fragDeleted.includes(editingFragId)) fragDeleted.push(editingFragId);
    saveJSON(FRAG_DELETED_KEY, fragDeleted);
  } else {
    fragAdded = fragAdded.filter(x => x.id !== editingFragId);
    saveJSON(FRAG_ADDED_KEY, fragAdded);
  }
  renderCards();
  closeFragForm();
});


// ===================================================================
// FAQ — раскрывающиеся вопросы
// ===================================================================
document.querySelectorAll(".faq-q").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const open = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
});

// ===================================================================
// VAY PERFUME — загрузка каталога и отзывов из Supabase (если настроен)
// Публичный сайт уже отрисован из SEED_* выше — это только "долив"
// актуальных данных из базы поверх, без пересборки страницы.
// ===================================================================
async function loadRemoteCatalog() {
  if (typeof isSupabaseConfigured !== "function" || !isSupabaseConfigured()) return;

  try {
    const [frags, revs] = await Promise.all([
      fetchFragrancesFromSupabase(),
      fetchReviewsFromSupabase(),
    ]);
    if (frags && frags.length) {
      remoteFragrances = frags;
      renderCards();
    }
    if (revs && revs.length) {
      remoteReviews = revs;
      renderReviews();
    }
  } catch (e) {
    console.warn("Supabase: каталог не загрузился, остаёмся на локальных данных.", e);
  }
}
loadRemoteCatalog();
