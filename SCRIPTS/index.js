// CONFIGURAÇÃO
const API_URL = "https://nowplace.onrender.com";


// VARIÁVEIS
let stream = null;
let passoAtual = 1;
let fotoAmbiente = localStorage.getItem("fotoAmbiente") || "";
let fotoSelfie = localStorage.getItem("fotoSelfie") || "";
let localAtual = JSON.parse(localStorage.getItem("localAtual")) || {
    lat: null,
    lng: null,
    endereco: ""
};


// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
    inicializarTema();
    inicializarUsuario();

    if (document.getElementById("passo_1")) {
        inicializarPassos();
        inicializarContador();
        inicializarDragDrop();
        inicializarPostar();
    }

    if (document.getElementById("localizacao-label")) {
        iniciarLocalizacao();
    }

    if (document.getElementById("posts-container")) {
        carregarFeedPrincipal();
    }

    if (document.getElementById("galeria")) {
        carregarGaleria();
    }
});


// TEMA
function inicializarTema() {
    const botaoTema = document.getElementById("mudar-tema");
    if (!botaoTema) return;

    botaoTema.addEventListener("click", () => {
        document.body.classList.toggle("tema-escuro");
        botaoTema.classList.toggle("dia");
        botaoTema.classList.toggle("noite");
    });
}


// PASSOS
function inicializarPassos() {
    const passo1 = document.getElementById("passo_1");
    const passo2 = document.getElementById("passo_2");
    const passo3 = document.getElementById("passo_3");
    if (!passo1 || !passo2 || !passo3) return;
    mostrarPasso();
    const btnFoto1 = document.getElementById("btn-foto1");
    if (btnFoto1) {
        btnFoto1.addEventListener("click", () => {
            tirarFoto("video", "canvas", "fotoAmbiente");
        });
    }
    const btnFoto2 = document.getElementById("btn-foto2");
    if (btnFoto2) {
        btnFoto2.addEventListener("click", () => {
            tirarFoto("video2", "canvas2", "fotoSelfie");
        });
    }
}


// MOSTRAR PASSO
function mostrarPasso() {
    const passos = document.querySelectorAll(".passo");
    passos.forEach(passo => passo.classList.remove("ativo"));
    const passoAtivo = document.getElementById(`passo_${passoAtual}`);
    if (passoAtivo) {
        passoAtivo.classList.add("ativo");
    }
    const etapas = document.querySelectorAll(".etapa");
    etapas.forEach((etapa, index) => {
        etapa.classList.toggle("ativa", index < passoAtual);
    });
    if (passoAtual === 1) iniciarCamera("video", false);
    if (passoAtual === 2) iniciarCamera("video2", true);
    if (passoAtual === 3) mostrarFotos();
}


// PRÓXIMO PASSO
function proximoPasso() {
    if (passoAtual === 1 && !localStorage.getItem("fotoAmbiente")) {
        alert("Tire a foto do ambiente primeiro.");
        return;
    }
    if (passoAtual === 2 && !localStorage.getItem("fotoSelfie")) {
        alert("Tire sua selfie primeiro.");
        return;
    }
    if (passoAtual < 3) {
        pararCamera();
        passoAtual++;
        mostrarPasso();
    }
}
window.proximoPasso = proximoPasso;


// CÂMERA
function pararCamera() {
    if (!stream) return;
    stream.getTracks().forEach(track => track.stop());
    stream = null;
}

async function iniciarCamera(videoId, selfie = false) {
    pararCamera();
    const video = document.getElementById(videoId);
    if (!video) return;

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: selfie ? "user" : "environment" },
            audio: false
        });
        video.srcObject = stream;
        video.style.display = "block";
        await video.play();
    } catch (erro) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video.srcObject = stream;
            video.style.display = "block";
            await video.play();
        } catch (erro2) {
            alert("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
        }
    }
}


// TIRAR FOTO
async function tirarFoto(videoId, canvasId, chave) {
    const video = document.getElementById(videoId);
    const canvas = document.getElementById(canvasId);
    if (!video || !canvas) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert("A câmera ainda está carregando. Aguarde um instante.");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const contexto = canvas.getContext("2d");

    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    const fotoOriginal = canvas.toDataURL("image/jpeg", 0.8);
    const fotoComprimida = await comprimirImagem(fotoOriginal);

    localStorage.setItem(chave, fotoComprimida);

    if (chave === "fotoAmbiente") fotoAmbiente = fotoComprimida;
    if (chave === "fotoSelfie") fotoSelfie = fotoComprimida;

    video.style.display = "none";
    canvas.style.display = "block";
    pararCamera();
}


// COMPRIMIR FOTO
function comprimirImagem(dataURL) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxWidth = 700;
            const proporcao = Math.min(1, maxWidth / img.width);

            canvas.width = img.width * proporcao;
            canvas.height = img.height * proporcao;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL("image/jpeg", 0.65));
        };
        img.src = dataURL;
    });
}


