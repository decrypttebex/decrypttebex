const crypto=require('crypto'); const prisma=require('../database/prisma');
async function createOrder(userId,input){
 const ids=[...new Set(input.items.map(x=>x.productId))]; const products=await prisma.product.findMany({where:{id:{in:ids},active:true}}); const map=new Map(products.map(p=>[p.id,p]));
 const lines=input.items.map(x=>{const p=map.get(x.productId); const q=Math.max(1,Math.min(20,Number(x.quantity)||1)); if(!p) throw Object.assign(new Error('Produto inválido'),{status:400}); return {productId:p.id,quantity:q,unitPrice:p.price,total:Number(p.price)*q};});
 let subtotal=lines.reduce((s,x)=>s+x.total,0),discount=0,coupon=null;
 if(input.coupon){coupon=await prisma.coupon.findFirst({where:{code:input.coupon.toUpperCase(),active:true,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]}}); if(coupon&&(!coupon.maxUses||coupon.usedCount<coupon.maxUses)) discount=subtotal*coupon.percent/100;}
 const order=await prisma.order.create({data:{number:`BT-${Date.now()}-${crypto.randomInt(100,999)}`,userId,subtotal,discount,total:Math.max(0,subtotal-discount),couponId:coupon?.id,items:{create:lines}},include:{items:{include:{product:true}}}});
 return order;
}
module.exports={createOrder};
