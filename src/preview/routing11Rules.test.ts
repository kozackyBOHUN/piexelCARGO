import {it,expect} from 'vitest';
import {createNetwork,type RoadGraph,type TurnRelation} from '../world/roads/model';
import {partialRules} from '../../scripts/routes11/partial';
import {auditNodeMembers} from '../../scripts/routes11/partialAudit';
import {conditionalDecision,accessErrors} from '../../scripts/routes11/access';
import type {PlannedRoadRoute} from '../../scripts/routes08/routing';
function sample(mode:string,from:number[],to:number[]){
 const r:TurnRelation={id:123,tags:{restriction:mode},members:[...from.map(id=>['w',id,'from'] as const),['n',2,'via'],...to.map(id=>['w',id,'to'] as const)]};
 const graph:RoadGraph={format:1,version:'test',nodes:[[1,19,50],[2,19.01,50],[3,19.02,50],[4,19.01,50.01]],ways:[11,12,13,14].map(id=>({id,tags:{highway:'residential'}})),segments:[['in',0,1,0,1,3,[[19,50],[19.01,50]]],['out',1,2,1,1,3,[[19.01,50],[19.02,50]]],['other',1,3,2,1,3,[[19.01,50],[19.01,50.01]]],['other-in',3,1,3,1,3,[[19.01,50.01],[19.01,50]]]],restrictions:[r],snaps:[]};
 const n=createNetwork(graph),edge=(id:string)=>n.edges.find(e=>e.id===id)!;return {graph,n,edge,r};
}
function legs(from:number,to:number){return {legs:[{wayId:from,fromNodeId:1,toNodeId:2,edgeId:'a'},{wayId:to,fromNodeId:2,toNodeId:3,edgeId:'b'}]} as unknown as PlannedRoadRoute}
it('proves only_* with missing from only when the actual known target is followed, without inventing a member',()=>{
 const s=sample('only_straight_on',[],[12]),before=JSON.stringify(s.r),guard=partialRules(s.n);
 expect(guard(s.edge('in:f'),s.edge('out:f'))).toBe(true);expect(guard(s.edge('in:f'),s.edge('other:f'))).toBe(false);
 expect(auditNodeMembers(s.graph,legs(11,12)).errors).toEqual([]);expect(auditNodeMembers(s.graph,legs(11,12)).proofs).toHaveLength(1);expect(auditNodeMembers(s.graph,legs(11,13)).errors).toHaveLength(1);expect(JSON.stringify(s.r)).toBe(before);
});
it('never permits a no_* prohibited target with unknown source, nor departure from known source with unknown target',()=>{
 let s=sample('no_right_turn',[],[12]);expect(partialRules(s.n)(s.edge('in:f'),s.edge('out:f'))).toBe(false);expect(partialRules(s.n)(s.edge('in:f'),s.edge('other:f'))).toBe(true);
 s=sample('no_right_turn',[11],[]);expect(partialRules(s.n)(s.edge('in:f'),s.edge('out:f'))).toBe(false);expect(partialRules(s.n)(s.edge('other-in:f'),s.edge('out:f'))).toBe(true);expect(auditNodeMembers(s.graph,legs(14,12)).errors).toEqual([]);expect(auditNodeMembers(s.graph,legs(11,12)).errors).toHaveLength(1);
});
it('checks every from/to member of no_entry/no_exit, not just the first way',()=>{
 const s=sample('no_entry',[11,14],[12,13]);expect(partialRules(s.n)(s.edge('other-in:f'),s.edge('other:f'))).toBe(false);expect(auditNodeMembers(s.graph,legs(14,13)).errors).toHaveLength(1);
});
it('distinguishes applicable van rules from HGV, bus and dangerous-goods scopes conservatively',()=>{
 expect(conditionalDecision('maxgvweightrating:hgv:conditional')).toBe('not-applicable-hgv');expect(conditionalDecision('bus:conditional')).toBe('not-applicable-mode');expect(conditionalDecision('maxweight:conditional')).toBe('unresolved-blocked');
 expect(accessErrors({highway:'secondary','maxgvweightrating:hgv:conditional':'none @ marked'},false)).toEqual([]);expect(accessErrors({'maxweight:conditional':'3.5 @ wet'},false).length).toBeGreaterThan(0);expect(accessErrors({maxaxleload:'2.5'},false).length).toBeGreaterThan(0);expect(accessErrors({goods:'no',motorcar:'yes'},false).length).toBeGreaterThan(0);expect(accessErrors({maxweight:'3.5',maxheight:'2.7',maxwidth:'2.1'},false)).toEqual([]);
});
it('preserves OR alternatives for multiple only_* relations from the same real incoming way',()=>{
 const s=sample('only_straight_on',[11],[12]);s.graph.restrictions.push({id:124,tags:{restriction:'only_right_turn'},members:[['w',11,'from'],['n',2,'via'],['w',13,'to']]});const guard=partialRules(s.n);
 expect(guard(s.edge('in:f'),s.edge('out:f'))).toBe(true);expect(guard(s.edge('in:f'),s.edge('other:f'))).toBe(true);expect(auditNodeMembers(s.graph,legs(11,12)).errors).toEqual([]);expect(auditNodeMembers(s.graph,legs(11,13)).errors).toEqual([]);
});
it('permits same-way continuation but blocks real and distinct-way U-turn manoeuvres',()=>{
 const s=sample('no_u_turn',[11],[11]);s.graph.segments.push(['continue',1,3,0,1,1,[[19.01,50],[19.01,50.01]]]);const n=createNetwork(s.graph),guard=partialRules(n),get=(id:string)=>n.edges.find(e=>e.id===id)!;
 expect(guard(get('in:f'),get('continue:f'))).toBe(true);expect(guard(get('in:f'),get('in:r'))).toBe(false);expect(auditNodeMembers(s.graph,legs(11,11)).errors).toEqual([]);
 const different=sample('no_u_turn',[11],[12]);expect(partialRules(different.n)(different.edge('in:f'),different.edge('out:f'))).toBe(false);expect(auditNodeMembers(different.graph,legs(11,12)).errors).toHaveLength(1);
});
