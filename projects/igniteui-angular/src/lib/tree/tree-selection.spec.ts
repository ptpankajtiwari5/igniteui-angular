import { TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from '../test-utils/configure-suite';
import { Component, ViewChild } from '@angular/core';
import { IgxTreeComponent, IgxTreeModule } from './tree.component';
import { HIERARCHICAL_SAMPLE_DATA } from 'src/app/shared/sample-data';
import { wait, UIInteractions } from '../test-utils/ui-interactions.spec';
import { TreeFunctions, TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS, TREE_NODE_SELECTION_CSS_CLASS } from './tree-functions.spec';
import { IGX_TREE_SELECTION_TYPE } from './common';

describe('IgxTree - Selection', () => {
    configureTestSuite();
    let fix;
    let tree: IgxTreeComponent;
    beforeAll(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxTreeSimpleComponent
            ],
            imports: [IgxTreeModule, NoopAnimationsModule]
        })
            .compileComponents();
    }));

    describe('UI Interaction tests', () => {
        beforeEach(async () => {
            fix = TestBed.createComponent(IgxTreeSimpleComponent);
            fix.detectChanges();

            tree = fix.componentInstance.tree;
            tree.selection = 'BiState';
            await wait();
            fix.detectChanges();
        });

        it('Should have checkbox on each node if selection is not none', () => {
            const nodes = TreeFunctions.getAllNodes(fix);
            expect(nodes.length).toBe(4);
            nodes.forEach((node) => {
                const checkBoxElement = node.nativeElement.querySelector(`.${TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS}`);
                expect(checkBoxElement).not.toBeNull();
            });

            tree.selection = 'None';
            fix.detectChanges();

            expect(nodes.length).toBe(4);
            nodes.forEach((node) => {
                const checkBoxElement = node.nativeElement.querySelector(`.${TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS}`);
                expect(checkBoxElement).toBeNull();
            });
        });

        it('Should be able to change node selection to none', () => {
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.BiState);
            const firstNode = tree.nodes.toArray()[0];
            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();
            TreeFunctions.verifyNodeSelected(firstNode);

            tree.selection = 'None';
            fix.detectChanges();
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.None);
            TreeFunctions.verifyNodeSelected(firstNode, false, false);
        });

        it('Checkbox should select/deselect node', () => {
            const firstNode = tree.nodes.toArray()[0];
            firstNode.expanded = true;
            fix.detectChanges();
            const secondNode = tree.nodes.toArray()[1];
            spyOn(tree.nodeSelection, 'emit').and.callThrough();

            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            expect(tree.nodeSelection.emit).toHaveBeenCalledTimes(1);
            let args: any = {
                added: [firstNode],
                cancel: false,
                event: jasmine.anything() as any,
                newSelection: [firstNode],
                oldSelection: [],
                removed: []
            };
            expect(tree.nodeSelection.emit).toHaveBeenCalledWith(args);

            TreeFunctions.verifyNodeSelected(firstNode);
            TreeFunctions.verifyNodeSelected(secondNode, false);

            TreeFunctions.clickNodeCheckbox(secondNode);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode);
            TreeFunctions.verifyNodeSelected(secondNode);

            expect(tree.nodeSelection.emit).toHaveBeenCalledTimes(2);
            args = {
                added: [secondNode],
                cancel: false,
                event: jasmine.anything() as any,
                newSelection: [firstNode, secondNode],
                oldSelection: [firstNode],
                removed: []
            };
            expect(tree.nodeSelection.emit).toHaveBeenCalledWith(args);

            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode, false);
            TreeFunctions.verifyNodeSelected(secondNode);

            expect(tree.nodeSelection.emit).toHaveBeenCalledTimes(3);
            args = {
                added: [],
                cancel: false,
                event: jasmine.anything() as any,
                newSelection: [secondNode],
                oldSelection: [firstNode, secondNode],
                removed: [firstNode]
            };
            expect(tree.nodeSelection.emit).toHaveBeenCalledWith(args);

            TreeFunctions.clickNodeCheckbox(secondNode);
            fix.detectChanges();
            TreeFunctions.verifyNodeSelected(firstNode, false);
            TreeFunctions.verifyNodeSelected(secondNode, false);

            expect(tree.nodeSelection.emit).toHaveBeenCalledTimes(4);
            args = {
                added: [],
                cancel: false,
                event: jasmine.anything() as any,
                newSelection: [],
                oldSelection: [secondNode],
                removed: [secondNode]
            };
            expect(tree.nodeSelection.emit).toHaveBeenCalledWith(args);
        });

        it('Nodes Should be selected only from checkboxes', () => {
            const firstNode = tree.nodes.toArray()[0];
            firstNode.expanded = true;
            fix.detectChanges();
            const secondNode = tree.nodes.toArray()[1];

            UIInteractions.simulateClickEvent(firstNode.nativeElement);
            fix.detectChanges();
            UIInteractions.simulateClickEvent(secondNode.nativeElement);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode, false);
            TreeFunctions.verifyNodeSelected(secondNode, false);
        });

        it('Should select multiple nodes with Shift + Click', () => {
            tree.nodes.toArray()[0].expanded = true;
            fix.detectChanges();
            const firstNode = tree.nodes.toArray()[10];

            tree.nodes.toArray()[14].expanded = true;
            fix.detectChanges();
            const secondNode = tree.nodes.toArray()[15];

            const mockEvent = new MouseEvent('click', { shiftKey: true });

            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode);

            // Click on other node holding Shift key
            secondNode.nativeElement.querySelector(`.${TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS}`).dispatchEvent(mockEvent);
            fix.detectChanges();

            for (let index = 10; index < 16; index++) {
                const node = tree.nodes.toArray()[index];
                TreeFunctions.verifyNodeSelected(node);
            }
        });

        it('Should persist the selection after expand/collapse', fakeAsync(() => {
            const firstNode = tree.nodes.toArray()[0];
            firstNode.expanded = true;
            fix.detectChanges();
            const secondNode = tree.nodes.toArray()[1];

            TreeFunctions.clickNodeCheckbox(firstNode);
            TreeFunctions.clickNodeCheckbox(secondNode);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode);
            TreeFunctions.verifyNodeSelected(secondNode);

            expect(getVisibleSelectedNodes(fix).length).toBe(2);

            // Collapse node and verify visible selected nodes
            firstNode.expanded = false;
            tick();
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode);
            TreeFunctions.verifyNodeSelected(secondNode);

            expect(getVisibleSelectedNodes(fix).length).toBe(1);

            // Expand same node and verify visible selected nodes
            firstNode.expanded = true;
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode);
            TreeFunctions.verifyNodeSelected(secondNode);

            expect(getVisibleSelectedNodes(fix).length).toBe(2);
        }));

        it('Should be able to cancel nodeSelection event', () => {
            const firstNode = tree.nodes.toArray()[0];

            tree.nodeSelection.subscribe((e: any) => {
                e.cancel = true;
            });

            // Click on a node checkbox
            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();
            TreeFunctions.verifyNodeSelected(firstNode, false);
        });

        it('Should be able to programmatically overwrite the selection using nodeSelection event', () => {
            const firstNode = tree.nodes.toArray()[0];

            tree.nodeSelection.subscribe((e: any) => {
                e.newSelection = [tree.nodes.toArray()[1], tree.nodes.toArray()[14]];
            });

            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode, false);
            TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[1]);
            TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[14]);
        });
    });

    describe('API tests', () => {
        beforeEach(async () => {
            fix = TestBed.createComponent(IgxTreeSimpleComponent);
            fix.detectChanges();

            tree = fix.componentInstance.tree;
            tree.selection = 'BiState';
            await wait();
            fix.detectChanges();
        });

        it('Should be able to select multiple nodes through API', () => {
            const firstNode = tree.nodes.toArray()[0];
            const secondNode = tree.nodes.toArray()[14];

            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            tree.selectAll([secondNode], true);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode, false);
            TreeFunctions.verifyNodeSelected(secondNode);

            tree.selectAll([firstNode], false);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode);
            TreeFunctions.verifyNodeSelected(secondNode);
        });

        it('Should be able to select/deselect all nodes through API', () => {
            tree.selectAll();
            fix.detectChanges();

            for (let index = 0; index < 27; index++) {
                const node = tree.nodes.toArray()[index];
                TreeFunctions.verifyNodeSelected(node);
            }

            tree.deselectAll();
            fix.detectChanges();

            for (let index = 0; index < 27; index++) {
                const node = tree.nodes.toArray()[index];
                TreeFunctions.verifyNodeSelected(node, false);
            }
        });

        it('Should be able to deselect multiple nodes through API', () => {
            const firstNode = tree.nodes.toArray()[0];
            const secondNode = tree.nodes.toArray()[14];

            TreeFunctions.clickNodeCheckbox(firstNode);
            TreeFunctions.clickNodeCheckbox(secondNode);
            fix.detectChanges();

            spyOn(tree.nodeSelection, 'emit').and.callThrough();

            tree.deselectAll([firstNode]);
            fix.detectChanges();

            expect(tree.nodeSelection.emit).toHaveBeenCalledTimes(1);
            const args: any = {
                added: [],
                cancel: false,
                event: undefined,
                newSelection: [secondNode],
                oldSelection: [firstNode, secondNode],
                removed: [firstNode]
            };
            expect(tree.nodeSelection.emit).toHaveBeenCalledWith(args);

            TreeFunctions.verifyNodeSelected(firstNode, false);
            TreeFunctions.verifyNodeSelected(secondNode);
        });
    });
});

@Component({
    template: `
    <igx-tree #tree1 class="medium">
            <igx-tree-node *ngFor="let node of data" [selected]="node.ID === 'ALFKI'" [data]="node">
                {{ node.CompanyName }}
                <igx-tree-node *ngFor="let child of node.ChildCompanies" [data]="child">
                    {{ child.CompanyName }}
                    <igx-tree-node *ngFor="let leafchild of child.ChildCompanies" [data]="leafchild">
                        {{ leafchild.CompanyName }}
                    </igx-tree-node>
                </igx-tree-node>
            </igx-tree-node>
        </igx-tree>
    `
})
export class IgxTreeSimpleComponent {
    @ViewChild(IgxTreeComponent, { static: true }) public tree: IgxTreeComponent;
    public data = HIERARCHICAL_SAMPLE_DATA;
}

const getVisibleSelectedNodes = (fix) => TreeFunctions.getAllNodes(fix).filter(
    (node) => node.nativeElement.querySelector(TREE_NODE_SELECTION_CSS_CLASS));