// MOSTRAR FOTOS NO PASSO 3
function mostrarFotos() {
    const ambiente = document.getElementById("foto-ambiente");
    const selfie = document.getElementById("foto-selfie");
    if (!ambiente || !selfie) return;

    fotoAmbiente = localStorage.getItem("fotoAmbiente") || "";
    fotoSelfie = localStorage.getItem("fotoSelfie") || "";

    ambiente.src = fotoAmbiente;
    selfie.src = fotoSelfie;
}


// LOCALIZAÇÃO
function iniciarLocalizacao() {
    const label = document.getElementById("localizacao-label");
    if (!label) return;

    if (!navigator.geolocation) {
        label.textContent = "Geolocalização não suportada";
        return;
    }

    label.textContent = "Obtendo localização...";

    navigator.geolocation.getCurrentPosition(
        async position => {
            localAtual.lat = position.coords.latitude;
            localAtual.lng = position.coords.longitude;

            try {
                const endereco = await buscarEndereco(localAtual.lat, localAtual.lng);
                localAtual.endereco = endereco;
                label.textContent = endereco;
            } catch (erro) {
                localAtual.endereco = "Localização obtida";
                label.textContent = "Localização obtida";
            }

            localStorage.setItem("localAtual", JSON.stringify(localAtual));
        },
        erro => {
            label.textContent = "Não foi possível obter a localização";
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}


// BUSCAR ENDEREÇO
async function buscarEndereco(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=pt-BR`;
    const resposta = await fetch(url);

    if (!resposta.ok) throw new Error("Erro ao buscar endereço");

    const dados = await resposta.json();
    const endereco = dados.address || {};

    return (
        endereco.city ||
        endereco.town ||
        endereco.municipality ||
        endereco.village ||
        endereco.state ||
        "Localização atual"
    );
}


// CONTADOR
function inicializarContador() {
    const descricao = document.getElementById("descricao");
    const contador = document.getElementById("contador");
    if (!descricao || !contador) return;

    descricao.addEventListener("input", () => {
        contador.textContent = `${descricao.value.length}/${descricao.maxLength}`;
    });
}


// DRAG AND DROP
function inicializarDragDrop() {
    const ambiente = document.getElementById("foto-ambiente");
    const selfie = document.getElementById("foto-selfie");
    if (!ambiente || !selfie) return;

    let fotoArrastada = null;

    [ambiente, selfie].forEach(foto => {
        foto.addEventListener("dragstart", e => {
            fotoArrastada = e.currentTarget;
        });

        foto.addEventListener("dragover", e => e.preventDefault());

        foto.addEventListener("drop", e => {
            e.preventDefault();
            if (!fotoArrastada || fotoArrastada === e.currentTarget) return;

            const temp = ambiente.src;
            ambiente.src = selfie.src;
            selfie.src = temp;

            localStorage.setItem("fotoAmbiente", ambiente.src);
            localStorage.setItem("fotoSelfie", selfie.src);

            fotoAmbiente = ambiente.src;
            fotoSelfie = selfie.src;
        });
    });
}


// POSTAR NOW
function inicializarPostar() {
    const btn = document.getElementById("btn-postar");
    if (!btn) return;
    btn.addEventListener("click", postarNow);
}

async function postarNow() {
    const btn = document.getElementById("btn-postar");
    const descricao = document.getElementById("descricao");
    const ambiente = localStorage.getItem("fotoAmbiente");
    const selfie = localStorage.getItem("fotoSelfie");

    if (!ambiente || !selfie) {
        alert("Você precisa tirar as duas fotos.");
        return;
    }

    const local = JSON.parse(localStorage.getItem("localAtual"));
    if (!local || local.lat === null || local.lng === null) {
        alert("A localização ainda não foi obtida. Aguarde alguns segundos.");
        return;
    }

    let usuario = localStorage.getItem("usuario");
    if (!usuario) {
        usuario = prompt("Digite seu nome:");
        if (!usuario) return;
        usuario = usuario.trim();
        if (!usuario) {
            alert("Digite um nome válido.");
            return;
        }
        localStorage.setItem("usuario", usuario);
    }

    const novoPost = {
        usuario: usuario,
        fotoAmbiente: ambiente,
        fotoSelfie: selfie,
        lat: local.lat,
        lng: local.lng,
        legenda: descricao ? descricao.value.trim() : ""
    };

    try {
        btn.disabled = true;
        btn.textContent = "Postando...";

        const resposta = await fetch(`${API_URL}/api/posts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novoPost)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || dados.mensagem || "Erro ao publicar");
        }

        alert("Now publicado com sucesso!");

        localStorage.removeItem("fotoAmbiente");
        localStorage.removeItem("fotoSelfie");

        window.location.href = "index3.html";

    } catch (erro) {
        alert(erro.message || "Erro ao publicar o Now.");
        btn.disabled = false;
        btn.textContent = "Postar Now";
    }
}


