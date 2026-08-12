document.addEventListener('DOMContentLoaded', () => {
    const botaoTema = document.getElementById('mudar-tema');

    if (botaoTema) {
        botaoTema.addEventListener('click', () => {

            document.body.classList.toggle('tema-escuro');

            botaoTema.classList.toggle('noite');
            botaoTema.classList.toggle('dia');

        });
    }
});

//CAMÊRAS
let stream;

async function iniciarCamera () {
    const video = document.querySelector('#video');

    try{
        stream = await navigator.mediaDevices.getUserMedia ({ video: true});
        video.srcObject = stream;
    }catch (err){
        console. error("Erro ao acessar a câmera:", err);
        alert("Você precisa permitir o uso da câmera.");
    }   
}

document.querySelector('#btn-foto').addEventListener('click',()=> {

    const video =  document.querySelector('#video');
    const canvas = document.querySelector('#canvas');
    const foto = document.querySelector('#foto-resultado');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    context.drawImage( video, 0, 0, canvas.width, canvas.height);

    const data = canvas.toDataURL('image/png');
    foto.src = data;
    foto.style.display = 'block';
});
iniciarCamera();

//LOCALIZAÇÃO
const label = document.getElementById("localizacao-label");

function setLabel(text, state = "") {
    label.textContent = text;
    label.classList.remove("carregando", "error");

    if (state) {
        label.classList.add(state);
    }
}

async function buscarLocal(latitude, longitude) {
    const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${latitude}` +
        `&lon=${longitude}` +
        `&zoom=10` +
        `&addressdetails=1` +
        `&accept-language=pt-BR`;

    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();

    console.log("Dados recebidos:", dados);

    return dados;
}

function pegarNomeLocal(dados) {
    const endereco = dados.address || {};
    const cidade = endereco.city || endereco.town || endereco.municipality || endereco.village || endereco.county;
    const estado = endereco.state;
    const pais = endereco.country;

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

function iniciarLocalizacao() {

    if (!navigator.geolocation) {
        setLabel("Geolocalização não suportada","error");

        return;
    }

    setLabel("Obtendo localização...","carregando");

    navigator.geolocation.getCurrentPosition(
        async function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);

            try {
                const dados = await buscarLocal(latitude,longitude
                );
                const local = pegarNomeLocal(dados);
                setLabel(local);

            } catch (erro) {
                console.error("Erro ao buscar endereço:",erro);
                setLabel("Não foi possível encontrar o local","error");
            }
        },

        function(erro) {
            console.error("Erro da geolocalização:",erro);
            if (erro.code === 1) {
                setLabel(
                    "Permissão de localização negada",
                    "error"
                );

            } else if (erro.code === 2) {
                setLabel("Localização indisponível", "error");
            } else if (erro.code === 3) {
                setLabel("Tempo limite excedido","error");
            }
        },
        {
            enableHighAccuracy: true, timeout: 15000, maximumAge: 0
        }
    );
}
iniciarLocalizacao();

//DESCRIÇÃO DA POSTAGEM
const textarea = document.getElementById("descricao")
const cont_carac = document.getElementById("contador")
const limite = 120;

textarea.addEventListener("input", () => {
    const tamanho = textarea.value.length;
    cont_carac.textContent = `${tamanho}/${limite}`;
    cont_carac.classList.toggle("limite", tamanho >= limite);
});