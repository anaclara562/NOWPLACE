// TEMA
document.addEventListener("DOMContentLoaded", () => {
    const botaoTema = document.getElementById("mudar-tema");

    if (botaoTema) {
        botaoTema.addEventListener("click", () => {
            document.body.classList.toggle("tema-escuro");
            botaoTema.classList.toggle("noite");
            botaoTema.classList.toggle("dia");
        });
    }

    inicializarPassos();
    inicializarDragDrop();
    inicializarContador();
    inicializarPostar();
    inicializarGaleria();

    if (label) {
        iniciarLocalizacao();
    }
});


// VARIÁVEIS
let stream = null;
let passoAtual = 1;
let fotoAmbiente = localStorage.getItem("fotoAmbiente") || "";
let fotoSelfie = localStorage.getItem("fotoSelfie") || "";


// ELEMENTOS
const label = document.getElementById("localizacao-label");


// PASSOS
function inicializarPassos() {
    const passo1 = document.querySelector("#passo_1");
    const passo2 = document.querySelector("#passo_2");
    const passo3 = document.querySelector("#passo_3");

    if (!passo1 || !passo2 || !passo3) return;

    mostrarPasso();

    const btnFoto1 = document.querySelector("#btn-foto1");
    const btnFoto2 = document.querySelector("#btn-foto2");
    console.log("OK");
    if (btnFoto1) {
        btnFoto1.addEventListener("click", () => tirarFoto("video", "canvas", "fotoAmbiente"));
    }
    if (btnFoto2) {
        btnFoto2.addEventListener("click", () => tirarFoto("video2", "canvas2", "fotoSelfie"));
    }
}


// MOSTRAR PASSO
function mostrarPasso() {

    const passos = document.querySelectorAll(".passo");
    passos.forEach(p => p.classList.remove("ativo"));

    const etapas = document.querySelectorAll(".etapa");
    etapas.forEach((e, i) => {
        e.classList.toggle("ativa", i < passoAtual);
    });

    const passoAtivo = document.querySelector(`#passo_${passoAtual}`);
    if (passoAtivo) passoAtivo.classList.add("ativo");

    if (passoAtual === 1) iniciarCamera("video");
    if (passoAtual === 2) iniciarCamera("video2");
    if (passoAtual === 3) mostrarFotos();
}


// PRÓXIMO PASSO
function proximoPasso() {
    if (passoAtual < 3) {
        pararCamera();
        passoAtual++;
        mostrarPasso();
    }
}


// CÂMERA
function pararCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

async function iniciarCamera(videoId) {
    const video = document.querySelector(`#${videoId}`);
    if (!video) return;

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (erro) {
        console.error("Erro ao acessar a câmera:", erro);
        alert("Você precisa permitir o uso da câmera.");
    }
}

function comprimirImagem(dataURL, qualidade = 0.4) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxWidth = 600;
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL("image/jpeg", qualidade));
        };
        img.src = dataURL;
    });
}



async function tirarFoto(videoId, canvasId, chave) {
    const video = document.querySelector(`#${videoId}`);
    const canvas = document.querySelector(`#${canvasId}`);

    if (!video || !canvas) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert("A câmera ainda não está pronta.");
        return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    video.style.display = "none";
    canvas.style.display = "block";


    const fotoOriginal = canvas.toDataURL("image/png");
    const fotoComprimida = await comprimirImagem(fotoOriginal, 0.4);

    if (chave === "fotoAmbiente") fotoAmbiente = fotoComprimida;
    if (chave === "fotoSelfie") fotoSelfie = fotoComprimida;
    localStorage.setItem(chave, fotoComprimida);
    console.log(`${chave} salva! Tamanho: ${Math.round(fotoComprimida.length / 1024)}KB`);
}


// MOSTRAR FOTOS
function mostrarFotos() {
    const ambiente = document.querySelector("#foto-ambiente");
    const selfie = document.querySelector("#foto-selfie");
    if (!ambiente || !selfie) return;

    fotoAmbiente = localStorage.getItem("fotoAmbiente") || "";
    fotoSelfie = localStorage.getItem("fotoSelfie") || "";

    ambiente.src = fotoAmbiente;
    selfie.src = fotoSelfie;
}


// LOCALIZAÇÃO
function setLabel(text, state = "") {
    if (!label) return;
    label.textContent = text;
    label.classList.remove("carregando", "error");
    if (state) label.classList.add(state);
}

