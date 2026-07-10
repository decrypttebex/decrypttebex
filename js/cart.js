document.addEventListener("DOMContentLoaded", () => {
  const target = document.querySelector("#cartContent");

  function render() {
    const cart = Store.getCart();
    if (!cart.length) {
      target.innerHTML = `
        <div class="empty-cart">
          <span>🛒</span>
          <h2>Seu carrinho está vazio</h2>
          <p>Escolha uma ferramenta e volte aqui para finalizar.</p>
          <a class="button primary" href="catalogo.html">Explorar catálogo</a>
        </div>`;
      return;
    }

    let subtotal = 0;
    const rows = cart.map(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      if (!product) return "";
      subtotal += product.price * item.quantity;
      return `
        <div class="cart-row">
          <div class="cart-thumb">${product.icon}</div>
          <div class="cart-main">
            <span>${product.category}</span>
            <strong>${product.name}</strong>
          </div>
          <div class="quantity">
            <button data-minus="${product.id}">−</button>
            <b>${item.quantity}</b>
            <button data-plus="${product.id}">+</button>
          </div>
          <strong>${Store.money(product.price * item.quantity)}</strong>
          <button class="remove-button" data-remove="${product.id}">✕</button>
        </div>`;
    }).join("");

    target.innerHTML = `
      <div class="cart-layout">
        <div class="cart-list">${rows}</div>
        <aside class="summary-card">
          <h3>Resumo do pedido</h3>
          <div><span>Subtotal</span><strong>${Store.money(subtotal)}</strong></div>
          <div><span>Entrega digital</span><strong>Grátis</strong></div>
          <label class="coupon">
            <span>Cupom</span>
            <div><input placeholder="DECRYPT10"><button id="couponButton">Aplicar</button></div>
          </label>
          <hr>
          <div class="summary-total"><span>Total</span><strong>${Store.money(subtotal)}</strong></div>
          <a class="button primary full large" href="checkout.html">Ir para pagamento</a>
          <small>Pagamento seguro e liberação após confirmação.</small>
        </aside>
      </div>`;

    document.querySelectorAll("[data-plus]").forEach(btn => btn.onclick = () => {
      const cart = Store.getCart();
      cart.find(i => i.id === btn.dataset.plus).quantity++;
      Store.saveCart(cart); render();
    });
    document.querySelectorAll("[data-minus]").forEach(btn => btn.onclick = () => {
      const cart = Store.getCart();
      const item = cart.find(i => i.id === btn.dataset.minus);
      item.quantity--;
      Store.saveCart(cart.filter(i => i.quantity > 0)); render();
    });
    document.querySelectorAll("[data-remove]").forEach(btn => btn.onclick = () => {
      Store.removeFromCart(btn.dataset.remove); render();
    });
    document.querySelector("#couponButton").onclick = () => {
      const code = document.querySelector(".coupon input").value.trim().toUpperCase();
      if (!code) return Store.toast("Informe o código do cupom.");
      localStorage.setItem("decrypt_coupon", code);
      Store.toast("Cupom será validado pelo servidor ao criar o pedido.");
    };
  }

  render();
});
