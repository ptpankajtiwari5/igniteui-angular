import { By } from '@angular/platform-browser';

export const TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS = 'igx-tree-node__select-marker';
export const TREE_NODE_SELECTION_CSS_CLASS = '.igx-checkbox--checked';
const CHECKBOX_INPUT_CSS_CLASS = '.igx-checkbox__input';

export class TreeFunctions {

    public static getAllNodes(fix) {
        return fix.debugElement.queryAll(By.css('igx-tree-node'));
    }

    public static getNodeCheckboxDiv(nodeDOM): HTMLElement {
        return nodeDOM.querySelector(`.${TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS}`);
    }

    public static getNodeCheckboxInput(nodeDOM): HTMLInputElement {
        return TreeFunctions.getNodeCheckboxDiv(nodeDOM).querySelector(CHECKBOX_INPUT_CSS_CLASS);
    }

    public static clickNodeCheckbox(node) {
        const checkboxElement = TreeFunctions.getNodeCheckboxDiv(node.nativeElement);
        checkboxElement.dispatchEvent(new Event('click', {}));
    }

    public static verifyNodeSelected(node, selected = true, hasCheckbox = true) {
        expect(node.selected).toBe(selected);
        if (hasCheckbox) {
            expect(this.getNodeCheckboxDiv(node.nativeElement)).not.toBeNull();
            expect(TreeFunctions.getNodeCheckboxInput(node.nativeElement).checked).toBe(selected);
        }
    }
}
