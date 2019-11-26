import { Component } from '@angular/core';
import { IgxInputGroupComponent } from '../input-group/input-group.component';
import { IgxInputGroupBase } from '../input-group/input-group.common';

@Component({
    selector: 'igx-date-start',
    templateUrl: 'igx-date-range-inputs.common.html',
    providers: [{ provide: IgxInputGroupBase, useExisting: IgxDateStartComponent }]
})
export class IgxDateStartComponent extends IgxInputGroupComponent {
}

@Component({
    selector: 'igx-date-end',
    templateUrl: 'igx-date-range-inputs.common.html',
    providers: [{ provide: IgxInputGroupBase, useExisting: IgxDateEndComponent }]
})
export class IgxDateEndComponent extends IgxInputGroupComponent {
}