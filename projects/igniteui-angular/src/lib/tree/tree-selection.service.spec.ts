import { EventEmitter, QueryList } from '@angular/core';
import { IgxTree, IgxTreeNode, IGX_TREE_SELECTION_TYPE, ITreeNodeSelectionEvent } from './common';
import { IgxTreeSelectionService } from './tree-selection.service';

const createNodeSpies = (count?: number): IgxTreeNode<any>[] => {
    const nodesArr = [];
    for (let i = 0; i < count; i++) {
        nodesArr.push(jasmine.createSpyObj<IgxTreeNode<any>>(['id', 'selected']));
    }
    return nodesArr;
};

fdescribe('IgxTreeSelectionService - Unit Tests', () => {
    let selectionService: IgxTreeSelectionService;
    let mockEmitter: EventEmitter<ITreeNodeSelectionEvent>;
    let mockTree: IgxTree;
    let mockNodes: IgxTreeNode<any>[];
    let mockQuery: jasmine.SpyObj<QueryList<any>>;
    beforeEach(() => {
        selectionService = new IgxTreeSelectionService();
        mockNodes = createNodeSpies(5);
        mockQuery = jasmine.createSpyObj('mockQuery', ['toArray', 'filter', 'forEach'],
        { first: mockNodes[0], last: mockNodes[mockNodes.length - 1] });
        mockQuery.toArray.and.returnValue(mockNodes);
        // does not work with ...and.callFake(mockNodes.filter);
        mockQuery.filter.and.callFake((cb) => mockNodes.filter(cb));
        mockQuery.forEach.and.callFake((cb) => mockNodes.forEach(cb));
        mockEmitter = jasmine.createSpyObj('emitter', ['emit']);
        mockTree = jasmine.createSpyObj('tree',
        ['selectAllNodes', 'deselectAllNodes'],
        { selection: IGX_TREE_SELECTION_TYPE.BiState, nodeSelection: mockEmitter, nodes: mockQuery });
        selectionService.register(mockTree);
    });

    it('Should properly register the specified tree', () => {
        selectionService = new IgxTreeSelectionService();

        expect((selectionService as any).tree).toBeFalsy();

        selectionService.register(mockTree);
        expect((selectionService as any).tree).toEqual(mockTree);
    });

    it('Should return proper value when isNodeSelected is called', () => {
        const selectionSet: Set<IgxTreeNode<any>> = (selectionService as any).nodeSelection;

        expect(selectionSet.size).toBe(0);

        spyOn(selectionSet, 'clear').and.callThrough();

        const mockNode1 = jasmine.createSpyObj<IgxTreeNode<any>>(['id', 'selected']);
        const mockNode2 = jasmine.createSpyObj<IgxTreeNode<any>>(['id', 'selected']);
        expect(selectionService.isNodeSelected(mockNode1)).toBeFalsy();
        expect(selectionService.isNodeSelected(mockNode2)).toBeFalsy();

        selectionSet.add(mockNode1);
        expect(selectionService.isNodeSelected(mockNode1)).toBeTruthy();
        expect(selectionService.isNodeSelected(mockNode2)).toBeFalsy();
        expect(selectionSet.size).toBe(1);

        selectionService.clearNodesSelection();
        expect(selectionService.isNodeSelected(mockNode1)).toBeFalsy();
        expect(selectionService.isNodeSelected(mockNode2)).toBeFalsy();
        expect(selectionSet.clear).toHaveBeenCalled();
        expect(selectionSet.size).toBe(0);
    });

    it('Should handle selection based on tree.selection', () => {
        const mockNode = jasmine.createSpyObj<IgxTreeNode<any>>(['id', 'selected']);

        // none

        // https://jasmine.github.io/tutorials/spying_on_properties
        (Object.getOwnPropertyDescriptor(mockTree, 'selection').get as jasmine.Spy<any>).and.returnValue(IGX_TREE_SELECTION_TYPE.None);
        selectionService.selectNode(mockNode);
        expect(selectionService.isNodeSelected(mockNode)).toBeFalsy();
        expect(mockTree.nodeSelection.emit).not.toHaveBeenCalled();

        // https://jasmine.github.io/tutorials/spying_on_properties
        (Object.getOwnPropertyDescriptor(mockTree, 'selection').get as jasmine.Spy<any>).and.returnValue(IGX_TREE_SELECTION_TYPE.BiState);
        const expected: ITreeNodeSelectionEvent = {
            oldSelection: [], newSelection: [mockNode],
            added: [mockNode], removed: [], event: undefined, cancel: false
        };

        // BiState
        selectionService.selectNode(mockNode);
        expect(selectionService.isNodeSelected(mockNode)).toBeTruthy();
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledTimes(1);
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledWith(expected);
    });

    it('Should deselect nodes', () => {

        const mockNode1 = jasmine.createSpyObj<IgxTreeNode<any>>(['id', 'selected']);
        const mockNode2 = jasmine.createSpyObj<IgxTreeNode<any>>(['id', 'selected']);

        selectionService.deselectNode(mockNode1);
        expect(selectionService.isNodeSelected(mockNode1)).toBeFalsy();
        expect(selectionService.isNodeSelected(mockNode2)).toBeFalsy();
        expect(mockTree.nodeSelection.emit).not.toHaveBeenCalled();

        // mark a node as selected
        selectionService.selectNode(mockNode1);
        expect(selectionService.isNodeSelected(mockNode1)).toBeTruthy();
        expect(selectionService.isNodeSelected(mockNode2)).toBeFalsy();
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledTimes(1);

        // deselect node
        const expected: ITreeNodeSelectionEvent = {
            newSelection: [], oldSelection: [mockNode1],
            removed: [mockNode1], added: [], event: undefined, cancel: false
        };
        selectionService.deselectNode(mockNode1);
        expect(selectionService.isNodeSelected(mockNode1)).toBeFalsy();
        expect(selectionService.isNodeSelected(mockNode2)).toBeFalsy();
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledTimes(2);
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledWith(expected);
    });

    it('Should be able to select all nodes', () => {
        // no argument - should select all nodes
        selectionService.selectAllNodes();

        const expected: ITreeNodeSelectionEvent = {
            oldSelection: [], newSelection: [...mockNodes],
            added: [...mockNodes], removed: [], event: undefined, cancel: false
        };

        for (const node of mockNodes) {
            expect(selectionService.isNodeSelected(node)).toBeTruthy();
        }

        expect(mockTree.nodeSelection.emit).toHaveBeenCalledWith(expected);
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledTimes(1);
    });

    it('Should be able to select multiple nodes', () => {
        selectionService.selectAllNodes(mockNodes.slice(0, 3));

        const expected: ITreeNodeSelectionEvent = {
            oldSelection: [], newSelection: mockNodes.slice(0, 3),
            added: mockNodes.slice(0, 3), removed: [], event: undefined, cancel: false
        };

        for (const node of mockNodes.slice(0, 3)) {
            expect(selectionService.isNodeSelected(node)).toBeTruthy();
        }
        expect(selectionService.isNodeSelected(mockNodes[3])).toBeFalsy();
        expect(selectionService.isNodeSelected(mockNodes[4])).toBeFalsy();

        expect(mockTree.nodeSelection.emit).toHaveBeenCalledWith(expected);
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledTimes(1);
    });

    it('Should be able to clear selection when adding multiple nodes', () => {
        selectionService.selectAllNodes(mockNodes.slice(0, 3), true);

        let expected: ITreeNodeSelectionEvent = {
            oldSelection: [], newSelection: mockNodes.slice(0, 3),
            added: mockNodes.slice(0, 3), removed: [], event: undefined, cancel: false
        };

        for (const node of mockNodes.slice(0, 3)) {
            expect(selectionService.isNodeSelected(node)).toBeTruthy();
        }
        expect(selectionService.isNodeSelected(mockNodes[3])).toBeFalsy();
        expect(selectionService.isNodeSelected(mockNodes[4])).toBeFalsy();
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledWith(expected);
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledTimes(1);

        selectionService.selectAllNodes(mockNodes.slice(1, 4), true);

        expected = {
            oldSelection: mockNodes.slice(0, 3), newSelection: mockNodes.slice(1, 4),
            added: [mockNodes[3]], removed: [mockNodes[0]], event: undefined, cancel: false
        };

        for (const node of mockNodes.slice(1, 4)) {
            expect(selectionService.isNodeSelected(node)).toBeTruthy();
        }

        expect(selectionService.isNodeSelected(mockNodes[0])).toBeFalsy();
        expect(selectionService.isNodeSelected(mockNodes[4])).toBeFalsy();
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledWith(expected);
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledTimes(2);
    });

    it('Should add newly selected nodes to the existing selection', () => {
        // no argument - should select all nodes
        selectionService.selectNode(mockTree.nodes.first);

        let expected: ITreeNodeSelectionEvent = {
            oldSelection: [], newSelection: [mockQuery.first],
            added: [mockQuery.first], removed: [], event: undefined, cancel: false
        };

        expect(selectionService.isNodeSelected(mockNodes[0])).toBeTruthy();
        for (let i = 1; i < mockNodes.length; i++) {
            expect(selectionService.isNodeSelected(mockNodes[i])).toBeFalsy();
        }

        expect(mockTree.nodeSelection.emit).toHaveBeenCalledWith(expected);
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledTimes(1);

        expected = {
            oldSelection: [mockNodes[0]], newSelection: [mockNodes[0], mockNodes[1]],
            added: [mockNodes[1]], removed: [], event: undefined, cancel: false
        };

        selectionService.selectNode(mockTree.nodes.toArray()[1]);
        expect(selectionService.isNodeSelected(mockNodes[0])).toBeTruthy();
        expect(selectionService.isNodeSelected(mockNodes[1])).toBeTruthy();
    });

    it('Should be able to select a range of nodes', () => {
        selectionService.selectNode(mockNodes[0]);

        // only first node is selected
        expect(selectionService.isNodeSelected(mockNodes[0])).toBeTruthy();
        for (let i = 1; i < mockNodes.length; i++) {
            expect(selectionService.isNodeSelected(mockNodes[i])).toBeFalsy();
        }

        // select all nodes from first to last
        selectionService.selectMultipleNodes(mockNodes[mockNodes.length - 1]);
        for (const node of mockNodes) {
            expect(selectionService.isNodeSelected(node)).toBeTruthy();
        }

        const expected: ITreeNodeSelectionEvent = {
            oldSelection: [mockNodes[0]], newSelection: mockNodes,
            added: mockNodes.slice(1, 5), removed: [], event: undefined, cancel: false
        };
        expect(mockTree.nodeSelection.emit).toHaveBeenCalledWith(expected);
    });
});

