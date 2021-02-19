import { Injectable } from '@angular/core';
import { IGX_TREE_SELECTION_TYPE } from './common';
import { IgxTreeNodeComponent } from './tree-node/tree-node.component';
import { IgxTreeComponent } from './tree.component';

@Injectable()
export class IgxTreeSelectionService {
    public tree: IgxTreeComponent;
    public nodeSelection: Set<string> = new Set<string>();

    /** Returns array of the selected node id's. */
    public getSelectedNodes(): Array<any> {
        return this.nodeSelection.size ? Array.from(this.nodeSelection.keys()) : [];
    }

    /** Select all rows, if filtering is applied select only from filtered data. */
    public selectAllNodes(node?: IgxTreeNodeComponent<any>[]) {
        // const allRowIDs = this.getRowIDs(this.allData);
        // this.selectedRowsChange.next();
        // this.emitRowSelectionEvent(newSelection, addedRows, [], event);
        if(node) {

        } else {
            const addedNodes = this.allNodes.filter((n: IgxTreeNodeComponent<any>) => !this.isNodeSelected(n)).map(n => n.id);
            const newSelection = this.nodeSelection.size ? this.getSelectedNodes().concat(addedNodes) : addedNodes;
            this.emitRowSelectionEvent(newSelection, addedNodes, []);
        }
    }

    /** Select the specified row and emit event. */
    public selectNodeById(nodeId, clearPrevSelection?, event?): void {
        if (this.tree.selection === IGX_TREE_SELECTION_TYPE.None) {
            return;
        }
        // clearPrevSelection = !this.grid.isMultiRowSelectionEnabled || clearPrevSelection;

        const newSelection = clearPrevSelection ? [nodeId] : this.getSelectedNodes().indexOf(nodeId) !== -1 ?
            this.getSelectedNodes() : [...this.getSelectedNodes(), nodeId];
        const removed = clearPrevSelection ? this.getSelectedNodes() : [];
        this.emitRowSelectionEvent(newSelection, [nodeId], removed, event);
    }

    /** Deselect the specified row and emit event. */
    public deselectNode(nodeId, event?): void {
        const newSelection = this.getSelectedNodes().filter(r => r !== nodeId);
        if (this.nodeSelection.size && this.nodeSelection.has(nodeId)) {
            this.emitRowSelectionEvent(newSelection, [], [nodeId], event);
        }
    }

    /** Select specified nodes. No event is emitted. */
    public selectNodesWithNoEvent(nodeIDs: any[], clearPrevSelection?): void {
        if (clearPrevSelection) {
            this.nodeSelection.clear();
        }
        nodeIDs.forEach(nodeID => this.nodeSelection.add(nodeID));
    }

    /** Deselect specified rows. No event is emitted. */
    public deselectNodesWithNoEvent(nodeIDs: any[]): void {
        nodeIDs.forEach(nodeID => this.nodeSelection.delete(nodeID));
    }

    public isNodeSelected(node: IgxTreeNodeComponent<any>): boolean {
        return this.nodeSelection.size > 0 && this.nodeSelection.has(node.id);
    }

    public emitRowSelectionEvent(newSelection, added, removed, event?): boolean {
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

    /** Clear nodeSelection */
    public clearAllSelectedRows(): void {
        this.nodeSelection.clear();
    }

    public get allNodes() {
        return this.tree.nodes;
    }

    private areEqualCollections(first, second): boolean {
        return first.length === second.length && new Set(first.concat(second)).size === first.length;
    }
}