// BUSCAR POSTS
async function buscarPosts() {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) throw new Error("Usuário não identificado.");

    let local = JSON.parse(localStorage.getItem("localAtual"));
    if (!local || local.lat === null || local.lng === null) {
        throw new Error("Localização não encontrada.");
    }

    const params = new URLSearchParams({
        usuario: usuario,
        lat: local.lat,
        lng: local.lng,
        raioKm: 5
    });

    const resposta = await fetch(`${API_URL}/api/posts?${params.toString()}`);
    const dados = await resposta.json();
    console.log(dados);

    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || "Erro ao buscar posts.");
    }

    return Array.isArray(dados) ? dados : [];
}


// OBTER USUÁRIO
function inicializarUsuario() {
    const input = document.getElementById("usuario");
    if (!input) return;

    const usuarioSalvo = localStorage.getItem("usuario");
    if (usuarioSalvo) input.value = usuarioSalvo;

    input.addEventListener("input", () => {
        const usuario = input.value.trim();
        if (usuario) {
            localStorage.setItem("usuario", usuario);
        } else {
            localStorage.removeItem("usuario");
        }
    });
}


// OBTER LOCALIZAÇÃO PARA FEED/GALERIA
function obterLocalizacaoAtual() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocalização não suportada."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            erro => {
                reject(new Error("Não foi possível obter sua localização."));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
        );
    });
}


// FEED PRINCIPAL - INDEX1
async function carregarFeedPrincipal() {
    const container = document.getElementById("posts-container");
    const cardBloqueado = document.getElementById("card-bloqueado");

    if (!container) return;

    try {
        container.innerHTML = "<p id='feed-carregando'>Carregando Nows...</p>";

        const posts = await buscarPosts();

        container.innerHTML = "";
        if (cardBloqueado) cardBloqueado.style.display = "none";

        if (!posts.length) {
            container.innerHTML = `<p class="feed-vazio">Nenhum Now encontrado em um raio de 5 km.</p>`;
            return;
        }

        posts.slice().reverse().forEach(post => {
            criarCardPost(post, container);
        });

    } catch (erro) {
        container.innerHTML = `<p class="feed-erro">Não foi possível carregar os Nows.</p>`;
    }
}


// GALERIA - INDEX3
async function carregarGaleria() {
    const galeria = document.getElementById("galeria");
    const cardVazio = document.getElementById("card-vazio");

    if (!galeria) return;

    try {
        galeria.innerHTML = `<p class="galeria-carregando">Carregando seus Nows...</p>`;

        const usuario = localStorage.getItem("usuario");

        if (!usuario) {
            galeria.innerHTML = `<p class="feed-erro">Nenhum usuário identificado.</p>`;
            if (cardVazio) cardVazio.style.display = "flex";
            return;
        }

        // Usa a mesma função buscarPosts()
        const posts = await buscarPosts();

        galeria.innerHTML = "";

        if (!posts.length) {
            if (cardVazio) cardVazio.style.display = "flex";
            return;
        }

        if (cardVazio) cardVazio.style.display = "none";

        posts.slice().reverse().forEach(post => {
            criarCardPost(post, galeria);
        });

    } catch (erro) {
        galeria.innerHTML = `<p class="feed-erro">Não foi possível carregar seus Nows.</p>`;
    }
}


// CRIAR CARD
function criarCardPost(post, container) {
    const card = document.createElement("div");
    card.className = "post";

    const usuario = post.usuario || "Usuário";
    const fotoAmbiente = post.fotoAmbiente || "";
    const fotoSelfie = post.fotoSelfie || "";
    const legenda = post.legenda || "";
    const endereco = post.endereco || "";
    const data = formatarData(post.criadoEm || post.data);

    card.innerHTML = `
        <div class="fotos-post">
            <img src="${fotoSelfie}" class="foto-selfie-post" alt="Selfie de ${usuario}">
            <img src="${fotoAmbiente}" class="foto-ambiente-post" alt="Foto do ambiente">
        </div>
        <div class="info-post">
            <div class="info-esquerda">
                <p class="usuario-post"><strong>${usuario}</strong></p>
                ${endereco ? `<p class="local-post">📍 ${endereco}</p>` : ""}
                ${legenda ? `<p class="descricao-post">${legenda}</p>` : ""}
                ${data ? `<span class="data-post">${data}</span>` : ""}
            </div>
        </div>
    `;
    container.appendChild(card);
}


// FORMATAR DATA
function formatarData(data) {
    if (!data) return "";
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return "";

    return dataObj.toLocaleString("pt-BR");
}
