document.addEventListener("DOMContentLoaded", async () => {
  const key=new URLSearchParams(location.search).get("id");
  try{
    const list=await Store.products(), product=list.find(p=>p.id===key||p.slug===key)||list[0]; if(!product)throw new Error("Produto não encontrado");
    document.title=`${product.name} | ${SITE_CONFIG.brand}`; document.querySelector("#productPage").innerHTML=`<div class="product-detail-grid"><div class="product-visual"><span class="product-badge">${product.badge}</span><span class="detail-icon">${product.icon}</span></div><div class="product-copy"><span class="eyebrow">${product.category}</span><h1>${product.name}</h1><p class="lead">${product.description}</p><div class="detail-price">${product.oldPrice?`<del>${Store.money(product.oldPrice)}</del>`:""}<strong>${product.price===0?"Grátis":Store.money(product.price)}</strong><span>acesso digital</span></div><div class="detail-actions"><button class="button primary large" id="buyNow">Comprar agora</button><button class="button secondary large" data-add="${product.id}">Adicionar ao carrinho</button></div></div></div>`;
    Store.bindAddButtons(); document.querySelector("#buyNow").onclick=()=>{Store.addToCart(product.id);location.href="checkout.html";}; const related=document.querySelector("#relatedProducts");related.innerHTML=list.filter(p=>p.id!==product.id).slice(0,3).map(Store.productCard).join("");Store.bindAddButtons();
  }catch(e){document.querySelector("#productPage").innerHTML=`<div class="empty-state"><strong>${e.message}</strong></div>`;}
});
