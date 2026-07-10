document.addEventListener("DOMContentLoaded", async () => {
  const grid=document.querySelector("#catalogGrid"),search=document.querySelector("#catalogSearch"),chips=[...document.querySelectorAll("[data-category]")]; let selected="Todos", products=[];
  function render(){const term=(search.value||"").trim().toLowerCase();const filtered=products.filter(p=>[p.name,p.category,p.description].join(" ").toLowerCase().includes(term)&&(selected==="Todos"||p.category===selected));grid.innerHTML=filtered.length?filtered.map(Store.productCard).join(""):`<div class="empty-state"><strong>Nenhum produto encontrado.</strong></div>`;document.querySelector("#resultCount").textContent=`${filtered.length} produto(s)`;Store.bindAddButtons();}
  try{products=await Store.products();render();}catch(e){grid.innerHTML=`<div class="empty-state"><strong>Banco de dados indisponível.</strong><span>${e.message}</span></div>`;}
  chips.forEach(chip=>chip.addEventListener("click",()=>{chips.forEach(c=>c.classList.remove("active"));chip.classList.add("active");selected=chip.dataset.category;render();})); search.addEventListener("input",render);
});
