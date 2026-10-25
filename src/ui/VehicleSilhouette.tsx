/** Side profile symbols only. Truck/trailer are reserved, never activated as vehicles. */
export function VehicleSilhouette({category='van'}:{category?:'van'|'truck'|'tractor'}){
 const wheels=(xs:number[])=>xs.map(x=><g key={x}><rect x={x} y={6} width={4} height={4} fill="#0b1520"/><rect x={x+1} y={7} width={2} height={2} fill="#b4c6d5"/></g>);
 return <g shapeRendering="crispEdges" data-category={category}>
 {category==='van'?<><path d="M-13-6H3L11 0V7H-13Z" fill="#e2c085" stroke="#142331"/><path d="M4-4L9 0H4Z" fill="#6fbce8"/>{wheels([-10,5])}</>:category==='truck'?<><rect x={-17} y={-9} width={23} height={15} fill="#7cb8dc"/><path d="M7-4H14L18 1V7H7Z" fill="#ead6ad"/>{wheels([-13,10])}</>:<><rect x={-24} y={-9} width={32} height={15} fill="#c8d5dc"/><path d="M10-5H20L25 1V7H9Z" fill="#e49c67"/>{wheels([-20,-14,8,19])}</>}
 </g>;
}
