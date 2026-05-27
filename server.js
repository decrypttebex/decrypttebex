require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const DADOS_FILE = path.join(__dirname, 'dados.json');

// Configurações do Discord OAuth2 (você precisará criar um aplicativo no Discord Developers)
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || `http://localhost:${PORT}/api/auth/discord/callback`;

console.log('=== Variáveis de Ambiente Carregadas ===');
console.log('DISCORD_CLIENT_ID:', DISCORD_CLIENT_ID);
console.log('DISCORD_REDIRECT_URI:', DISCORD_REDIRECT_URI);
console.log('========================================');

// Inicializar o banco de dados
async function initDB() {
    try {
        await fs.access(DADOS_FILE);
    } catch (err) {
        // Arquivo não existe, criar com dados padrão
        const dadosPadrao = {
            conteudos: [],
            downloads: [],
            usuarios: []
        };
        await fs.writeFile(DADOS_FILE, JSON.stringify(dadosPadrao, null, 2));
    }
}

// Ler dados do arquivo
async function lerDados() {
    const dados = await fs.readFile(DADOS_FILE, 'utf8');
    return JSON.parse(dados);
}

// Escrever dados no arquivo
async function escreverDados(dados) {
    await fs.writeFile(DADOS_FILE, JSON.stringify(dados, null, 2));
}

app.use(express.json());
app.use(cors());

// Servir o frontend (arquivos HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para listar todos os conteúdos
app.get('/api/conteudos', async (req, res) => {
    try {
        const dados = await lerDados();
        const { categoria } = req.query;
        let conteudos = dados.conteudos;
        if (categoria) {
            conteudos = conteudos.filter(c => c.categoria === categoria);
        }
        res.json(conteudos);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao ler dados' });
    }
});

// Rota para adicionar conteúdo (adm)
app.post('/api/conteudos', async (req, res) => {
    try {
        const dados = await lerDados();
        const conteudo = {
            id: Date.now(),
            ...req.body
        };
        dados.conteudos.push(conteudo);
        await escreverDados(dados);
        res.json({ sucesso: true, conteudo });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao salvar dados' });
    }
});

// Rota para iniciar o fluxo OAuth2 do Discord
app.get('/api/auth/discord', (req, res) => {
    console.log('=== /api/auth/discord chamado ===');
    console.log('DISCORD_CLIENT_ID:', DISCORD_CLIENT_ID);
    console.log('DISCORD_REDIRECT_URI:', DISCORD_REDIRECT_URI);
    
    if (!DISCORD_CLIENT_ID) {
        return res.status(500).json({ erro: 'DISCORD_CLIENT_ID não configurado' });
    }
    
    const state = crypto.randomBytes(16).toString('hex');
    const scope = 'identify email';
    
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', DISCORD_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    
    const url = authUrl.toString();
    console.log('URL gerada:', url);
    
    res.json({ url, state });
});

// Rota de callback do OAuth2 Discord
app.get('/api/auth/discord/callback', async (req, res) => {
    console.log('=== Callback do Discord chamado ===');
    console.log('Query params:', req.query);
    console.log('DISCORD_CLIENT_ID:', DISCORD_CLIENT_ID);
    console.log('DISCORD_REDIRECT_URI:', DISCORD_REDIRECT_URI);
    
    try {
        const { code } = req.query;
        
        if (!code) {
            console.log('❌ Código não recebido');
            return res.redirect('/?erro=auth');
        }

        console.log('✅ Código recebido:', code);

        // Trocar o código por um token de acesso
        console.log('🔄 Solicitando token do Discord...');
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: DISCORD_REDIRECT_URI
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('✅ Token recebido!');
        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Obter informações do usuário Discord
        console.log('🔄 Buscando dados do usuário...');
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const discordUser = userResponse.data;
        console.log('✅ Dados do usuário:', discordUser.username);
        
        const dados = await lerDados();

        // Verificar se o usuário já existe
        let usuario = dados.usuarios.find(u => u.discordId === discordUser.id);

        if (!usuario) {
            // Criar novo usuário
            usuario = {
                id: Date.now(),
                discordId: discordUser.id,
                username: `${discordUser.username}#${discordUser.discriminator || '0'}`,
                email: discordUser.email || null,
                avatar: discordUser.avatar,
                accessToken: access_token,
                refreshToken: refresh_token,
                tokenExpiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
                dataVinculacao: new Date().toISOString()
            };
            dados.usuarios.push(usuario);
            await escreverDados(dados);
            console.log('✅ Novo usuário criado');
        } else {
            // Atualizar token e email do usuário existente
            usuario.email = discordUser.email || usuario.email;
            usuario.accessToken = access_token;
            usuario.refreshToken = refresh_token;
            usuario.tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
            await escreverDados(dados);
            console.log('✅ Usuário atualizado com novo token');
        }

        // Redirecionar de volta para o frontend com os dados do usuário
        console.log('🔄 Redirecionando para o frontend...');
        res.redirect(`/?usuario=${encodeURIComponent(JSON.stringify(usuario))}`);
    } catch (err) {
        console.error('❌ Erro na autenticação OAuth2:');
        console.error('Mensagem:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Dados:', err.response.data);
        }
        res.redirect('/?erro=auth');
    }
});

// Rota para verificar usuário por ID (compatibilidade)
app.get('/api/verificar-usuario/:discordId', async (req, res) => {
    try {
        const { discordId } = req.params;
        const dados = await lerDados();
        
        const usuario = dados.usuarios.find(u => u.discordId === discordId);
        
        if (usuario) {
            res.json({ vinculado: true, usuario });
        } else {
            res.json({ vinculado: false });
        }
    } catch (err) {
        console.error('Erro ao verificar usuário:', err);
        res.status(500).json({ erro: 'Erro ao verificar usuário' });
    }
});

// Rota para buscar downloads
app.get('/api/downloads', async (req, res) => {
    try {
        const dados = await lerDados();
        res.json(dados.downloads);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao ler dados' });
    }
});

// Inicializar DB e iniciar servidor
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Servidor FiveM rodando em http://localhost:${PORT}`);
    });
});
