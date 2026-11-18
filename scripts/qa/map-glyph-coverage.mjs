// Read-only scan of place-label codepoint ranges over the supported Phuket bounds.
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';const require=createRequire(process.cwd()+'/package.json');
const {PMTiles}=require('pmtiles'); const {VectorTile}=require('@mapbox/vector-tile');const Pbf=require('pbf').default;
if(!process.argv[2])throw Error('Usage: node scripts/qa/map-glyph-coverage.mjs /path/to/phuket.pmtiles');
const bytes=await readFile(process.argv[2]);const archive=new PMTiles({getKey:()=> 'local-scan',getBytes:async(offset,length)=>({data:bytes.buffer.slice(bytes.byteOffset+offset,bytes.byteOffset+offset+length)})});
const ranges=new Set();let tiles=0,labels=0;const samples=[];
const y=(lat,z)=>Math.floor((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*2**z);const x=(lng,z)=>Math.floor((lng+180)/360*2**z);
for(let z=0;z<=14;z++)for(let tx=x(98.2,z);tx<=x(98.55,z);tx++)for(let ty=y(8.25,z);ty<=y(7.7,z);ty++){
 const raw=await archive.getZxy(z,tx,ty);if(!raw)continue;tiles++;const tile=new VectorTile(new Pbf(raw.data));const layer=tile.layers.place;if(!layer)continue;
 for(let i=0;i<layer.length;i++){const p=layer.feature(i).properties;const text=p['name:en']??p['name:latin']??p.name;if(!text)continue;labels++;if(samples.length<12)samples.push(text);for(const c of String(text))ranges.add(Math.floor(c.codePointAt(0)/256)*256);}
}
const result={tiles,labels,ranges:[...ranges].sort((a,b)=>a-b).map(start=>`${start}-${start+255}`),bounds:[[98.2,7.7],[98.55,8.25]],zooms:[0,14],samples};console.log(JSON.stringify(result,null,2));
