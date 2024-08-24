const client = require('axios');
const reader = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const VALOR_MAXIMO_SPOTIFY = 50;
const SPOTIFY_BASE_URL = "https://api.spotify.com/v1/";
const TOKEN = "BQCeXIbFUwMT_xvQXyvATYesax7xgc6ryiVCLE--GwJdUtOEym1A-6O5_gCRYbEw77cOo-ug7qdKEZT9yHMmoNF8PTuLwsmgDZI11ZGW2Wgs1fNh_Wo1n1JU84OKQhyluDY_NIOIMabY3eJx6LFwI-GB8RgnowCZDkb7TbGsz2-R40l3G41v-_aNY84LhKdFBAHfwWk-bokVV4E0_fDb4wIu-3yR_MHnvlrsB3YNrz0GtA";

(() => {
    console.log("Iniciando");
    recuperarGeneros();
})();

async function recuperarGeneros() {
    let trackIds = lerExcel();
    let artistsId = await recuperarIdsArtistas(trackIds);
    let artistas =  await recuperarArtistas(artistsId);
    escreverCsv(artistas);
    // console.log(artistas);
}

async function recuperarIdsArtistas(trackIds) {
    let iterador = Math.ceil(trackIds.length/VALOR_MAXIMO_SPOTIFY);
    // iterador = 1;
    let artistsId = [];
    
    for (let index = 0; index < iterador; index++) {

        let start = (index * VALOR_MAXIMO_SPOTIFY) + (index != 0);
        
        let end = ((index + 1) * VALOR_MAXIMO_SPOTIFY) + (index != 0);

        let ids = trackIds.slice(start, end).join();
        
        await getTracks(ids).then((results) => {
            // console.log(results.data);
            results.data.tracks.forEach(track => {
                artistsId.push(track.artists[0].id);
            });
    
            // console.log(`${index}/${iterador}`)

            let porcentagem = ((index * 100)/iterador).toFixed(2);
            console.log(`${porcentagem}%`)

            // console.log(artistsId.length);
        });;

    }
    return artistsId;
}

async function recuperarArtistas(artistsId) {
    let iterador = Math.ceil(artistsId.length/VALOR_MAXIMO_SPOTIFY);
    let artistas = [];
    
    for (let index = 0; index < iterador; index++) {

        let start = (index * VALOR_MAXIMO_SPOTIFY) + (index != 0);
        
        let end = ((index + 1) * VALOR_MAXIMO_SPOTIFY) + (index != 0);

        let ids = artistsId.slice(start, end).join();
        
        await getArtistas(ids).then((results) => {
            // console.log(results.data);
            results.data.artists.forEach(respostaArtista => {
                let artista = {
                    id: respostaArtista.id,
                    nome: respostaArtista.name,
                    genres: respostaArtista.genres,
                }
                artistas.push(artista);
            });
    
            console.log(artistas.length);
        });

    }
    return artistas;
}

function lerExcel() {

const file = reader.readFile('./TracksId.xlsx')
  
    let data = [];
    
    const sheets = file.SheetNames
  
    for(let i = 0; i < sheets.length; i++)
    {
        const temp = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);

        temp.forEach((res) => {
            data.push(res.spotify_track_uri);
        })
    }

    return data;
}

function escreverCsv(artistas) {
    const csvWriter = createCsvWriter({
        path: 'generos.csv',
        header: [
          { id: 'id', title: 'Id' },
          { id: 'nome', title: 'Nome' },
          { id: 'genero', title: 'Genero' }
        ]
      });

    let dadosCsv = []
    
    artistas.forEach(artista => {
        
        artista.genres.forEach(genre => {
            let dado = {
                id: artista.id,
                nome: artista.nome,
                genero: genre,
            };

            // console.log(genre);

            dadosCsv.push(dado);
        });
    });

    csvWriter.writeRecords(dadosCsv).then(() => {
        console.log('Escrita do arquivo CSV finalizada');
    });
}

async function getTracks(ids) {
    let url = `${SPOTIFY_BASE_URL}tracks?ids=${ids}`
    // console.log(url);
    return await requisicaoSpotify(url);
};


async function getArtistas(ids) {
    let url = `${SPOTIFY_BASE_URL}artists?ids=${ids}`

    return await requisicaoSpotify(url);
};

async function requisicaoSpotify(url) {
    return await client.get(url, {
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
        }
    })
};