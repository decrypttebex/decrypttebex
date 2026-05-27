let todosConteudos = [];
let categoriaAtual = 'todos';
let usuarioVinculado = null;

const conteudosExemplo = [
    {
        id: 1,
        categoria: 'mapas',
        nome: 'Mapa de Los Santos Atualizado',
        descricao: 'Mapa completo de Los Santos com novas áreas e otimizado para FPS',
        downloadUrl: 'https://exemplo.com/download/mapa1.zip',
        imagem: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=fivem%20los%20santos%20map&image_size=square_hd'
    },
    {
        id: 2,
        categoria: 'scripts',
        nome: 'ESX Jobs System',
        descricao: 'Sistema completo de jobs para ESX com múltiplas profissões',
        downloadUrl: 'https://exemplo.com/download/script1.zip',
        imagem: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=fivem%20esx%20script%20interface&image_size=square_hd'
    },
    {
        id: 3,
        categoria: 'carros',
        nome: 'Ferrari 488 GTB',
        descricao: 'Carro esportivo de alta qualidade para FiveM',
        downloadUrl: 'https://exemplo.com/download/carro1.zip',
        imagem: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=ferrari%20488%20gtb%20fivem&image_size=square_hd'
    },
    {
        id: 4,
        categoria: 'roupas',
        nome: 'Pacote de Roupas Streetwear',
        descricao: 'Coleção completa de roupas modernas para personagens',
        downloadUrl: 'https://exemplo.com/download/roupas1.zip',
        imagem: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=fivem%20clothing%20pack%20streetwear&image_size=square_hd'
    },
    {
        id: 5,
        categoria: 'mods',
        nome: 'Realistic Traffic Mod',
        descricao: 'Mod para tráfego mais realista em Los Santos',
        downloadUrl: 'https://exemplo.com/download/mod1.zip',
        imagem: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=fivem%20traffic%20mod%20realistic&image_size=square_hd'
    },
    {
        id: 6,
        categoria: 'mapas',
        nome: 'Mega Shopping Center',
        descricao: 'Shopping center completo com lojas e estacionamento',
        downloadUrl: 'https://exemplo.com/download/mapa2.zip',
        imagem: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=fivem%20shopping%20mall%20interior&image_size=square_hd'
    }
];

function processarUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    const usuarioParam = params.get('usuario');
    if (usuarioParam) {
        try {
            const usuario = JSON.parse(decodeURIComponent(usuarioParam));
            salvarUsuarioLocal(usuario);
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
            console.error('Erro ao processar usuário:', e);
        }
    }
    
    const erroParam = params.get('erro');
    if (erroParam) {
        alert('Erro na autenticação. Tente novamente.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function verificarUsuarioLocal() {
    const usuarioSalvo = localStorage.getItem('usuarioDiscord');
    if (usuarioSalvo) {
        usuarioVinculado = JSON.parse(usuarioSalvo);
        atualizarInterface();
    }
}

function salvarUsuarioLocal(usuario) {
    localStorage.setItem('usuarioDiscord', JSON.stringify(usuario));
    usuarioVinculado = usuario;
    atualizarInterface();
}

function atualizarInterface() {
    console.log('atualizarInterface() chamado');
    const heroActions = document.getElementById('hero-actions');
    const conteudosSection = document.querySelector('.conteudos');
    const categoriesSection = document.querySelector('.categories');
    const featuresSection = document.querySelector('.features');

    if (usuarioVinculado) {
        const avatarUrl = usuarioVinculado.avatar 
            ? `https://cdn.discordapp.com/avatars/${usuarioVinculado.discordId}/${usuarioVinculado.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        heroActions.innerHTML = `
            <div class="usuario-info-com-avatar">
                <img src="${avatarUrl}" alt="Avatar" class="usuario-avatar">
                <span class="usuario-info">Bem-vindo, <strong>${usuarioVinculado.username}</strong>!</span>
            </div>
            <button id="btn-desvincular" class="btn btn-secondary">Sair</button>
        `;
        
        document.getElementById('btn-desvincular')?.addEventListener('click', desvincularUsuario);
        
        conteudosSection?.classList.remove('oculto');
        categoriesSection?.classList.remove('oculto');
        featuresSection?.classList.remove('oculto');
        
        carregarConteudos();
    } else {
        // Se o botão já existir, só adicionar o event listener
        let btnLogin = document.getElementById('btn-login-discord');
        
        if (!btnLogin) {
            heroActions.innerHTML = `
                <button id="btn-login-discord" class="btn btn-discord">
                    <svg class="discord-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Entrar com Discord
                </button>
            `;
            btnLogin = document.getElementById('btn-login-discord');
        }
        
        console.log('Botão login encontrado:', btnLogin);
        // Remover event listener antigo e adicionar novo
        const newBtn = btnLogin.cloneNode(true);
        btnLogin.parentNode.replaceChild(newBtn, btnLogin);
        newBtn.addEventListener('click', iniciarLoginDiscord);
        
        conteudosSection?.classList.add('oculto');
        categoriesSection?.classList.add('oculto');
        featuresSection?.classList.add('oculto');
    }
}

function desvincularUsuario() {
    localStorage.removeItem('usuarioDiscord');
    usuarioVinculado = null;
    atualizarInterface();
}

async function iniciarLoginDiscord() {
    console.log('iniciarLoginDiscord() chamado!');
    try {
        const response = await fetch('/api/auth/discord');
        const data = await response.json();
        console.log('Dados recebidos:', data);
        window.location.href = data.url;
    } catch (err) {
        console.error('Erro ao iniciar login:', err);
        alert('Erro ao iniciar login com Discord. Verifique as configurações.');
    }
}

window.iniciarLoginDiscord = iniciarLoginDiscord;

async function carregarConteudos() {
    try {
        const response = await fetch('/api/conteudos');
        todosConteudos = await response.json();
        if (todosConteudos.length === 0) {
            todosConteudos = conteudosExemplo;
        }
    } catch (err) {
        console.error('Erro ao carregar conteúdos:', err);
        todosConteudos = conteudosExemplo;
    }
    exibirConteudos();
}

function exibirConteudos() {
    const container = document.getElementById('conteudos-grid');
    let conteudosFiltrados = todosConteudos;

    if (categoriaAtual !== 'todos') {
        conteudosFiltrados = todosConteudos.filter(c => c.categoria === categoriaAtual);
    }

    if (conteudosFiltrados.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1; padding: 40px 0;">Nenhum conteúdo encontrado nesta categoria.</p>';
        return;
    }

    container.innerHTML = conteudosFiltrados.map(conteudo => `
        <div class="conteudo-card">
            <img src="${conteudo.imagem}" alt="${conteudo.nome}" class="conteudo-imagem" loading="lazy">
            <div class="conteudo-info">
                <h3 class="conteudo-nome">${conteudo.nome}</h3>
                <p class="conteudo-descricao">${conteudo.descricao}</p>
                <a href="${conteudo.downloadUrl}" target="_blank" class="btn-download">
                    Baixar
                </a>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada!');
    
    const botoesCategoria = document.querySelectorAll('.category-btn');
    
    botoesCategoria.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesCategoria.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');
            categoriaAtual = botao.dataset.categoria;
            exibirConteudos();
        });
    });

    processarUrlParams();
    verificarUsuarioLocal();
});