async function buscarLocal(latitude, longitude) {
    const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=pt-BR`;

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
    return await resposta.json();
}

function pegarNomeLocal(dados) {
    const endereco = dados.address || {};
    const cidade = endereco.city || endereco.town || endereco.municipality || endereco.village || endereco.county;
    const estado = endereco.state;
    const pais = endereco.country;

    let resultado = "";
    if (cidade) resultado += cidade;
    if (estado) resultado += resultado ? `, ${estado}` : estado;
    if (pais) resultado += resultado ? `, ${pais}` : pais;

    return resultado || "Local desconhecido";
}

function iniciarLocalizacao() {
    if (!navigator.geolocation) {
        setLabel("Geolocalização não suportada", "error");
        return;
    }
    setLabel("Obtendo localização...", "carregando");
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const dados = await buscarLocal(position.coords.latitude, position.coords.longitude);
                setLabel(pegarNomeLocal(dados));
            } catch (erro) {
                console.error("Erro ao buscar endereço:", erro);
                setLabel("Não foi possível encontrar o local", "error");
            }
        },
        (erro) => {
            const mensagens = {
                1: "Permissão de localização negada",
                2: "Localização indisponível",
                3: "Tempo limite excedido"
            };
            setLabel(mensagens[erro.code] || "Erro desconhecido", "error");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}


// CONTADOR DE CARACTERES 
function inicializarContador() {
    const descricao = document.querySelector("#descricao");
    const contador = document.querySelector("#contador");
    if (!descricao || !contador) return;
    descricao.addEventListener("input", () => {
        const atual = descricao.value.length;
        const max = descricao.maxLength;
        contador.textContent = `${atual}/${max}`;
        contador.classList.toggle("limite", atual >= max);
    });
}


// DRAG AND DROP
function inicializarDragDrop() {
    const fotoAmbienteEl = document.querySelector("#foto-ambiente");
    const fotoSelfieEl = document.querySelector("#foto-selfie");

    if (!fotoAmbienteEl || !fotoSelfieEl) return;
    let fotoArrastada = null;

    function iniciarArraste(e) {
        fotoArrastada = e.currentTarget;
        e.currentTarget.classList.add("arrastando");
    }
    function terminarArraste(e) {
        e.currentTarget.classList.remove("arrastando");
        fotoArrastada = null;
    }
    function permitirSoltar(e) {
        e.preventDefault();
    }
    function soltarFoto(e) {
        e.preventDefault();
        if (!fotoArrastada || fotoArrastada === e.currentTarget) return;

        const tempSrc = fotoAmbienteEl.src;
        fotoAmbienteEl.src = fotoSelfieEl.src;
        fotoSelfieEl.src = tempSrc;

        fotoAmbiente = fotoAmbienteEl.src;
        fotoSelfie = fotoSelfieEl.src;

        localStorage.setItem("fotoAmbiente", fotoAmbiente);
        localStorage.setItem("fotoSelfie", fotoSelfie);
    }
    [fotoAmbienteEl, fotoSelfieEl].forEach(foto => {
        foto.addEventListener("dragstart", iniciarArraste);
        foto.addEventListener("dragend", terminarArraste);
        foto.addEventListener("dragover", permitirSoltar);
        foto.addEventListener("drop", soltarFoto);
    });
}


// POSTAR
function inicializarPostar() {
    const btnPostar = document.querySelector("#btn-postar");
    if (btnPostar) btnPostar.addEventListener("click", postarNow);
}

function postarNow() {
    const descricaoEl = document.querySelector("#descricao");
    const ambienteSalvo = localStorage.getItem("fotoAmbiente");
    const selfieSalvo = localStorage.getItem("fotoSelfie");

    if (!ambienteSalvo || !selfieSalvo) {
        alert("Tire as duas fotos primeiro.");
        return;
    }
    const novoPost = {
        ambiente: ambienteSalvo,
        selfie: selfieSalvo,
        descricao: descricaoEl ? descricaoEl.value : "",
        data: new Date().toLocaleString("pt-BR")
    };

    let posts = JSON.parse(localStorage.getItem("posts")) || [];
    posts.push(novoPost);

    while (posts.length > 10) {
        posts.shift();
    } try {
        localStorage.setItem("posts", JSON.stringify(posts));
    } catch (e) {
        localStorage.removeItem("posts");
        localStorage.setItem("posts", JSON.stringify([novoPost]));
    }

    pararCamera();
    window.location.href = "index3.html";
}


// GALERIA
function inicializarGaleria() {
    const galeria = document.querySelector("#galeria");
    const cardVazio = document.querySelector("#card-vazio");

    if (!galeria) return;

    const posts = JSON.parse(localStorage.getItem("posts")) || [];

    galeria.innerHTML = "";
    if (posts.length === 0) {
        if (cardVazio) cardVazio.style.display = "flex";
        return;
    }
    if (cardVazio) cardVazio.style.display = "none";

    posts.slice().reverse().forEach((post, index) => {
        const indiceReal = posts.length - 1 - index;
        const card = document.createElement("div");
        card.classList.add("post");

        card.innerHTML = `
            <div class="fotos-post">
                <img src="${post.selfie}" class="foto-selfie-post">
                <img src="${post.ambiente}" class="foto-ambiente-post">
            </div>

            <div class="info-post">
                <div class="info-esquerda">
                    <p class="descricao-post">${post.descricao}</p>
                    <span class="data-post">${post.data}</span>
                </div>

                <button class="btn-apagar" data-index="${indiceReal}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#a855f7">
                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
                    </svg>
                </button>
            </div>
        `;
        card.querySelector(".btn-apagar").addEventListener("click", () => {
            apagarPost(indiceReal);
        });
        galeria.appendChild(card);
    });
}


function apagarPost(index) {
    let posts = JSON.parse(localStorage.getItem("posts")) || [];

    posts.splice(index, 1);
    localStorage.setItem("posts", JSON.stringify(posts));
    inicializarGaleria();
}