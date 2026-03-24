const fs = require('fs');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const threejsModels = [
  'https://unpkg.com/three@0.174.0/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  'https://unpkg.com/three@0.174.0/examples/models/gltf/Flamingo.glb',
  'https://unpkg.com/three@0.174.0/examples/models/gltf/Parrot.glb',
  'https://unpkg.com/three@0.174.0/examples/models/gltf/Stork.glb',
  'https://unpkg.com/three@0.174.0/examples/models/gltf/Horse.glb'
];

async function downloadModels() {
  fs.mkdirSync('public/models', { recursive: true });
  for (const url of threejsModels) {
    const name = url.split('/').pop();
    console.log(`Downloading ${name}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url} - ${res.statusText}`);
      const fileStream = fs.createWriteStream(`public/models/${name}`);
      await finished(Readable.fromWeb(res.body).pipe(fileStream));
      console.log(`Successfully downloaded ${name}`);
    } catch(e) {
      console.error(e);
      process.exit(1);
    }
  }
}

downloadModels();
