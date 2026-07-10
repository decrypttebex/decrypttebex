const { PrismaClient } = require('@prisma/client');
module.exports = new PrismaClient({log: process.env.NODE_ENV==='development'?['warn','error']:['error']});
