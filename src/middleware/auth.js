const config=require('../config');
function requireAuth(req,res,next){ if(!req.user) return res.status(401).json({error:'Autenticação necessária'}); next(); }
function requireAdmin(req,res,next){ if(!req.user || !config.adminDiscordIds.includes(req.user.discord?.discordId)) return res.status(403).json({error:'Acesso negado'}); next(); }
module.exports={requireAuth,requireAdmin};
