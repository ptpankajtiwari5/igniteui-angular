import { Injectable } from '@angular/core';
import { IGX_TREE_SELECTION_TYPE } from './common';
import { IgxTreeNodeComponent } from './tree-node/tree-node.component';
import { IgxTreeComponent } from './tree.component';

@Injectable()
export class IgxTreeSelectionService {
    public tree: IgxTreeComponent;
    public nodeSelection: Set<IgxTreeNodeComponent<any>> = new Set<IgxTreeNodeComponent<any>>();

    public register(tree: IgxTreeComponent) {
        this.tree = tree;
    }

    /** Select all nodes if the nodes collection is empty. Otherwise, select the nodes in the nodes collection */
    public selectAllNodes(nodes?: IgxTreeNodeComponent<any>[], clearPrevSelection?: boolean) {
        if (nodes) {
            let removed = [];
            if (clearPrevSelection) {
                removed = this.getSelectedNodes().filter(n => nodes.indexOf(n) < 0);
            }
            const added = nodes.filter(n => this.getSelectedNodes().indexOf(n) < 0);
            this.emitNodeSelectionEvent(clearPrevSelection ? nodes : [...this.getSelectedNodes(), ...added], added, removed);
        } else {
            const addedNodes = this.allNodes.filter((n: IgxTreeNodeComponent<any>) => !this.isNodeSelected(n));
            const newSelection = this.nodeSelection.size ? this.getSelectedNodes().concat(addedNodes) : addedNodes;
            this.emitNodeSelectionEvent(newSelection, addedNodes, []);
        }
    }

    /** Select range from last selected node to the current specified node. */
    public selectMultipleNodes(node: IgxTreeNodeComponent<any>, event?): void {
        if (!this.nodeSelection.size) {
            this.selectNode(node);
            return;
        }
        const lastSelectedNodeIndex = this.tree.nodes.toArray().indexOf(this.getSelectedNodes()[this.nodeSelection.size - 1]);
        const currentNodeIndex = this.tree.nodes.toArray().indexOf(node);
        const nodes = this.tree.nodes.toArray().slice(Math.min(currentNodeIndex, lastSelectedNodeIndex),
            Math.max(currentNodeIndex, lastSelectedNodeIndex) + 1);

        const added = nodes.filter(_node => !this.isNodeSelected(_node));
        const newSelection = this.getSelectedNodes().concat(added);
        this.emitNodeSelectionEvent(newSelection, added, [], event);
    }

    /** Select the specified node and emit event. */
    public selectNode(node: IgxTreeNodeComponent<any>, event?): void {
        // TODO: handle cascade mode
        if (this.tree.selection === IGX_TREE_SELECTION_TYPE.None) {
            return;
        }
        this.emitNodeSelectionEvent([...this.getSelectedNodes(), node], [node], [], event);
    }

    /** Deselect the specified node and emit event. */
    public deselectNode(node: IgxTreeNodeComponent<any>, event?): void {
        // TODO: handle cascade mode
        const newSelection = this.getSelectedNodes().filter(r => r !== node);
        this.emitNodeSelectionEvent(newSelection, [], [node], event);
    }

    /** Select specified nodes. No event is emitted. */
    public selectNodesWithNoEvent(nodes: IgxTreeNodeComponent<any>[], clearPrevSelection?: boolean): void {
        // TODO: add to spec
        // TODO: handle cascade mode
        if (clearPrevSelection) {
            this.nodeSelection.clear();
        }
        nodes.forEach(node => this.nodeSelection.add(node));
    }

    /** Deselect specified nodes. No event is emitted. */
    public deselectNodesWithNoEvent(nodes: IgxTreeNodeComponent<any>[]): void {
        // TODO: add to spec
        // TODO: handle cascade mode
        nodes.forEach(node => this.nodeSelection.delete(node));
    }

    public clearNodesSelection(): void {
        this.nodeSelection.clear();
    }

    public isNodeSelected(node: IgxTreeNodeComponent<any>): boolean {
        return this.nodeSelection.size > 0 && this.nodeSelection.has(node);
    }

    /** Returns array of the selected node id's. */
    private getSelectedNodes(): Array<any> {
        return this.nodeSelection.size ? Array.from(this.nodeSelection) : [];
    }

    private emitNodeSelectionEvent(newSelection, added, removed, event?): boolean {
        const currSelection = this.getSelectedNodes();
        if (this.areEqualCollections(currSelection, newSelection)) {
            return;
        }

        const args = {
            oldSelection: currSelection, newSelection,
            added, removed, event, cancel: false
        };
        this.tree.nodeSelection.emit(args);
        if (args.cancel) {
            return;
        }
        this.selectNodesWithNoEvent(args.newSelection, true);
    }

    private get allNodes() {
        return this.tree.nodes;
    }

    private areEqualCollections(first, second): boolean {
        return first.length === second.length && new Set(first.concat(second)).size === first.length;
    }
}
