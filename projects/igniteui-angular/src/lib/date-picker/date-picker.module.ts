import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IgxCalendarModule } from '../calendar/public_api';
import { IgxButtonModule } from '../directives/button/button.directive';
import { IgxDateTimeEditorModule } from '../directives/date-time-editor/public_api';
import { IgxMaskModule } from '../directives/mask/mask.directive';
import { IgxRippleModule } from '../directives/ripple/ripple.directive';
import { IgxTextSelectionModule } from '../directives/text-selection/text-selection.directive';
import { IgxIconModule } from '../icon/public_api';
import { IgxInputGroupModule } from '../input-group/public_api';
import { IgxCalendarContainerComponent } from './calendar-container.component';
import { IgxDatePickerComponent } from './date-picker.component';
import { IgxDatePickerActionsDirective, IgxDatePickerTemplateDirective } from './date-picker.directives';
import { DatePickerDisplayValuePipe, DatePickerInputValuePipe } from './date-picker.pipes';

/** @hidden */
@NgModule({
    declarations: [
        IgxDatePickerComponent,
        IgxCalendarContainerComponent,
        IgxDatePickerActionsDirective,
        IgxDatePickerTemplateDirective,
        DatePickerDisplayValuePipe,
        DatePickerInputValuePipe
    ],
    entryComponents: [
        IgxCalendarContainerComponent
    ],
    exports: [
        IgxDatePickerComponent,
        IgxDatePickerTemplateDirective,
        IgxDatePickerActionsDirective,
        DatePickerDisplayValuePipe,
        DatePickerInputValuePipe,
        IgxInputGroupModule
    ],
    imports: [
        CommonModule,
        IgxIconModule,
        IgxInputGroupModule,
        IgxCalendarModule,
        IgxButtonModule,
        IgxRippleModule,
        IgxMaskModule,
        IgxTextSelectionModule,
        IgxDateTimeEditorModule,
        FormsModule
    ]
})
export class IgxDatePickerModule { }
