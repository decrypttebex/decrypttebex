document.addEventListener("DOMContentLoaded", async () => {
  const featured = document.querySelector("#featuredProducts");
  try {
    const products = await Store.products();
    if (featured) featured.innerHTML = products.slice(0, 4).map(Store.productCard).join("");
    Store.bindAddButtons();
  } catch (error) {
    if (featured) featured.innerHTML = `<div class="empty-state"><strong>Catálogo indisponível.</strong><span>${error.message}</span></div>`;
  }
  document.querySelectorAll("[data-faq]").forEach(button => button.addEventListener("click", () => button.parentElement.classList.toggle("open")));
});
