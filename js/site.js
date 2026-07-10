(function () {
  const config = window.SITE_CONFIG;
  const currentPage = location.pathname.split("/").pop() || "index.html";

  const navItems = [
    ["index.html", "Início"],
    ["catalogo.html", "Catálogo"],
    ["ferramentas.html", "Ferramentas"],
    ["conta.html", "Minha conta"]
  ];

  function money(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: config.currency
    }).format(value);
  }

  async function api(path, options = {}) {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      credentials: "same-origin",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const body = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body?.error || "Falha na comunicação com o servidor");
      error.status = response.status;
      throw error;
    }
    return body;
  }

  function normalizeProduct(product) {
    return {
      ...product,
      price: Number(product.price), oldPrice: product.oldPrice == null ? null : Number(product.oldPrice),
      category: product.category?.name || product.category || "Geral",
      badge: product.badge || (Number(product.price) === 0 ? "Grátis" : "Digital"),
      icon: product.icon || "◆", features: product.features || []
    };
  }

  let productPromise;
  async function products(force = false) {
    if (!productPromise || force) productPromise = api("/products").then(list => {
      window.PRODUCTS = list.map(normalizeProduct);
      return window.PRODUCTS;
    });
    return productPromise;
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem("baiano_cart")) || []; }
    catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem("baiano_cart", JSON.stringify(cart));
    updateCartCount();
  }

  function addToCart(productId) {
    const product = (window.PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;
    const cart = getCart();
    const found = cart.find(item => item.id === productId);
    if (found) found.quantity += 1;
    else cart.push({ id: productId, quantity: 1 });
    saveCart(cart);
    toast(`${product.name} adicionado ao carrinho.`);
  }

  function removeFromCart(productId) {
    saveCart(getCart().filter(item => item.id !== productId));
  }

  function cartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateCartCount() {
    document.querySelectorAll("[data-cart-count]").forEach(el => {
      el.textContent = cartCount();
    });
  }

  function toast(message) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function injectHeader() {
    const target = document.querySelector("[data-header]");
    if (!target) return;
    const nav = navItems.map(([href, label]) => `
      <a class="${currentPage === href ? "active" : ""}" href="${href}">${label}</a>
    `).join("");

    target.innerHTML = `
      <div class="topbar">Entrega digital automática • Suporte via Discord</div>
      <header class="header">
        <a href="index.html" class="brand">
          <span class="brand-mark"><img src="assets/logo.svg" alt="Logo ${config.brand}"></span>
          <span><strong>${config.brand}</strong><small>${config.tagline}</small></span>
        </a>
        <nav class="nav" id="mainNav">${nav}</nav>
        <div class="header-actions">
          <a class="icon-button" href="catalogo.html" aria-label="Buscar">⌕</a>
          <a class="cart-button" href="carrinho.html" aria-label="Carrinho">
            🛒 <span data-cart-count>0</span>
          </a>
          <button class="menu-button" id="menuButton" aria-label="Abrir menu">☰</button>
        </div>
      </header>
    `;

    document.getElementById("menuButton")?.addEventListener("click", () => {
      document.getElementById("mainNav")?.classList.toggle("open");
    });
  }

  function injectFooter() {
    const target = document.querySelector("[data-footer]");
    if (!target) return;
    target.innerHTML = `
      <footer class="footer">
        <div class="footer-grid container">
          <div>
            <a href="index.html" class="brand footer-brand">
              <span class="brand-mark"><img src="assets/logo.svg" alt="Logo ${config.brand}"></span>
              <span><strong>${config.brand}</strong><small>${config.tagline}</small></span>
            </a>
            <p>Ferramentas digitais para organizar, validar e melhorar projetos próprios com rapidez e segurança.</p>
          </div>
          <div>
            <h4>Navegação</h4>
            <a href="catalogo.html">Catálogo</a>
            <a href="ferramentas.html">Ferramentas</a>
            <a href="conta.html">Minha conta</a>
          </div>
          <div>
            <h4>Suporte</h4>
            <a href="${config.discordUrl}" target="_blank" rel="noreferrer">Discord</a>
            <a href="termos.html">Termos de uso</a>
            <a href="termos.html#privacidade">Privacidade</a>
          </div>
          <div>
            <h4>Segurança</h4>
            <p>Use somente arquivos próprios ou com autorização do titular.</p>
          </div>
        </div>
        <div class="footer-bottom">
          © ${new Date().getFullYear()} ${config.brand}. Todos os direitos reservados.
        </div>
      </footer>
    `;
  }

  function productCard(product) {
    return `
      <article class="product-card">
        <a class="product-cover" href="produto.html?id=${product.id}">
          <span class="product-badge">${product.badge}</span>
          <span class="product-icon">${product.icon}</span>
          <span class="cover-lines"></span>
        </a>
        <div class="product-info">
          <span class="product-category">${product.category}</span>
          <h3><a href="produto.html?id=${product.id}">${product.name}</a></h3>
          <p>${product.description}</p>
          <div class="product-bottom">
            <div class="price">
              ${product.oldPrice ? `<del>${money(product.oldPrice)}</del>` : ""}
              <strong>${product.price === 0 ? "Grátis" : money(product.price)}</strong>
            </div>
            <button class="mini-add" data-add="${product.id}" aria-label="Adicionar">+</button>
          </div>
        </div>
      </article>
    `;
  }

  function bindAddButtons() {
    document.querySelectorAll("[data-add]").forEach(button => {
      button.addEventListener("click", () => addToCart(button.dataset.add));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectHeader();
    injectFooter();
    updateCartCount();
    bindAddButtons();
  });

  window.Store = {
    money, api, products, normalizeProduct, getCart, saveCart, addToCart, removeFromCart,
    updateCartCount, toast, productCard, bindAddButtons
  };
})();
