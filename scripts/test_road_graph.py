import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest

spec=importlib.util.spec_from_file_location('road_graph',Path(__file__).with_name('prepare-roads.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class RoadPolicyTests(unittest.TestCase):
    def test_car_access_priority_and_no_non_motor_roads(self):
        for h in ['footway','cycleway','path','steps','construction']:
            self.assertEqual(m.policy({'highway':h}),0)
        self.assertEqual(m.policy({'highway':'primary','access':'no'}),0)
        self.assertEqual(m.policy({'highway':'primary','access':'no','motor_vehicle':'yes'}),3)
        self.assertEqual(m.policy({'highway':'service','access':'private'}),0)
        self.assertEqual(m.policy({'highway':'primary','motor_vehicle':'destination'}),0)
    def test_directions_and_implicit_roundabouts(self):
        self.assertEqual(m.policy({'highway':'primary','oneway':'-1'}),2)
        self.assertEqual(m.policy({'highway':'primary','junction':'roundabout'}),1)
        self.assertEqual(m.policy({'highway':'motorway'}),1)
        self.assertEqual(m.policy({'highway':'primary','oneway':'reversible'}),0)
        self.assertEqual(m.policy({'highway':'primary','motor_vehicle:backward':'no'}),1)
    def test_unknown_conditional_access_is_conservatively_closed(self):
        self.assertEqual(m.policy({'highway':'primary','motor_vehicle:conditional':'yes @ (Mo-Fr)'}),0)
    def test_geometric_crossings_do_not_create_osm_connections(self):
        # Deliberately controlled topology fixture; never shipped as map data.
        fixture=SimpleNamespace(ways=[
            (10,0,[1,2],[[19,50],[19.02,50]],{'highway':'primary'},3),
            (11,0,[3,4],[[19.01,49.99],[19.01,50.01]],{'highway':'secondary','bridge':'yes'},3)],restrictions=[])
        graph=m.build(fixture,[],'fixture')
        self.assertEqual(len(graph['nodes']),4)
        self.assertEqual(len(graph['segments']),2)
        self.assertTrue(set(graph['segments'][0][1:3]).isdisjoint(graph['segments'][1][1:3]))
    def test_city_snaps_to_nearest_node_of_mutually_reachable_network(self):
        fixture=SimpleNamespace(ways=[
            (10,0,[1,2,3],[[19,50],[19.01,50],[19.02,50]],{'highway':'primary'},3),
            (11,0,[8,9],[[19.01,50.001],[19.02,50.001]],{'highway':'service'},1)],restrictions=[])
        refs={};base=m.build(fixture,[],'fixture',source_refs=refs)
        component=m.main_component(base)
        candidates=set()
        for segment in base['segments']:
            if segment[1] in component and segment[2] in component:
                candidates.update(refs[segment[0]])
        graph=m.build(fixture,[{'id':'demo','coordinates':[19.01,50.001]}],'fixture',candidates=candidates)
        self.assertEqual(graph['snaps'][0]['nodeId'],2)
        self.assertGreater(graph['snaps'][0]['gapMeters'],100)
        self.assertEqual(len(graph['segments']),3)  # unrelated roads still retained
    def test_shared_id_splits_geometry_and_city_snap_is_not_driving_distance(self):
        fixture=SimpleNamespace(ways=[
            (10,0,[1,2,3],[[19,50],[19.01,50],[19.02,50]],{'highway':'primary'},1),
            (11,0,[2,4],[[19.01,50],[19.01,50.01]],{'highway':'secondary'},3)],restrictions=[])
        graph=m.build(fixture,[{'id':'demo','coordinates':[19.01,50.001]}],'fixture')
        self.assertEqual(len(graph['segments']),3)
        self.assertEqual(graph['snaps'][0]['nodeId'],2)
        self.assertGreater(graph['snaps'][0]['gapMeters'],100)
        self.assertAlmostEqual(sum(s[4] for s in graph['segments']),
            m.meters([19,50],[19.01,50])+m.meters([19.01,50],[19.02,50])+m.meters([19.01,50],[19.01,50.01]))

if __name__=='__main__':unittest.main()
