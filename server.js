require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Na Vercel, a pasta do projeto é somente leitura.
// Por isso usamos /tmp para salvar dados temporários.
const DADOS_FILE = process.env.VERCEL
  ? path.join("/tmp", "dados.json")
  : path.join(__dirname, "dados.json");

const DADOS_ORIGINAL = path.join(__dirname, "dados.json");

// Configurações do Discord OAuth2
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI =
  process.env.DISCORD_REDIRECT_URI ||
  `http://localhost:${PORT}/api/auth/discord/callback`;

console.log("=== Variáveis de Ambiente Carregadas ===");
console.log("DISCORD_CLIENT_ID:", DISCORD_CLIENT_ID || "NÃO CONFIGURADO");
console.log("DISCORD_CLIENT_SECRET:", DISCORD_CLIENT_SECRET ? "CONFIGURADO" : "NÃO CONFIGURADO");
console.log("DISCORD_REDIRECT_URI:", DISCORD_REDIRECT_URI);
console.log("DADOS_FILE:", DADOS_FILE);
console.log("========================================");

app.use(express.json());
app.use(cors());

// Servir frontend
app.use(express.static(path.join(__dirname, "public")));

// Inicializar banco de dados
async function initDB() {
  try {
    await fs.access(DADOS_FILE);
    console.log("✅ Banco de dados encontrado:", DADOS_FILE);
  } catch (err) {
    console.log("⚠️ Banco de dados não encontrado, criando...");

    let dadosPadrao = {
      conteudos: [],
      downloads: [],
      usuarios: []
    };

    // Se existir dados.json original no projeto, copia ele para /tmp na Vercel
    try {
      const dadosExistente = await fs.readFile(DADOS_ORIGINAL, "utf8");
      dadosPadrao = JSON.parse(dadosExistente);
      console.log("✅ dados.json original carregado");
    } catch (e) {
      console.log("⚠️ Nenhum dados.json original encontrado, usando padrão");
    }

    await fs.writeFile(DADOS_FILE, JSON.stringify(dadosPadrao, null, 2), "utf8");
    console.log("✅ Banco de dados criado em:", DADOS_FILE);
  }
}

// Ler dados
async function lerDados() {
  try {
    await initDB();
    const dados = await fs.readFile(DADOS_FILE, "utf8");
    return JSON.parse(dados);
  } catch (err) {
    console.error("❌ Erro ao ler dados:", err.message);
    return {
      conteudos: [],
      downloads: [],
      usuarios: []
    };
  }
}

