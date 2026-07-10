const {PrismaClient}=require('@prisma/client'); const prisma=new PrismaClient();
const products=require('../data/products.json');
(async()=>{for(const p of products){const category=await prisma.category.upsert({where:{slug:p.category.slug},update:{name:p.category.name},create:p.category});await prisma.product.upsert({where:{slug:p.slug},update:{...p,category:undefined,categoryId:category.id},create:{...p,category:undefined,categoryId:category.id}});}console.log('Catálogo inicial criado.');})().finally(()=>prisma.$disconnect());
