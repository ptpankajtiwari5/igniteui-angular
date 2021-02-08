import {
    Component, ContentChild, EventEmitter, HostBinding, Input,
    OnDestroy, Output, ViewChild, ElementRef, Inject, ChangeDetectorRef, HostListener,
    NgModuleRef, OnInit, AfterViewInit, Injector, AfterViewChecked, ContentChildren,
    QueryList, Renderer2, LOCALE_ID, Optional, OnChanges, SimpleChanges
} from '@angular/core';
import {
    ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, AbstractControl,
    NG_VALIDATORS, ValidationErrors, Validator
} from '@angular/forms';
import {
    IgxCalendarComponent, IgxCalendarHeaderTemplateDirective, IgxCalendarSubheaderTemplateDirective,
    WEEKDAYS, isDateInRanges
} from '../calendar/public_api';
import {
    IgxInputDirective, IgxInputGroupComponent, IgxInputState,
    IgxLabelDirective, IGX_INPUT_GROUP_TYPE, IgxInputGroupType
} from '../input-group/public_api';
import { Subject, fromEvent, Subscription, noop } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { IgxOverlayOutletDirective } from '../directives/toggle/toggle.directive';
import {
    OverlaySettings, IgxOverlayService, AbsoluteScrollStrategy,
    AutoPositionStrategy
} from '../services/public_api';
import { DateRangeDescriptor } from '../core/dates/dateRange';
import { EditorProvider } from '../core/edit-provider';
import { KEYS, isEqual, IBaseEventArgs, mkenum } from '../core/utils';
import { IgxDatePickerActionsDirective } from './date-picker.directives';
import { IgxCalendarContainerComponent } from './calendar-container.component';
import { InteractionMode } from '../core/enums';
import { fadeIn, fadeOut } from '../animations/fade';
import { PickersBaseDirective } from '../date-common/pickers-base.directive';
import { DisplayDensityToken, IDisplayDensityOptions } from '../core/density';
import { IgxDateTimeEditorDirective } from '../directives/date-time-editor/public_api';
import { IgxPickerToggleComponent } from '../date-range-picker/public_api';
import { DeprecateMethod, DeprecateProperty } from '../core/deprecateDecorators';
import { DatePickerUtil } from './date-picker.utils';

let NEXT_ID = 0;

/**
 * This interface is used to provide information about date picker reference and its current value
 * when onDisabledDate event is fired.
 */
export interface IDatePickerDisabledDateEventArgs extends IBaseEventArgs {
    datePicker: IgxDatePickerComponent;
    currentValue: Date;
}

/**
 * This interface is used to provide information about date picker reference and its previously valid value
 * when onValidationFailed event is fired.
 */
export interface IDatePickerValidationFailedEventArgs extends IBaseEventArgs {
    datePicker: IgxDatePickerComponent;
    prevValue: Date;
}

/**
 * This interface is used to configure calendar format view options.
 */
export interface IFormatViews {
    day?: boolean;
    month?: boolean;
    year?: boolean;
}

/**
 * This interface is used to configure calendar format options.
 */
export interface IFormatOptions {
    day?: string;
    month?: string;
    weekday?: string;
    year?: string;
}

/**
 * This enumeration is used to configure the date picker to operate with pre-defined format option used in Angular DatePipe.
 * 'https://angular.io/api/common/DatePipe'
 * 'shortDate': equivalent to 'M/d/yy' (6/15/15).
 * 'mediumDate': equivalent to 'MMM d, y' (Jun 15, 2015).
 * 'longDate': equivalent to 'MMMM d, y' (June 15, 2015).
 * 'fullDate': equivalent to 'EEEE, MMMM d, y' (Monday, June 15, 2015).
 */
export const PredefinedFormatOptions = mkenum({
    ShortDate: 'shortDate',
    MediumDate: 'mediumDate',
    LongDate: 'longDate',
    FullDate: 'fullDate'
});
export type PredefinedFormatOptions = (typeof PredefinedFormatOptions)[keyof typeof PredefinedFormatOptions];

export const HeaderOrientation = mkenum({
    Horizontal: 'horizontal',
    Vertical: 'vertical'
});

