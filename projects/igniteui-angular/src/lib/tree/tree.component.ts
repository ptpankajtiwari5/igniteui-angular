import { CommonModule } from '@angular/common';
import { Component, QueryList, Input, Output, EventEmitter, ContentChild, Directive,
    NgModule, TemplateRef, OnInit, AfterViewInit, ContentChildren, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { growVerIn, growVerOut } from '../animations/grow';
import { IgxCheckboxModule } from '../checkbox/checkbox.component';
import { IgxExpansionPanelModule } from '../expansion-panel/public_api';
import { ToggleAnimationSettings } from '../expansion-panel/toggle-animation-component';
import { IgxIconModule } from '../icon/public_api';
import { IgxInputGroupModule } from '../input-group/public_api';
import { IGX_TREE_COMPONENT, IGX_TREE_SELECTION_TYPE, IgxTree, ITreeNodeToggledEventArgs,
    ITreeNodeTogglingEventArgs, ITreeNodeSelectionEvent, IgxTreeNode, IgxTreeSearchResolver } from './common';
import { IgxTreeNodeComponent } from './tree-node/tree-node.component';
import { IgxTreeSelectionService } from './tree-selection.service';
import { IgxTreeService } from './tree.service';

let init_id = 0;

@Directive({
    selector: '[igxTreeSelectMarker]'
})
export class IgxTreeSelectMarkerDirective {
}

@Directive({
    selector: '[igxTreeExpandIndicator]'
})
export class IgxTreeExpandIndicatorDirective {
}

@Component({
    selector: 'igx-tree',
    templateUrl: 'tree.component.html',
    styleUrls: ['tree.component.scss'],
    providers: [
        IgxTreeService,
        IgxTreeSelectionService,
        { provide: IGX_TREE_COMPONENT, useExisting: IgxTreeComponent},
    ]
})
export class IgxTreeComponent implements IgxTree, OnInit, AfterViewInit, OnDestroy {


    @Input()
    public selection: IGX_TREE_SELECTION_TYPE = IGX_TREE_SELECTION_TYPE.BiState;

    @Input()
    public singleBranchExpand = false;

    @Input()
    public animationSettings: ToggleAnimationSettings = {
        openAnimation: growVerIn,
        closeAnimation: growVerOut
    };

    @Output()
    public nodeSelection = new EventEmitter<ITreeNodeSelectionEvent>();

    @Output()
    public nodeExpanding = new EventEmitter<ITreeNodeTogglingEventArgs>();

    @Output()
    public nodeExpanded = new EventEmitter<ITreeNodeToggledEventArgs>();

    @Output()
    public nodeCollapsing = new EventEmitter<ITreeNodeTogglingEventArgs>();

    @Output()
    public nodeCollapsed = new EventEmitter<ITreeNodeToggledEventArgs>();

    @ContentChild(IgxTreeSelectMarkerDirective, { read: TemplateRef })
    public selectMarker: TemplateRef<any>;

    @ContentChild(IgxTreeExpandIndicatorDirective, { read: TemplateRef })
    public expandIndicator: TemplateRef<any>;

    @ContentChildren(IgxTreeNodeComponent, { descendants: true })
    public nodes: QueryList<IgxTreeNodeComponent<any>>;

    public id = `tree-${init_id++}`;

    constructor(private selectionService: IgxTreeSelectionService, private treeService: IgxTreeService) {
        this.treeService.register(this);
    }

    public expandAll(nodes: IgxTreeNode<any>[]) {}
    public collapseAll(nodes: IgxTreeNode<any>[]) {}

    public selectAll(nodes: IgxTreeNodeComponent<any>[]) {
        if(nodes) {
            this.selectionService.selectAllNodes(nodes);
        }  else {
            this.selectionService.selectAllNodes();
        }
    }

    public isNodeSelected(node: IgxTreeNodeComponent<any>): boolean {
        return this.selectionService.isNodeSelected(node);
    }


    public findNodes<T>(searchTerm: T, comparer?: IgxTreeSearchResolver): IgxTreeNode<T>[] | null {
        const compareFunc = comparer || this._comparer;
        return this.nodes.filter(e => compareFunc(searchTerm, e));
    }

    public ngOnInit() {
        this.selectionService.tree = this;
    }
    public ngAfterViewInit() {

    }

    public ngOnDestroy() {}

    private _comparer = <T>(data: T, node: IgxTreeNodeComponent<T>, ) => node.data === data;
}

/**
 * NgModule defining the components and directives needed for `igx-tree`
 */
@NgModule({
    declarations: [
        IgxTreeSelectMarkerDirective,
        IgxTreeExpandIndicatorDirective,
        IgxTreeComponent,
        IgxTreeNodeComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        IgxIconModule,
        IgxInputGroupModule,
        IgxCheckboxModule,
        IgxExpansionPanelModule
    ],
    exports: [
        IgxTreeSelectMarkerDirective,
        IgxTreeExpandIndicatorDirective,
        IgxTreeComponent,
        IgxTreeNodeComponent,
        IgxIconModule,
        IgxInputGroupModule,
        IgxCheckboxModule,
        IgxExpansionPanelModule
    ]
})
export class IgxTreeModule {
}
