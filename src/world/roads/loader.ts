import type { RoadGraph } from './model';
let pending: Promise<RoadGraph> | null=null;
/** Local static derivative database. Native streaming decompression, no routing API. */
export async function readRoadJson<T>(url: string): Promise<T> {
  const response=await fetch(url);
  if(!response.ok) throw new Error('Nie udało się wczytać lokalnej sieci drogowej.');
  const bytes=await response.arrayBuffer();
  const signature=new Uint8Array(bytes,0,Math.min(2,bytes.byteLength));
  // Also works behind a server which already decoded Content-Encoding:gzip.
  const text=signature[0]===31&&signature[1]===139
    ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
    : new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}
export function loadDemoRoadGraph(): Promise<RoadGraph> {
  if(!pending) pending=readRoadJson<RoadGraph>('/roads/demo/graph.json.gz').then(graph=>{
    if(graph.format!==1||!graph.nodes.length||!graph.segments.length||graph.snaps.length!==19)
      throw new Error('Lokalny graf drogowy jest niezgodny z wersją aplikacji.');
    return graph;
  }).catch(error=>{pending=null;throw error});
  return pending;
}