// Escrever dados
async function escreverDados(dados) {
  try {
    await fs.writeFile(DADOS_FILE, JSON.stringify(dados, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("❌ Erro ao escrever dados:", err.message);
    throw err;
  }
}

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Status da API
app.get("/api/status", async (req, res) => {
  res.json({
    online: true,
    vercel: !!process.env.VERCEL,
    dadosFile: DADOS_FILE,
    discordClientId: !!DISCORD_CLIENT_ID,
    discordClientSecret: !!DISCORD_CLIENT_SECRET,
    discordRedirectUri: DISCORD_REDIRECT_URI
  });
});

// Listar conteúdos
app.get("/api/conteudos", async (req, res) => {
  try {
    const dados = await lerDados();
    const { categoria } = req.query;

    let conteudos = dados.conteudos || [];

    if (categoria) {
      conteudos = conteudos.filter((c) => c.categoria === categoria);
    }

    res.json(conteudos);
  } catch (err) {
    console.error("Erro em /api/conteudos:", err.message);
    res.status(500).json({ erro: "Erro ao ler dados" });
  }
});

// Adicionar conteúdo
app.post("/api/conteudos", async (req, res) => {
  try {
    const dados = await lerDados();

    if (!Array.isArray(dados.conteudos)) {
      dados.conteudos = [];
    }

    const conteudo = {
      id: Date.now(),
      ...req.body,
      criadoEm: new Date().toISOString()
    };

    dados.conteudos.push(conteudo);
    await escreverDados(dados);

    res.json({ sucesso: true, conteudo });
  } catch (err) {
    console.error("Erro ao salvar conteúdo:", err.message);
    res.status(500).json({ erro: "Erro ao salvar dados" });
  }
});

// Iniciar login Discord
app.get("/api/auth/discord", (req, res) => {
  console.log("=== /api/auth/discord chamado ===");
  console.log("DISCORD_CLIENT_ID:", DISCORD_CLIENT_ID);
  console.log("DISCORD_REDIRECT_URI:", DISCORD_REDIRECT_URI);

  if (!DISCORD_CLIENT_ID) {
    return res.status(500).json({
      erro: "DISCORD_CLIENT_ID não configurado"
    });
  }

  if (!DISCORD_REDIRECT_URI) {
    return res.status(500).json({
      erro: "DISCORD_REDIRECT_URI não configurado"
    });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const scope = "identify email";

  const authUrl = new URL("https://discord.com/api/oauth2/authorize");
  authUrl.searchParams.set("client_id", DISCORD_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", DISCORD_REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "none");

  const url = authUrl.toString();

  console.log("URL gerada:", url);

  res.json({ url, state });
});

// Callback Discord
app.get("/api/auth/discord/callback", async (req, res) => {
  console.log("=== Callback do Discord chamado ===");
  console.log("Query params:", req.query);
  console.log("DISCORD_CLIENT_ID:", DISCORD_CLIENT_ID);
  console.log("DISCORD_REDIRECT_URI:", DISCORD_REDIRECT_URI);

  try {
    const { code } = req.query;

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI) {
      console.log("❌ Variáveis Discord faltando");
      return res.redirect("/?erro=config");
    }

    if (!code) {
      console.log("❌ Código não recebido");
      return res.redirect("/?erro=auth");
    }

    console.log("✅ Código recebido:", code);

    console.log("🔄 Solicitando token do Discord...");

    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    console.log("✅ Token recebido!");

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    console.log("🔄 Buscando dados do usuário...");

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const discordUser = userResponse.data;

    console.log("✅ Dados do usuário:", discordUser.username);

    const dados = await lerDados();

    if (!Array.isArray(dados.usuarios)) {
      dados.usuarios = [];
    }

    let usuario = dados.usuarios.find((u) => u.discordId === discordUser.id);

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    if (!usuario) {
      usuario = {
        id: Date.now(),
        discordId: discordUser.id,
        username: discordUser.global_name || discordUser.username,
        usuarioDiscord: discordUser.username,
        discriminator: discordUser.discriminator || "0",
        email: discordUser.email || null,
        avatar: discordUser.avatar,
        avatarUrl,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
        dataVinculacao: new Date().toISOString(),
        ultimoLogin: new Date().toISOString()
      };

      dados.usuarios.push(usuario);
      await escreverDados(dados);

      console.log("✅ Novo usuário criado");
    } else {
      usuario.username = discordUser.global_name || discordUser.username;
      usuario.usuarioDiscord = discordUser.username;
      usuario.discriminator = discordUser.discriminator || usuario.discriminator || "0";
      usuario.email = discordUser.email || usuario.email;
      usuario.avatar = discordUser.avatar;
      usuario.avatarUrl = avatarUrl;
      usuario.accessToken = access_token;
      usuario.refreshToken = refresh_token;
      usuario.tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
      usuario.ultimoLogin = new Date().toISOString();

      await escreverDados(dados);

      console.log("✅ Usuário atualizado com novo token");
    }

    const usuarioSeguro = {
      id: usuario.id,
      discordId: usuario.discordId,
      username: usuario.username,
      usuarioDiscord: usuario.usuarioDiscord,
      discriminator: usuario.discriminator,
      email: usuario.email,
      avatar: usuario.avatar,
      avatarUrl: usuario.avatarUrl,
      dataVinculacao: usuario.dataVinculacao,
      ultimoLogin: usuario.ultimoLogin
    };

    console.log("🔄 Redirecionando para o frontend...");

    res.redirect(`/?usuario=${encodeURIComponent(JSON.stringify(usuarioSeguro))}`);
  } catch (err) {
    console.error("❌ Erro na autenticação OAuth2:");
    console.error("Mensagem:", err.message);

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Dados:", err.response.data);
    }

    res.redirect("/?erro=auth");
  }
});

// Verificar usuário
app.get("/api/verificar-usuario/:discordId", async (req, res) => {
  try {
    const { discordId } = req.params;
    const dados = await lerDados();

    const usuario = (dados.usuarios || []).find((u) => u.discordId === discordId);

    if (usuario) {
      const usuarioSeguro = {
        id: usuario.id,
        discordId: usuario.discordId,
        username: usuario.username,
        usuarioDiscord: usuario.usuarioDiscord,
        discriminator: usuario.discriminator,
        email: usuario.email,
        avatar: usuario.avatar,
        avatarUrl: usuario.avatarUrl,
        dataVinculacao: usuario.dataVinculacao,
        ultimoLogin: usuario.ultimoLogin
      };

      res.json({ vinculado: true, usuario: usuarioSeguro });
    } else {
      res.json({ vinculado: false });
    }
  } catch (err) {
    console.error("Erro ao verificar usuário:", err.message);
    res.status(500).json({ erro: "Erro ao verificar usuário" });
  }
});

// Buscar downloads
app.get("/api/downloads", async (req, res) => {
  try {
    const dados = await lerDados();
    res.json(dados.downloads || []);
  } catch (err) {
    console.error("Erro em /api/downloads:", err.message);
    res.status(500).json({ erro: "Erro ao ler dados" });
  }
});

// Rota fallback para frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Inicializar DB
initDB().then(() => {
  console.log("✅ Banco inicializado");

  // Na Vercel, exportamos o app.
  // Localmente, iniciamos com app.listen.
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`✅ Servidor FiveM rodando em http://localhost:${PORT}`);
    });
  }
});

module.exports = app;