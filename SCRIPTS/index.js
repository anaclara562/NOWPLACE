// =====================================================
// TEMA
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const botaoTema = document.getElementById("mudar-tema");

    if (botaoTema) {

        botaoTema.addEventListener("click", () => {

            document.body.classList.toggle("tema-escuro");

            botaoTema.classList.toggle("noite");
            botaoTema.classList.toggle("dia");

        });

    }

});


// =====================================================
// VARIÁVEIS
// =====================================================

let stream = null;

let passoAtual = 1;

let fotoAmbiente =
    localStorage.getItem("fotoAmbiente") || "";

let fotoSelfie =
    localStorage.getItem("fotoSelfie") || "";


// =====================================================
// ELEMENTOS DOS PASSOS
// =====================================================

const passo1 = document.querySelector("#passo_1");
const passo2 = document.querySelector("#passo_2");
const passo3 = document.querySelector("#passo_3");


// Só executa na página dos passos
if (passo1 && passo2 && passo3) {

    mostrarPasso();

}


// =====================================================
// MOSTRAR PASSO
// =====================================================

function mostrarPasso() {

    if (!passo1 || !passo2 || !passo3) {
        return;
    }


    // Esconde todos
    passo1.classList.remove("ativo");
    passo2.classList.remove("ativo");
    passo3.classList.remove("ativo");


    // PASSO 1
    if (passoAtual === 1) {

        passo1.classList.add("ativo");

        iniciarCamera("video");

    }


    // PASSO 2
    if (passoAtual === 2) {

        passo2.classList.add("ativo");

        iniciarCamera("video2");

    }


    // PASSO 3
    if (passoAtual === 3) {

        passo3.classList.add("ativo");

        mostrarFotos();

    }

}


// =====================================================
// PRÓXIMO PASSO
// =====================================================

function proximoPasso() {

    console.log(
        "Passo atual:",
        passoAtual
    );


    if (passoAtual < 3) {

        pararCamera();

        passoAtual++;

        console.log(
            "Indo para:",
            passoAtual
        );

        mostrarPasso();

    }

}


// =====================================================
// PARAR CÂMERA
// =====================================================

function pararCamera() {

    if (stream) {

        stream.getTracks().forEach(track => {

            track.stop();

        });

        stream = null;

    }

}


// =====================================================
// INICIAR CÂMERA
// =====================================================

async function iniciarCamera(videoId) {

    const video =
        document.querySelector(`#${videoId}`);


    if (!video) {

        console.log(
            "Vídeo não encontrado:",
            videoId
        );

        return;

    }


    try {

        stream =
            await navigator.mediaDevices.getUserMedia({
                video: true
            });


        video.srcObject = stream;


    } catch (erro) {

        console.error(
            "Erro ao acessar a câmera:",
            erro
        );


        alert(
            "Você precisa permitir o uso da câmera."
        );

    }

}


// =====================================================
// FOTO DO AMBIENTE
// =====================================================

const btnFoto1 =
    document.querySelector("#btn-foto1");