/**
 * Date Picker displays a popup calendar that lets users select a single date.
 *
 * @igxModule IgxDatePickerModule
 * @igxTheme igx-calendar-theme, igx-icon-theme
 * @igxGroup Scheduling
 * @igxKeywords  datepicker, calendar, schedule, date
 * @example
 * ```html
 * <igx-date-picker [(ngModel)]="selectedDate"></igx-date-picker>
 * ```
 */
@Component({
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: IgxDatePickerComponent, multi: true },
        { provide: NG_VALIDATORS, useExisting: IgxDatePickerComponent, multi: true }
    ],
    selector: 'igx-date-picker',
    templateUrl: 'date-picker.component.html',
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class IgxDatePickerComponent extends PickersBaseDirective implements ControlValueAccessor, Validator,
    EditorProvider, OnChanges, OnInit, AfterViewInit, OnDestroy, AfterViewChecked { // TODO: move EditorProvider in BaseClass
    /**
     * Gets/Sets the default template editor's tabindex.
     *
     * @example
     * ```html
     * <igx-date-picker editorTabIndex="1"></igx-date-picker>
     * ```
     */
    @Input() public editorTabIndex: number; // TODO: move to editor provider

    /**
     * Gets/Sets the `IgxDatePickerComponent` label visibility.
     *
     * @remarks
     * By default the visibility is set to true.
     * @example
     * <igx-date-picker [labelVisibility]="false"></igx-date-picker>
     */
    @Input()
    public labelVisibility = true;

    /**
     * Gets/Sets on which day the week starts.
     *
     * @example
     * ```html
     * <igx-date-picker [weekStart]="WEEKDAYS.FRIDAY" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     * ```
     */
    @Input()
    public weekStart = WEEKDAYS.SUNDAY;

    /**
     * Gets/Sets whether the inactive dates will be hidden.
     *
     * @remarks
     * Applies to dates that are out of the current month.
     * Default value is `false`.
     * @example
     * ```html
     * <igx-date-picker [hideOutsideDays]="true"></igx-date-picker>
     * ```
     * @example
     * ```typescript
     * let hideOutsideDays = this.datePicker.hideOutsideDays;
     * ```
     */
    @Input()
    public hideOutsideDays: boolean;

    /**
     * Gets/Sets the number of month views displayed.
     *
     * @remarks
     * Default value is `1`.
     *
     * @example
     * ```html
     * <igx-date-picker [monthsViewNumber]="2"></igx-date-picker>
     * ```
     * @example
     * ```typescript
     * let monthViewsDisplayed = this.datePicker.monthsViewNumber;
     * ```
     */
    @Input()
    public displayMonthsCount = 1;

    /**
     * Show/hide week numbers
     *
     * @example
     * ```html
     * <igx-date-picker [showWeekNumbers]="true"></igx-date-picker>
     * ``
     */
    @Input()
    public showWeekNumbers: boolean;

    /**
     * Gets/Sets the date mask of the `IgxDatePickerComponent` when in editable dropdown mode.
     *
     *  @example
     * ```typescript
     * let mask = this.datePicker.mask;
     * ```
     */
    @Input()
    public mask: string; // deprecate use inputFormat

    /**
     * Gets/Sets a custom formatter function on the selected or passed date.
     *
     * @example
     * ```html
     * <igx-date-picker [value]="date" [formatter]="formatter"></igx-date-picker>
     * ```
     */
    @DeprecateProperty('formatter has been deprecated, use displayFormat instead.')
    @Input()
    public formatter: (val: Date) => string;

    /**
     * Gets/Sets the orientation of the `IgxDatePickerComponent` header.
     *
     *  @example
     * ```html
     * <igx-date-picker [vertical]="'true'" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     * ```
     */
    @Input()
    public headerOrientation = HeaderOrientation.Horizontal;

    /**
     * Gets/Sets the today button's label.
     *
     *  @example
     * ```html
     * <igx-date-picker cancelButtonLabel="cancel" todayButtonLabel="Tomorrow"></igx-date-picker>
     * ```
     */
    @Input()
    public todayButtonLabel: string;

    /**
     * *Gets/Sets the cancel button's label.
     *
     * @example
     * ```html
     * <igx-date-picker cancelButtonLabel="Close" todayButtonLabel="Today"></igx-date-picker>
     * ```
     */
    @Input()
    public cancelButtonLabel: string;

    /**
     * Gets/Sets the interaction mode - dialog or drop down.
     *
     *  @example
     * ```html
     * <igx-date-picker mode="dropdown"></igx-date-picker>
     * ```
     */
    @Input()
    public mode: InteractionMode = InteractionMode.DropDown;

    /**
     * Gets/Sets whether date should spin continuously or stop when min/max is reached.
     *
     *  @example
     * ```html
     * <igx-date-picker [isSpinLoop]="false"></igx-date-picker>
     * ```
     */
    @Input()
    public isSpinLoop = true;

    /**
     * Gets/Sets the container used for the popup element.
     *
     * @remarks
     *  `outlet` is an instance of `IgxOverlayOutletDirective` or an `ElementRef`.
     * @example
     * ```html
     * <div igxOverlayOutlet #outlet="overlay-outlet"></div>
     * //..
     * <igx-date-picker [outlet]="outlet"></igx-date-picker>
     * //..
     * ```
     */
    @Input()
    public outlet: IgxOverlayOutletDirective | ElementRef;

    /**
     * Gets/Sets the value of `id` attribute.
     *
     * @remarks If not provided it will be automatically generated.
     * @example
     * ```html
     * <igx-date-picker [id]="'igx-date-picker-3'" cancelButtonLabel="cancel" todayButtonLabel="today"></igx-date-picker>
     * ```
     */
    @Input()
    @HostBinding('attr.id')
    public id = `igx-date-picker-${NEXT_ID++}`;

    //#region calendar members

    /**
     * Gets/Sets the format views of the `IgxDatePickerComponent`.
     *
     * @example
     * ```typescript
     * let formatViews = this.datePicker.formatViews;
     *  this.datePicker.formatViews = {day:false, month: false, year:false};
     * ```
     */
    @Input()
    public get formatViews(): IFormatViews {
        return this._formatViews;
    }

    public set formatViews(formatViews: IFormatViews) {
        this._formatViews = Object.assign(this._formatViews, formatViews);
    }

    /**
     * Gets/Sets the disabled dates descriptors.
     *
     * @example
     * ```typescript
     * let disabledDates = this.datepicker.disabledDates;
     * this.datePicker.disabledDates = [ {type: DateRangeType.Weekends}, ...];
     * ```
     */
    @Input()
    public get disabledDates(): DateRangeDescriptor[] {
        return this._disabledDates;
    }
    public set disabledDates(value: DateRangeDescriptor[]) {
        this._disabledDates = value;
        this._onValidatorChange();
    }

    /**
     * Gets/Sets the special dates descriptors.
     *
     * @example
     * ```typescript
     * let specialDates = this.datepicker.specialDates;
     * this.datePicker.specialDates = [ {type: DateRangeType.Weekends}, ... ];
     * ```
     */
    @Input()
    public get specialDates(): DateRangeDescriptor[] {
        return this._specialDates;
    }
    public set specialDates(value: DateRangeDescriptor[]) {
        this._specialDates = value;
    }

    /**
     * Gets the format options of the `IgxDatePickerComponent`.
     *
     * @example
     * ```typescript
     * let formatOptions = this.datePicker.formatOptions;
     * ```
     */
    @Input()
    public get formatOptions(): IFormatOptions {
        return this._formatOptions;
    }

    /**
     * Sets the format options of the `IgxDatePickerComponent`.
     *
     * @example
     * ```typescript
     * this.datePicker.formatOptions = {  day: "numeric",  month: "long", weekday: "long", year: "numeric"};
     * ```
     */
    public set formatOptions(formatOptions: IFormatOptions) {
        this._formatOptions = Object.assign(this._formatOptions, formatOptions);
    }

    //#endregion

    /**
     * Gets/Sets the selected date.
     *
     *  @example
     * ```html
     * <igx-date-picker [value]="date"></igx-date-picker>
     * ```
     */
    @Input()
    public get value(): Date {
        return this._value;
    }
    public set value(date: Date) {
        this._value = date;
        this.onChangeCallback(date);
    }


    /**
     * Emitted when the picker's value changes.
     *
     * @example
     * ```html
     * <igx-date-picker (valueChange)="valueChanged($event)" mode="dropdown"></igx-date-picker>
     * ```
     */
    @Output()
    public valueChange = new EventEmitter<Date>();

    /**
     * Emitted when the user types/spins to a disabled date in the date-picker editor.
     *
     *  @example
     * ```html
     * <igx-date-picker (onDisabledDate)="onDisabledDate($event)"></igx-date-picker>
     * ```
     */
    // eslint-disable-next-line @angular-eslint/no-output-on-prefix
    @Output()
    @DeprecateProperty('onDisabledDate has been deprecated.')
    public onDisabledDate = new EventEmitter<IDatePickerDisabledDateEventArgs>();

    @Output()
    public selected = new EventEmitter<Date>();

    /**
     * Emitted when the user types/spins invalid date in the date-picker editor.
     *
     *  @example
     * ```html
     * <igx-date-picker (onValidationFailed)="onValidationFailed($event)"></igx-date-picker>
     * ```
     */
    @Output()
    public validationFailed = new EventEmitter<IDatePickerValidationFailedEventArgs>(); // TODO: bind to validationFailed of date editor

    /** @hidden @internal */
    @ViewChild(IgxDateTimeEditorDirective)
    public dateTimeEditor: IgxDateTimeEditorDirective;

    /** @hidden @internal */
    @ViewChild(IgxInputGroupComponent)
    public inputGroup: IgxInputGroupComponent;

    /** @hidden @internal */
    @ViewChild(IgxLabelDirective)
    public labelDirective: IgxLabelDirective;

    /** @hidden @internal */
    @ViewChild(IgxInputDirective)
    public inputDirective: IgxInputDirective;

    /** @hidden @internal */
    @ContentChildren(IgxPickerToggleComponent, { descendants: true })
    public toggleComponents: QueryList<IgxPickerToggleComponent>;

    /** @hidden @internal */
    @ContentChild(IgxLabelDirective)
    public label: IgxLabelDirective;

    /** @hidden @internal */
    @ContentChild(IgxCalendarHeaderTemplateDirective)
    public headerTemplate: IgxCalendarHeaderTemplateDirective;

    /** @hidden @internal */
    @ContentChild(IgxCalendarSubheaderTemplateDirective)
    public subheaderTemplate: IgxCalendarSubheaderTemplateDirective;

    /** @hidden @internal */
    @ContentChild(IgxDatePickerActionsDirective)
    public datePickerActionsDirective: IgxDatePickerActionsDirective;

    private get dialogOverlaySettings(): OverlaySettings {
        return Object.assign({}, this._dialogOverlaySettings, this.overlaySettings);
    }

    private get dropDownOverlaySettings(): OverlaySettings {
        return Object.assign({}, this._dropDownOverlaySettings, this.overlaySettings);
    }

    private _value: Date;
    private _empty = true;
    private _format: string;
    private hasHeader = true;
    private _componentID: string;
    private _destroy$ = new Subject();
    private _ngControl: NgControl = null;
    private _statusChanges$: Subscription;
    private calendar: IgxCalendarComponent;
    private _specialDates: DateRangeDescriptor[] = null;
    private _disabledDates: DateRangeDescriptor[] = null;
    private _dropDownOverlaySettings: OverlaySettings = {
        target: this.inputGroupElement,
        closeOnOutsideClick: true,
        modal: false,
        scrollStrategy: new AbsoluteScrollStrategy(),
        positionStrategy: new AutoPositionStrategy({
            openAnimation: fadeIn,
            closeAnimation: fadeOut
        }),
        outlet: this.outlet
    };
    private _dialogOverlaySettings: OverlaySettings = {
        closeOnOutsideClick: true,
        modal: true,
        closeOnEscape: true,
        outlet: this.outlet
    };
    private _formatOptions = {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
        year: 'numeric'
    };
    private _formatViews = {
        day: false,
        month: true,
        year: false
    };
    private onChangeCallback: (_: Date) => void = noop;
    private onTouchedCallback: () => void = noop;
    private _onValidatorChange: () => void = noop;

    constructor(public element: ElementRef,
        private _cdr: ChangeDetectorRef,
        @Inject(LOCALE_ID) protected _localeId: string,
        @Inject(IgxOverlayService) private _overlayService: IgxOverlayService,
        private _moduleRef: NgModuleRef<any>,
        private _injector: Injector,
        private _renderer: Renderer2,
        @Optional() @Inject(DisplayDensityToken) protected _displayDensityOptions?: IDisplayDensityOptions,
        @Optional() @Inject(IGX_INPUT_GROUP_TYPE) protected _inputGroupType?: IgxInputGroupType,) {
        super(element, _localeId, _displayDensityOptions, _inputGroupType);
    }

    /**
     * Gets the formatted date when `IgxDatePickerComponent` is in dialog mode.
     *
     *  @example
     * ```typescript
     * let selectedDate = this.datePicker.displayData;
     * ```
     */
    @DeprecateMethod('displayData is deprecated, use inputFormat instead.')
    public get displayData(): string {
        if (this.value) {
            return;
        }
        return '';
    }

    /** Gets the context passed to the input group template. */
    @DeprecateProperty('Context has been deprecated.')
    public get context() {
        return {
            disabled: this.disabled,
            disabledDates: this.disabledDates,
            displayData: this.applyCustomFormat(this.value),
            isSpinLoop: this.isSpinLoop,
            label: this.label,
            locale: this.locale,
            mask: this.mask,
            mode: this.mode,
            specialDates: this.specialDates,
            value: this.value,
            openDialog: () => this.open()
        };
    }

    /** @hidden @internal */
    public get empty() {
        return this._empty;
    }

    /** @hidden @internal */
    public get inputGroupElement(): HTMLElement {
        return this.inputGroup?.element.nativeElement;
    }

    /** @hidden @internal */
    public get isDropdown(): boolean {
        return this.mode === InteractionMode.DropDown;
    }

    private get required(): boolean {
        if (this._ngControl && this._ngControl.control && this._ngControl.control.validator) {
            // Run the validation with empty object to check if required is enabled.
            const error = this._ngControl.control.validator({} as AbstractControl);
            return error && error.required;
        }

        return false;
    }

    /** @hidden */
    @HostListener('keydown.spacebar', ['$event'])
    @HostListener('keydown.space', ['$event'])
    public onSpaceClick(event: KeyboardEvent) {
        event.preventDefault();
        this.open();
    }

    /**
     * Change the calendar selection.
     *
     * @remarks
     * Calling this method will emit the calendar.onSelection event,
     * which will fire @handleSelection method.
     *
     * @example
     * ```typescript
     * this.datePicker.selectDate(this.date);
     * ```
     * @param date passed date that has to be set to the calendar.
     */
    @DeprecateMethod('selectDate has been deprecated, use select instead.')
    public selectDate(date: Date): void {
        this.select(date);
    }

    /**
     * Selects today's date from calendar.
     *
     * @remarks
     * Changes the input field value, calendar.viewDate and calendar.value.
     *
     * @example
     * ```typescript
     * this.datePicker.triggerTodaySelection();
     * ```
     */
    @DeprecateMethod('triggerTodaySelection has been deprecated, use selectToday instead')
    public triggerTodaySelection(): void {
        this.selectToday();
    }

    /**
     * Selects the today's date from the calendar.
     *
     * @example
     * ```typescript
     * this.datePicker.selectToday();
     * ```
     */
    public selectToday(): void {
        this.select(new Date());
    }

    /**
     * Opens the date picker drop down or dialog.
     *
     * @example
     * ```html
     * <igx-date-picker #picker></igx-date-picker>
     *
     * <button (click)="picker.open()">Open Dialog</button>
     * ```
     */
    public open(settings?: OverlaySettings): void {
        if (!this.collapsed || this.disabled) {
            return;
        }

        this.hasHeader = this.isDropdown;
        const overlaySettings = Object.assign({}, this.isDropdown
            ? this.dropDownOverlaySettings
            : this.dialogOverlaySettings
            , settings);

        if (this.isDropdown && this.inputGroupElement) {
            overlaySettings.target = this.inputGroupElement;
        }

        this._componentID = this._overlayService
            .attach(IgxCalendarContainerComponent, overlaySettings, this._moduleRef);
        this._overlayService.show(this._componentID);
    }

    /**
     * Toggles the date picker's dropdown or dialog
     *
     * @example
     * ```html
     * <igx-date-picker #picker></igx-date-picker>
     *
     * <button (click)="picker.toggle()">Toggle Dialog</button>
     * ```
     */
    public toggle(settings?: OverlaySettings): void {
        if (!this.collapsed) {
            this.close();
        } else {
            this.open(settings);
        }
    }

    /**
     * Closes the date picker's dropdown or dialog.
     *
     * @example
     * ```html
     * <igx-date-picker #picker></igx-date-picker>
     *
     * <button (click)="picker.close()">Close Dialog</button>
     * ```
     */
    public close(): void {
        if (!this.collapsed) {
            this._overlayService.hide(this._componentID);
            // TODO: detach()?
        }
    }

    /**
     * Select a date from the calendar.
     *
     * @remarks
     * Calling this method will emit the calendar.onSelection event
     *
     * @example
     * ```typescript
     * this.datePicker.select(date);
     * ```
     * @param date passed date that has to be set to the calendar.
     */
    public select(value: Date): void {
        const args = { owner: this, cancel: false };
        this.selecting.emit(args);
        if (args.cancel) {
            return;
        }

        this.calendar.selectDate(value);
        const oldValue = this.value;
        this.value = value;
        this.emitValueChange(oldValue, this.value);
        this.selected.emit(value);
    }

    /**
     * Deselects the calendar date.
     *
     * @example
     * ```typescript
     * this.datePicker.deselectDate();
     * ```
     */
    public deselect(): void {
        if (this.calendar) {
            this.calendar.deselectDate();
        }
        const oldValue = this.value;
        this.value = null;
        this.emitValueChange(oldValue, this.value);
    }

    /** Clear the input field, date picker value and calendar selection. */
    public clear(): void {
        if (!this.disabled) {
            this.dateTimeEditor.clear();
            this.deselect();
            this._empty = true;
        }
    }

    //#region Control Value Accessor
    /** @hidden @internal */
    public writeValue(value: Date) {
        this._value = value;
    }

    /** @hidden @internal */
    public registerOnChange(fn: any) {
        this.onChangeCallback = fn;
    }

    /** @hidden @internal */
    public registerOnTouched(fn: any) {
        this.onTouchedCallback = fn;
    }

    /** @hidden @internal */
    public setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
    //#endregion

    //#region Validator
    /** @hidden @internal */
    public registerOnValidatorChange(fn: any) {
        this._onValidatorChange = fn;
    }

    /** @hidden @internal */
    public validate(): ValidationErrors | null {
        if (this.value && this.disabledDates && isDateInRanges(this.value, this.disabledDates)) {
            return { dateIsDisabled: true };
        }
        return null;
    }
    //#endregion

    /** @hidden @internal */
    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['locale']) {
            this.inputFormat = DatePickerUtil.getDefaultInputFormat(this.locale || 'en')
                || DatePickerUtil.DEFAULT_INPUT_FORMAT;
        }
        if (changes['displayFormat']) {
            this.dateTimeEditor.displayFormat = this.displayFormat;
        }
        if (changes['inputFormat']) {
            this.dateTimeEditor.inputFormat = this.inputFormat;
        }
        if (changes['disabled']) {
            this.inputDirective.disabled = this.disabled;
        }
    }

    /** @hidden @internal */
    public ngOnInit(): void {
        this._ngControl = this._injector.get<NgControl>(NgControl, null);
    }

    /** @hidden @internal */
    public ngAfterViewInit() {
        if (this.isDropdown) {
            this.attachOnKeydown();
        }

        this.subscribeToOverlayEvents();
        this.subscribeToDateEditorEvents();

        if (this._ngControl) {
            this._statusChanges$ =
                this._ngControl.statusChanges.subscribe(this.onStatusChanged.bind(this));
        }
    }

    public ngAfterViewChecked() {
        // If one sets mode at run time this forces initialization of new igxInputGroup
        // As a result a new igxInputDirective is initialized too. In ngAfterViewInit of
        // the new directive isRequired of the igxInputGroup is set again. However
        // ngAfterViewInit of date picker is not called again and we may finish with wrong
        // isRequired in igxInputGroup. This is why we should set it her, only when needed
        if (this.inputGroup && this.inputGroup.isRequired !== this.required) {
            this.inputGroup.isRequired = this.required;
            this._cdr.detectChanges();
        }
        // TODO: persist validation state when dynamically changing 'dropdown' to 'dialog' ot vice versa.
        // For reference -> it is currently persisted if a user template is passed (as template is not recreated)

        if (this.labelDirective) {
            this._renderer.setAttribute(this.inputDirective.nativeElement, 'aria-labelledby', this.labelDirective.id);
        }
    }

    /** @hidden @internal */
    public ngOnDestroy(): void {
        if (this._componentID) {
            this._overlayService.hide(this._componentID);
        }
        if (this._statusChanges$) {
            this._statusChanges$.unsubscribe();
        }
        this._destroy$.next(true);
        this._destroy$.complete();
    }

    /**
     * Evaluates when calendar.onSelection event was fired
     * and update the input value.
     *
     * @param event selected value from calendar.
     *
     * @hidden @internal
     */
    public handleSelection(date: Date): void {
        if (this.value) {
            date.setHours(this.value.getHours());
            date.setMinutes(this.value.getMinutes());
            date.setSeconds(this.value.getSeconds());
            date.setMilliseconds(this.value.getMilliseconds());
        }
        const oldValue = this.value;
        this.value = date;

        this.emitValueChange(oldValue, this.value);
        this.calendar.viewDate = date;
        this.close();
        this.selected.emit(date);
    }

    /** @hidden @internal */
    public onOpenClick(event: MouseEvent) {
        event.stopPropagation();
        this.open();
    }

    /** @hidden @internal */
    public onKeyDown(event) {
        switch (event.key) {
            case KEYS.UP_ARROW:
            case KEYS.UP_ARROW_IE:
                if (event.altKey) {
                    this.close();
                }
                break;
            case KEYS.DOWN_ARROW:
            case KEYS.DOWN_ARROW_IE:
                if (event.altKey) {
                    this.open();
                }
                break;
            case KEYS.ESCAPE:
            case KEYS.ESCAPE_IE:
                this.close();
                break;
        }
    }

    /** @hidden @internal */
    public _updateValidityOnBlur() {
        this.onTouchedCallback();
        const input = this.inputDirective;
        if (input && this._ngControl && !this._ngControl.valid) {
            input.valid = IgxInputState.INVALID;
        } else {
            input.valid = IgxInputState.INITIAL;
        }
    }

    /** @hidden @internal */
    public getEditElement(): IgxInputDirective {
        return this.inputDirective;
    }

    protected onStatusChanged() {
        if ((this._ngControl.control.touched || this._ngControl.control.dirty) &&
            (this.inputDirective && this._ngControl.control.validator || this._ngControl.control.asyncValidator)) {
            if (this.inputGroup.isFocused) {
                this.inputDirective.valid = this._ngControl.valid ? IgxInputState.VALID : IgxInputState.INVALID;
            } else {
                this.inputDirective.valid = this._ngControl.valid ? IgxInputState.INITIAL : IgxInputState.INVALID;
            }
        }

        if (this.inputGroup && this.inputGroup.isRequired !== this.required) {
            this.inputGroup.isRequired = this.required;
        }
    }

    private subscribeToDateEditorEvents(): void {
        this.dateTimeEditor.valueChange.pipe(
            takeUntil(this._destroy$)).subscribe(newDate => {
                this.value = newDate;
                this.emitValueChange(this.value, newDate);
            });
        this.dateTimeEditor.validationFailed.pipe(
            takeUntil(this._destroy$)).subscribe((event) => {
                this.validationFailed.emit({
                    datePicker: this,
                    prevValue: event.oldValue
                });
            });
    }

    private attachOnKeydown(): void {
        fromEvent(this.element.nativeElement, 'keydown')
            .pipe(takeUntil(this._destroy$))
            .subscribe((evt: KeyboardEvent) => this.onKeyDown(evt));
    }

    private subscribeToOverlayEvents() {
        this._overlayService.onOpening.pipe(
            filter((overlay) => overlay.id === this._componentID),
            takeUntil(this._destroy$)).subscribe((event) => {
                this.opening.emit(event);
                if (event.cancel) {
                    return;
                }

                this._initializeCalendarContainer(event.componentRef.instance);
                this._collapsed = false;
            });

        this._overlayService.onOpened.pipe(
            filter((overlay) => overlay.id === this._componentID),
            takeUntil(this._destroy$)).subscribe(() => {
                this.opened.emit();
                this.calendar?.daysView.focusActiveDate();
            });

        this._overlayService.onClosing.pipe(
            filter(overlay => overlay.id === this._componentID),
            takeUntil(this._destroy$)).subscribe((event) => {
                this.closing.emit(event);
                if (event.cancel) {
                    return;
                }
                // Do not focus the input if clicking outside in dropdown mode
                if (!this.isDropdown) {
                    this.inputDirective.focus();
                } else {
                    // outside click
                    this._updateValidityOnBlur();
                }
            });

        this._overlayService.onClosed.pipe(
            filter(overlay => overlay.id === this._componentID),
            takeUntil(this._destroy$)).subscribe((event) => {
                this._collapsed = true;
                this._componentID = null;
                this.closed.emit(event);
            });
    }

    private emitValueChange(oldValue: Date, newValue: Date) {
        if (!isEqual(oldValue, newValue)) {
            this.valueChange.emit(newValue);
        }
    }

    private _initializeCalendarContainer(componentInstance: IgxCalendarContainerComponent) {
        this.calendar = componentInstance.calendar;
        const isVertical = this.headerOrientation ===
            HeaderOrientation.Vertical && this.mode === InteractionMode.Dialog;
        this.calendar.hasHeader = this.hasHeader;
        this.calendar.formatOptions = this.formatOptions;
        this.calendar.formatViews = this.formatViews;
        this.calendar.locale = this.locale;
        this.calendar.vertical = isVertical;
        this.calendar.weekStart = this.weekStart;
        this.calendar.specialDates = this.specialDates;
        this.calendar.disabledDates = this.disabledDates;
        this.calendar.headerTemplate = this.headerTemplate;
        this.calendar.subheaderTemplate = this.subheaderTemplate;
        this.calendar.hideOutsideDays = this.hideOutsideDays;
        this.calendar.monthsViewNumber = this.displayMonthsCount;
        this.calendar.showWeekNumbers = this.showWeekNumbers;
        this.calendar.onSelection.pipe(takeUntil(this._destroy$)).subscribe((ev: Date) => this.handleSelection(ev));

        if (this.value) {
            this.calendar.value = this.value;
            this.calendar.viewDate = this.value;
        }

        componentInstance.mode = this.mode;
        componentInstance.vertical = isVertical;
        componentInstance.cancelButtonLabel = this.cancelButtonLabel;
        componentInstance.todayButtonLabel = this.todayButtonLabel;
        componentInstance.datePickerActions = this.datePickerActionsDirective;

        componentInstance.calendarClose.pipe(takeUntil(this._destroy$)).subscribe(() => this.close());
        componentInstance.todaySelection.pipe(takeUntil(this._destroy$)).subscribe(() => this.triggerTodaySelection());
    }

    /**
     * Apply custom user formatter upon date.
     *
     * @param formatter custom formatter function.
     * @param date passed date
     */
    private applyCustomFormat(date: Date) {
        return this.formatter ? this.formatter(date) : this.displayFormat;
    }
}
