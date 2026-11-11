// npm run voice:check : vérifie la clé Azure Speech de video/.env sans jamais l'afficher,
// et que les 3 voix masculines de la pub (allemand, slovaque, italien) sont disponibles dans la région.
const VOICES = ['de-DE-ConradNeural', 'sk-SK-LukasNeural', 'it-IT-DiegoNeural'];

const key = (process.env.AZURE_SPEECH_KEY ?? '').trim();
const region = (process.env.AZURE_SPEECH_REGION ?? '').trim();

if (!key) {
  console.error('✗ AZURE_SPEECH_KEY est vide dans video\\.env : collez la CLÉ 1 après le signe =, puis enregistrez le fichier.');
  process.exit(1);
}
if (!/^[a-z0-9]+$/.test(region)) {
  console.error('✗ AZURE_SPEECH_REGION doit être le code de la région en minuscules, sans espace (ex. westeurope).');
  process.exit(1);
}
if (/\s|["']/.test(key)) {
  console.error('✗ La clé contient un espace ou des guillemets : collez-la seule, juste après le signe =.');
  process.exit(1);
}

let res;
try {
  res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
    headers: { 'Ocp-Apim-Subscription-Key': key },
    signal: AbortSignal.timeout(15_000),
  });
} catch (err) {
  console.error(`✗ Impossible de joindre Azure pour la région « ${region} » (${err.cause?.code ?? err.name}). Vérifiez la région et la connexion.`);
  process.exit(1);
}

if (res.status === 401 || res.status === 403) {
  console.error(`✗ Azure refuse la clé (${res.status}). Causes habituelles : clé mal copiée, ou ressource créée dans une autre région que « ${region} ».`);
  process.exit(1);
}
if (!res.ok) {
  console.error(`✗ Réponse inattendue d'Azure : ${res.status}.`);
  process.exit(1);
}

const available = new Set((await res.json()).map((v) => v.ShortName));
const missing = VOICES.filter((v) => !available.has(v));
console.log(`✓ Clé Azure acceptée (région ${region}, clé de ${key.length} caractères, ${available.size} voix disponibles).`);
for (const v of VOICES) console.log(`${available.has(v) ? '✓' : '✗'} ${v}`);
if (missing.length) process.exit(1);
console.log('Tout est prêt pour la voix off.');