if (btnFoto1) {

    btnFoto1.addEventListener("click", () => {

        const video =
            document.querySelector("#video");

        const canvas =
            document.querySelector("#canvas");


        if (!video || !canvas) {
            return;
        }


        if (
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {

            alert(
                "A câmera ainda não está pronta."
            );

            return;

        }


        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext("2d");


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        fotoAmbiente =
            canvas.toDataURL("image/png");


        localStorage.setItem(
            "fotoAmbiente",
            fotoAmbiente
        );


        console.log(
            "Foto do ambiente salva!"
        );

    });

}


// =====================================================
// FOTO DA SELFIE
// =====================================================

const btnFoto2 =
    document.querySelector("#btn-foto2");


if (btnFoto2) {

    btnFoto2.addEventListener("click", () => {

        const video =
            document.querySelector("#video2");

        const canvas =
            document.querySelector("#canvas2");


        if (!video || !canvas) {
            return;
        }


        if (
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {

            alert(
                "A câmera ainda não está pronta."
            );

            return;

        }


        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext("2d");


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        fotoSelfie =
            canvas.toDataURL("image/png");


        localStorage.setItem(
            "fotoSelfie",
            fotoSelfie
        );


        console.log(
            "Selfie salva!"
        );

    });

}


// =====================================================
// MOSTRAR FOTOS NO PASSO 3
// =====================================================

function mostrarFotos() {

    const ambiente =
        document.querySelector("#foto-ambiente");

    const selfie =
        document.querySelector("#foto-selfie");


    if (!ambiente || !selfie) {
        return;
    }


    // Recupera as fotos
    fotoAmbiente =
        localStorage.getItem("fotoAmbiente") || "";

    fotoSelfie =
        localStorage.getItem("fotoSelfie") || "";


    ambiente.src =
        fotoAmbiente;

    selfie.src =
        fotoSelfie;

}


// =====================================================
// LOCALIZAÇÃO
// =====================================================

const label =
    document.getElementById(
        "localizacao-label"
    );


function setLabel(
    text,
    state = ""
) {

    if (!label) {
        return;
    }


    label.textContent =
        text;


    label.classList.remove(
        "carregando",
        "error"
    );


    if (state) {

        label.classList.add(
            state
        );

    }

}


// =====================================================
// BUSCAR LOCAL
// =====================================================

async function buscarLocal(
    latitude,
    longitude
) {

    const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${latitude}` +
        `&lon=${longitude}` +
        `&zoom=10` +
        `&addressdetails=1` +
        `&accept-language=pt-BR`;


    const resposta =
        await fetch(url);


    if (!resposta.ok) {

        throw new Error(
            `Erro HTTP: ${resposta.status}`
        );

    }


    const dados =
        await resposta.json();


    console.log(
        "Dados recebidos:",
        dados
    );


    return dados;

}


// =====================================================
// NOME DO LOCAL
// =====================================================

function pegarNomeLocal(dados) {

    const endereco =
        dados.address || {};


    const cidade =
        endereco.city ||
        endereco.town ||
        endereco.municipality ||
        endereco.village ||
        endereco.county;


    const estado =
        endereco.state;


    const pais =
        endereco.country;


    let resultado = "";


    if (cidade) {

        resultado += cidade;

    }


    if (estado) {

        resultado += resultado
            ? `, ${estado}`
            : estado;

    }


    if (pais) {

        resultado += resultado
            ? `, ${pais}`
            : pais;

    }


    if (resultado) {

        return resultado;

    }


    return "Local desconhecido";

}


// =====================================================
// INICIAR LOCALIZAÇÃO
// =====================================================

function iniciarLocalizacao() {

    if (!navigator.geolocation) {

        setLabel(
            "Geolocalização não suportada",
            "error"
        );

        return;

    }


    setLabel(
        "Obtendo localização...",
        "carregando"
    );


    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            console.log(
                "Latitude:",
                latitude
            );


            console.log(
                "Longitude:",
                longitude
            );


            try {

                const dados =
                    await buscarLocal(
                        latitude,
                        longitude
                    );


                const local =
                    pegarNomeLocal(dados);


                setLabel(local);


            } catch (erro) {

                console.error(
                    "Erro ao buscar endereço:",
                    erro
                );


                setLabel(
                    "Não foi possível encontrar o local",
                    "error"
                );

            }

        },


        function(erro) {

            console.error(
                "Erro da geolocalização:",
                erro
            );


            if (erro.code === 1) {

                setLabel(
                    "Permissão de localização negada",
                    "error"
                );

            }


            else if (erro.code === 2) {

                setLabel(
                    "Localização indisponível",
                    "error"
                );

            }


            else if (erro.code === 3) {

                setLabel(
                    "Tempo limite excedido",
                    "error"
                );

            }

        },


        {

            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0

        }

    );

}


// Só inicia localização se existir
if (label) {

    iniciarLocalizacao();

}


// =====================================================
// DRAG AND DROP
// =====================================================

const fotoAmbienteElement =
    document.querySelector("#foto-ambiente");

const fotoSelfieElement =
    document.querySelector("#foto-selfie");


let fotoArrastada = null;


// Começou a arrastar
function iniciarArraste(event) {

    fotoArrastada =
        event.currentTarget;


    event.currentTarget.classList.add(
        "arrastando"
    );

}


// Terminou de arrastar
function terminarArraste(event) {

    event.currentTarget.classList.remove(
        "arrastando"
    );


    fotoArrastada = null;

}


// Permite soltar
function permitirSoltar(event) {

    event.preventDefault();

}


// Soltar
function soltarFoto(event) {

    event.preventDefault();


    const fotoDestino =
        event.currentTarget;


    if (!fotoArrastada) {
        return;
    }


    if (
        fotoArrastada === fotoDestino
    ) {
        return;
    }


    // Guarda as imagens
    const ambienteSrc =
        fotoAmbienteElement.src;

    const selfieSrc =
        fotoSelfieElement.src;


    // Troca visualmente
    fotoAmbienteElement.src =
        selfieSrc;

    fotoSelfieElement.src =
        ambienteSrc;


    // Atualiza variáveis
    fotoAmbiente =
        selfieSrc;

    fotoSelfie =
        ambienteSrc;


    // Salva nova ordem
    localStorage.setItem(
        "fotoAmbiente",
        fotoAmbiente
    );


    localStorage.setItem(
        "fotoSelfie",
        fotoSelfie
    );


    console.log(
        "Fotos trocadas!"
    );

}


// Eventos do Drag and Drop
if (
    fotoAmbienteElement &&
    fotoSelfieElement
) {

    fotoAmbienteElement.addEventListener(
        "dragstart",
        iniciarArraste
    );

    fotoAmbienteElement.addEventListener(
        "dragend",
        terminarArraste
    );

    fotoAmbienteElement.addEventListener(
        "dragover",
        permitirSoltar
    );

    fotoAmbienteElement.addEventListener(
        "drop",
        soltarFoto
    );


    fotoSelfieElement.addEventListener(
        "dragstart",
        iniciarArraste
    );

    fotoSelfieElement.addEventListener(
        "dragend",
        terminarArraste
    );

    fotoSelfieElement.addEventListener(
        "dragover",
        permitirSoltar
    );

    fotoSelfieElement.addEventListener(
        "drop",
        soltarFoto
    );

}


// =====================================================
// POSTAR NOW
// =====================================================

const btnPostar =
    document.querySelector("#btn-postar");


if (btnPostar) {

    btnPostar.addEventListener(
        "click",
        postarNow
    );

}


function postarNow() {

    console.log(
        "POSTAR NOW CLICADO!"
    );


    // Pega as imagens atuais
    const ambienteElement =
        document.querySelector(
            "#foto-ambiente"
        );


    const selfieElement =
        document.querySelector(
            "#foto-selfie"
        );


    // Pega descrição
    const descricaoElement =
        document.querySelector(
            "#descricao"
        );


    const descricao =
        descricaoElement
            ? descricaoElement.value
            : "";


    // Verifica fotos
    if (
        !ambienteElement ||
        !selfieElement
    ) {

        alert(
            "As fotos não foram encontradas."
        );

        return;

    }


    if (
        !ambienteElement.src ||
        !selfieElement.src
    ) {

        alert(
            "Tire as duas fotos primeiro."
        );

        return;

    }


    // Pega imagens atuais
    const ambiente =
        ambienteElement.src;


    const selfie =
        selfieElement.src;


    // Cria post
    const novoPost = {

        ambiente: ambiente,

        selfie: selfie,

        descricao: descricao,

        data:
            new Date().toLocaleString(
                "pt-BR"
            )

    };


    // Pega posts antigos
    let posts =
        JSON.parse(
            localStorage.getItem("posts")
        ) || [];


    // Adiciona novo post
    posts.push(novoPost);


    // Salva
    localStorage.setItem(
        "posts",
        JSON.stringify(posts)
    );


    console.log(
        "Post salvo!",
        novoPost
    );


    // Para câmera
    pararCamera();


    // Vai para galeria
    window.location.href =
        "index3.html";

}


// =====================================================
// GALERIA
// =====================================================

const galeria =
    document.querySelector("#galeria");


const cardVazio =
    document.querySelector("#card-vazio");


if (galeria) {

    carregarGaleria();

}


function carregarGaleria() {

    const posts =
        JSON.parse(
            localStorage.getItem("posts")
        ) || [];


    // Não existem posts
    if (posts.length === 0) {

        if (cardVazio) {

            cardVazio.style.display =
                "flex";

        }


        return;

    }


    // Existem posts
    if (cardVazio) {

        cardVazio.style.display =
            "none";

    }


    // Limpa galeria
    galeria.innerHTML = "";


    // Mais recente primeiro
    posts
        .slice()
        .reverse()
        .forEach(post => {

            const card =
                document.createElement(
                    "div"
                );


            card.classList.add(
                "post"
            );


            card.innerHTML = `

                <div class="fotos-post">

                    <img
                        src="${post.selfie}"
                        class="foto-selfie-post"
                    >

                    <img
                        src="${post.ambiente}"
                        class="foto-ambiente-post"
                    >

                </div>


                <div class="info-post">

                    <p class="descricao-post">
                        ${post.descricao}
                    </p>


                    <span class="data-post">
                        ${post.data}
                    </span>

                </div>

            `;


            galeria.appendChild(
                card
            );

        });

}