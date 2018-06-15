import { transition, trigger, useAnimation } from '@angular/animations';
import {
    Component,
    ContentChild,
    EventEmitter,
    forwardRef,
    HostBinding,
    HostListener,
    Input,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
    ViewChildren
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HAMMER_GESTURE_CONFIG, HammerGestureConfig } from '@angular/platform-browser';
import { fadeIn, scaleInCenter, slideInLeft, slideInRight } from '../animations/main';
import { Calendar, ICalendarDate, range, weekDay, WEEKDAYS } from './calendar';
import {
    IgxCalendarDateDirective,
    IgxCalendarHeaderTemplateDirective,
    IgxCalendarSubheaderTemplateDirective
} from './calendar.directives';

let NEXT_ID = 0;

export enum CalendarView {
    DEFAULT,
    YEAR,
    DECADE
}

export enum CalendarSelection {
    SINGLE = 'single',
    MULTI = 'multi',
    RANGE = 'range'
}

export class CalendarHammerConfig extends HammerGestureConfig {
    public overrides = {
        pan: { direction: Hammer.DIRECTION_VERTICAL, threshold: 1 }
    };
}

/**
 * **Ignite UI for Angular Calendar** -
 * [Documentation](https://www.infragistics.com/products/ignite-ui-angular/angular/components/calendar.html)
 *
 * The Ignite UI Calendar provides an easy way to display a calendar and allow users to select dates using single, multiple
 * or range selection.
 *
 * Example:
 * ```html
 * <igx-calendar selection="range"></igx-calendar>
 * ```
 */
@Component({
    animations: [
        trigger('animateView', [
            transition('void => 0', useAnimation(fadeIn)),
            transition('void => *', useAnimation(scaleInCenter, {
                params: {
                    duration: '.2s',
                    fromScale: .9
                }
            }))
        ]),
        trigger('animateChange', [
            transition('* => prev', useAnimation(slideInLeft, {
                params: {
                    fromPosition: 'translateX(-30%)'
                }
            })),
            transition('* => next', useAnimation(slideInRight, {
                params: {
                    fromPosition: 'translateX(30%)'
                }
            }))
        ])
    ],
    providers: [
            {
                multi: true,
                provide: NG_VALUE_ACCESSOR,
                useExisting: IgxCalendarComponent
            },
            {
                provide: HAMMER_GESTURE_CONFIG,
                useClass: CalendarHammerConfig
            }
        ],
    selector: 'igx-calendar',
    templateUrl: 'calendar.component.html'
})
export class IgxCalendarComponent implements OnInit, ControlValueAccessor {
/**
 * Sets/gets the `id` of the calendar.
 * If not set, the `id` will have value `"igx-calendar-0"`.
 * ```html
 * <igx-calendar id = "my-first-calendar"></igx-calendar>
 * ```
 * ```typescript
 * let calendarId =  this.calendar.id;
 * ```
 * @memberof IgxCalendarComponent
 */
@HostBinding('attr.id')
    @Input()
    public id = `igx-calendar-${NEXT_ID++}`;
    /**
     * Gets the start of the week.
     * Defaults to `Sunday`.
     * ```typescript
     * let weekStart =  this.calendar.weekStart;
     * ```
     * @memberof IgxCalendarComponent
     */
    @Input()
    public get weekStart(): WEEKDAYS | number {
        return this.calendarModel.firstWeekDay;
    }
/**
 * Sets the start of the week.
 * ```html
 * <igx-calendar [weekStart] = "1"></igx-calendar>
 * ```
 * @memberof IgxCalendarComponent
 */
public set weekStart(value: WEEKDAYS | number) {
        this.calendarModel.firstWeekDay = value;
    }

    /**
     * Sets/gets the `locale` of the calendar.
     * Expects a valid BCP 47 language tag.
     * Default value is `"en"`.
     * ```html
     * <igx-calendar [locale] = "de"></igx-calendar>
     * ```
     * ```typescript
     * let locale =  this.calendar.locale;
     * ```
     * @memberof IgxCalendarComponent
     */
    @Input()
    public locale = 'en';

    /**
     *
     * Gets the selection type of the calendar.
     * Default value is `"single"`.
     * Changing the type of selection in the calendar resets the currently
     * selected values if any.
     * ```typescript
     * let selectionType =  this.calendar.selection;
     * ```
     * @memberof IgxCalendarComponent
     */
    @Input()
    public get selection(): string {
        return this._selection;
    }
/**
 * Sets the selection type of the calendar.
 * ```html
 * <igx-calendar [selection] = "'multi'"></igx-calendar>
 * ```
 * @memberof IgxCalendarComponent
 */
public set selection(value: string) {
        switch (value) {
            case 'single':
                this.selectedDates = null;
                break;
            case 'multi':
            case 'range':
                this.selectedDates = [];
                break;
            default:
                throw new Error('Invalid selection value');
        }
        this._onChangeCallback(this.selectedDates);
        this._rangeStarted = false;
        this._selection = value;
    }

    /**
     * Gets the date that is presented in the calendar.
     * By default it is the current date.
     * ```typescript
     * let date = this.calendar.viewDate;
     * ```
     * @memberof IgxCalendarComponent
     */
    @Input()
    public get viewDate(): Date {
        return this._viewDate;
    }
/**
 * Sets the date that will be presented in the default view when the calendar renders.
 * ```html
 * <igx-calendar viewDate = "15/06/2018"></igx-calendar>
 * ```
 * @memberof IgxCalendarComponent
 */
public set viewDate(value: Date) {
        this._viewDate = new Date(value);
    }

    /**
     * Gets the selected date(s) of the calendar.
     *
     * When the calendar selection is set to `single`, it returns
     * a single `Date` object.
     * Otherwise it is an array of `Date` objects.
     * ```typescript
     * let selectedDates =  this.calendar.value;
     * ```
     * @memberof IgxCalendarComponent
     */
    @Input()
    public get value(): Date | Date[] {
        return this.selectedDates;
    }
/**
 * Sets the selected date(s) of the calendar.
 *
 * When the calendar selection is set to `single`, it accepts
 * a single `Date` object.
 * Otherwise it is an array of `Date` objects.
 * ```typescript
 *  this.calendar.value =  new Date(`2016-06-12`);
 * ```
 * @memberof IgxCalendarComponent
 */
public set value(value: Date | Date[]) {
        this.selectDate(value);
    }

    /**
     * Gets the date format options of the calendar.
     * ```typescript
     * let dateFormatOptions = this.calendar.formatOptions.
     * ```
     */
    @Input()
    public get formatOptions(): object {
        return this._formatOptions;
    }
    /**
     * Sets the date format options of the calendar.
     * ```html
     * <igx-calendar> [formatOptions] = "{ day: '2-digit', month: 'short', weekday: 'long', year: 'numeric' }"</igx-calendar>
     * ```
     * @memberof IgxCalendarComponent
     */
    public set formatOptions(formatOptions: object) {
        this._formatOptions = Object.assign(this._formatOptions, formatOptions);
    }

    /**
     * Gets whether the `day`, `month` and `year` should be rendered
     * according to the locale and formatOptions, if any.
     * ```typescript
     * let formatViews = this.calendar.formatViews;
     * ```
     */
    @Input()
    public get formatViews(): object {
        return this._formatViews;
    }
    /**
     * Gets whether the `day`, `month` and `year` should be rendered
     * according to the locale and formatOptions, if any.
     * ```html
     * <igx-calendar [formatViews] = "{ day: true, month: false, year: true }"></igx-calendar>
     * ```
     * @memberof IgxCalendarComponent
     */
    public set formatViews(formatViews: object) {
        this._formatViews = Object.assign(this._formatViews, formatViews);
    }

    /**
     * Sets/gets whether the calendar header will be in vertical position.
     * Default value is `false`.
     * ```html
     * <igx-calendar [vertical] = "true"></igx-calendar>
     * ```
     * ```typescript
     * let isVertical = this.calendar.vertical;
     * ```
     */
    @Input()
    public vertical = false;
/**
 * Emits an event when a selection is made in the calendar.
 * Provides reference the `selectedDates` property in the `IgxCalendarComponent`.
 * ```html
 * <igx-calendar (onSelection) = "onSelection(calendar.selectedDates)"></igx-calendar>
 * ```
 * @memberof IgxCalendarComponent
 */
@Output()
    public onSelection = new EventEmitter<Date | Date[]>();

    /**
     * @hidden
     */
    @ViewChildren(forwardRef(() => IgxCalendarDateDirective), { read: IgxCalendarDateDirective })
    public dates: QueryList<IgxCalendarDateDirective>;

    /**
     * The default `tabindex` attribute for the component.
     *
     * @hidden
     */
    @HostBinding('attr.tabindex')
    public tabindex = 0;

    /**
     * The default aria role attribute for the component.
     *
     * @hidden
     */
    @HostBinding('attr.role')
    public role = 'grid';

    /**
     * The default aria lebelled by attribute for the component.
     *
     * @hidden
     */
    @HostBinding('attr.aria-labelledby')
    public ariaLabelledBy = 'calendar';

    /**
     * The default css class applied to the component.
     *
     * @hidden
     */
    @HostBinding('class')
    get styleClass(): string {
        if (this.vertical) {
            return 'igx-calendar--vertical';
        }
        return 'igx-calendar';
    }

    /**
     * Returns an array of date objects which are then used to
     * properly render the month names.
     *
     * Used in the template of the component
     *
     * @hidden
     */
    get months(): Date[] {
        let start = new Date(this._viewDate.getFullYear(), 0, 1);
        const result = [];

        for (let i = 0; i < 12; i++) {
            result.push(start);
            start = this.calendarModel.timedelta(start, 'month', 1);
        }

        return result;
    }

    /**
     * Returns an array of date objects which are then used to properly
     * render the years.
     *
     * Used in the template of the component.
     *
     * @hidden
     */
    get decade(): number[] {
        const result = [];
        const start = this._viewDate.getFullYear() - 3;
        const end = this._viewDate.getFullYear() + 4;

        for (const year of range(start, end)) {
            result.push(new Date(year, this._viewDate.getMonth(), this._viewDate.getDate()));
        }

        return result;
    }

    get isDefaultView(): boolean {
        return this._activeView === CalendarView.DEFAULT;
    }

    get isYearView(): boolean {
        return this._activeView === CalendarView.YEAR;
    }

    get isDecadeView(): boolean {
        return this._activeView === CalendarView.DECADE;
    }

    /**
     * Gets the current active view of the calendar.
     * ```typescript
     * let activeView =  this.calendar.activeView;
     * ```
     */
    get activeView(): CalendarView {
        return this._activeView;
    }

    /**
     * @hidden
     */
    get monthAction(): string {
        return this._monthAction;
    }
/**
 * Gets the header template.
 * ```typescript
 * let headerTemplate =  this.calendar.headerTeamplate;
 * ```
 * @memberof IgxCalendarComponent
 */
get headerTemplate(): any {
        if (this.headerTemplateDirective) {
            return this.headerTemplateDirective.template;
        }
        return null;
    }
/**
 * Sets the header template.
 * ```html
 * <igx-calendar headerTemplateDirective = "igxCalendarHeader"></igx-calendar>
 * ```
 * @memberof IgxCalendarComponent
 */
set headerTemplate(directive: any) {
        this.headerTemplateDirective = directive;
    }
/**
 * Gets the subheader template.
 * ```typescript
 * let subheaderTemplate = this.calendar.subheaderTemplate;
 * ```
 */
get subheaderTemplate(): any {
        if (this.subheaderTemplateDirective) {
            return this.subheaderTemplateDirective.template;
        }
        return null;
    }
/**
 * Sets the subheader template.
 * ```html
 * <igx-calendar subheaderTemplate = "igxCalendarSubheader"></igx-calendar>
 * ```
 * @memberof IgxCalendarComponent
 */
set subheaderTemplate(directive: any) {
        this.subheaderTemplateDirective = directive;
    }

    /**
     * Gets the context for the template marked with the `igxCalendarHeader` directive.
     * ```typescript
     * let headerContext =  this.calendar.headerContext;
     * ```
     */
    get headerContext() {
        const date: Date = this.headerDate;
        return this.generateContext(date);
    }

    /**
     * Gets the context for the template marked with either `igxCalendarSubHeaderMonth`
     * or `igxCalendarSubHeaderYear` directive.
     * ```typescript
     * let context =  this.calendar.context;
     * ```
     */
    get context() {
        const date: Date = this._viewDate;
        return this.generateContext(date);
    }

    /**
     * @hidden
     */
    get headerDate(): Date {
        return this.selectedDates ? this.selectedDates : new Date();
    }

    /**
     * @hidden
     */
    @ContentChild(forwardRef(() => IgxCalendarHeaderTemplateDirective), { read: IgxCalendarHeaderTemplateDirective })
    private headerTemplateDirective: IgxCalendarHeaderTemplateDirective;

    /**
     * @hidden
     */
    // tslint:disable-next-line:max-line-length
    @ContentChild(forwardRef(() => IgxCalendarSubheaderTemplateDirective), { read: IgxCalendarSubheaderTemplateDirective })
    private subheaderTemplateDirective: IgxCalendarSubheaderTemplateDirective;
/**
 *@hidden
 */
private _viewDate: Date;
/**
 *@hidden
 */
private calendarModel: Calendar;
/**
 *@hidden
 */
private _activeView = CalendarView.DEFAULT;
/**
 *@hidden
 */
private selectedDates;
/**
 *@hidden
 */
private _selection: CalendarSelection | string = CalendarSelection.SINGLE;
/**
 *@hidden
 */
private _rangeStarted = false;
/**
 *@hidden
 */
private _monthAction = '';
/**
 *@hidden
 */
private _formatOptions = {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
        year: 'numeric'
    };
    /**
     *@hidden
     */
    private _formatViews = {
        day: false,
        month: true,
        year: false
    };

    /**
     * @hidden
     */
    constructor() {
        this.calendarModel = new Calendar();
    }

    /**
     * @hidden
     */
    public ngOnInit() {
        const today = new Date();

        this.calendarModel.firstWeekDay = this.weekStart;
        this._viewDate = this._viewDate ? this._viewDate : today;
    }

    /**
     * @hidden
     */
    public registerOnChange(fn: (v: Date) => void) {
        this._onChangeCallback = fn;
    }

    /**
     * @hidden
     */
    public registerOnTouched(fn: () => void) {
        this._onTouchedCallback = fn;
    }

    /**
     * @hidden
     */
    public writeValue(value: Date | Date[]) {
        this.selectedDates = value;
    }

    /**
     * Returns the locale representation of the month in the month view if enabled,
     * otherwise returns the default `Date.getMonth()` value.
     *
     * @hidden
     */
    public formattedMonth(value: Date): string {
        if (this._formatViews.month) {
            return value.toLocaleString(this.locale, { month: this._formatOptions.month });
        }
        return `${value.getMonth()}`;
    }

    /**
     * Returns the locale representation of the date in the default view if enabled,
     * otherwise returns the default `Date.getDate()` value.
     *
     * @hidden
     */
    public formattedDate(value: Date): string {
        if (this._formatViews.day) {
            return value.toLocaleString(this.locale, { day: this._formatOptions.day });
        }
        return `${value.getDate()}`;
    }

    /**
     * Returns the locale representation of the year in the year view if enabled,
     * otherwise returns the default `Date.getFullYear()` value.
     *
     * @hidden
     */
    public formattedYear(value: Date): string {
        if (this._formatViews.year) {
            return value.toLocaleString(this.locale, { year: this._formatOptions.year });
        }
        return `${value.getFullYear()}`;
    }

    /**
     * @hidden
     */
    public isCurrentMonth(value: Date): boolean {
        return this.viewDate.getMonth() === value.getMonth();
    }

    /**
     * @hidden
     */
    public isCurrentYear(value: Date): boolean {
        return this.viewDate.getFullYear() === value.getFullYear();
    }

    /**
     * @hidden
     */
    public previousMonth() {
        this._viewDate = this.calendarModel.timedelta(this._viewDate, 'month', -1);
        this._monthAction = 'prev';
    }

    /**
     * @hidden
     */
    public nextMonth() {
        this._viewDate = this.calendarModel.timedelta(this._viewDate, 'month', 1);
        this._monthAction = 'next';
    }

    /**
     * @hidden
     */
    public previousYear() {
        this._viewDate = this.calendarModel.timedelta(this._viewDate, 'year', -1);
    }

    /**
     * @hidden
     */
    public nextYear() {
        this._viewDate = this.calendarModel.timedelta(this._viewDate, 'year', 1);
    }

    /**
     * @hidden
     */
    public getFormattedDate(): { weekday: string, monthday: string } {

        const date = this.headerDate;

        return {
            monthday: date.toLocaleString(
                this.locale, { month: this._formatOptions.month, day: this._formatOptions.day }),
            weekday: date.toLocaleString(this.locale, { weekday: this._formatOptions.weekday })
        };
    }

    /**
     * @hidden
     */
    public childClicked(instance: ICalendarDate) {
        if (instance.isPrevMonth) {
            this.previousMonth();
        }

        if (instance.isNextMonth) {
            this.nextMonth();
        }

        this.selectDate(instance.date);
        this.onSelection.emit(this.selectedDates);
    }

    public animationDone(event, isLast: boolean) {
        const date = this.dates.find((d) => d.selected);

        if (date && isLast) {
            setTimeout(() => date.nativeElement.focus(),
                parseInt(slideInRight.options.params.duration, 10));
        }
    }

    /**
     * Selects date(s) (based on the selection type).
     *```typescript
     * this.calendar.selectDate(new Date(`2018-06-12`));
     *```
     */
    public selectDate(value: Date | Date[]) {
        switch (this.selection) {
            case 'single':
                this.selectSingle(value as Date);
                break;
            case 'multi':
                this.selectMultiple(value);
                break;
            case 'range':
                this.selectRange(value);
                break;
        }
    }

    /**
     * @hidden
     */
    public generateWeekHeader(): string[] {
        const dayNames = [];
        const rv = this.calendarModel.monthdatescalendar(this.viewDate.getFullYear(), this.viewDate.getMonth())[0];
        for (const day of rv) {
            dayNames.push(day.date.toLocaleString(this.locale, { weekday: this._formatOptions.weekday }));
        }

        return dayNames;
    }

    /**
     * @hidden
     */
    public get getCalendarMonth(): ICalendarDate[][] {
        return this.calendarModel.monthdatescalendar(this.viewDate.getFullYear(), this.viewDate.getMonth(), true);
    }

    /**
     * @hidden
     */
    public changeYear(event: Date) {
        this._viewDate = new Date(event.getFullYear(), this._viewDate.getMonth(), 1, 0, 0, 0);
        this._activeView = CalendarView.DEFAULT;
    }

    /**
     * @hidden
     */
    public changeMonth(event: Date) {
        this._viewDate = new Date(this._viewDate.getFullYear(), event.getMonth(), 1, 0, 0, 0);
        this._activeView = CalendarView.DEFAULT;
    }

    /**
     * @hidden
     */
    public activeViewYear(): void {
        this._activeView = CalendarView.YEAR;
    }

    /**
     * @hidden
     */
    public activeViewDecade(): void {
        this._activeView = CalendarView.DECADE;
    }

    /**
     * @hidden
     */
    public onScroll(event) {
        event.preventDefault();
        event.stopPropagation();

        const delta = event.deltaY < 0 ? 1 : -1;
        this.generateYearRange(delta);
    }

    /**
     * @hidden
     */
    public onPan(event) {
        const delta = event.deltaY < 0 ? 1 : -1;
        this.generateYearRange(delta);
    }

    /**
     * @hidden
     */
    @HostListener('keydown.pageup', ['$event'])
    public onKeydownPageUp(event: KeyboardEvent) {
        event.preventDefault();
        this.previousMonth();
    }

    /**
     * @hidden
     */
    @HostListener('keydown.pagedown', ['$event'])
    public onKeydownPageDown(event: KeyboardEvent) {
        event.preventDefault();
        this.nextMonth();
    }

    /**
     * @hidden
     */
    @HostListener('keydown.shift.pageup', ['$event'])
    public onKeydownShiftPageUp(event: KeyboardEvent) {
        event.preventDefault();
        this.previousYear();
    }

    /**
     * @hidden
     */
    @HostListener('keydown.shift.pagedown', ['$event'])
    public onKeydownShiftPageDown(event: KeyboardEvent) {
        event.preventDefault();
        this.nextYear();
    }

    /**
     * @hidden
     */
    @HostListener('keydown.arrowup', ['$event'])
    public onKeydownArrowUp(event: KeyboardEvent) {
        event.preventDefault();

        const node = this.dates.find((date) => date.nativeElement === event.target);
        const index = this.dates.toArray().indexOf(node);
        if (node && index > -1 && index - 7 > -1) {
            this.dates.toArray()[index - 7].nativeElement.focus();
        }
    }

    /**
     * @hidden
     */
    @HostListener('keydown.arrowdown', ['$event'])
    public onKeydownArrowDown(event: KeyboardEvent) {
        event.preventDefault();

        const node = this.dates.find((date) => date.nativeElement === event.target);
        const index = this.dates.toArray().indexOf(node);
        if (node && index > -1 && index + 7 < this.dates.length) {
            this.dates.toArray()[index + 7].nativeElement.focus();
        }
    }

    /**
     * @hidden
     */
    @HostListener('keydown.arrowleft', ['$event'])
    public onKeydownArrowLeft(event: KeyboardEvent) {
        event.preventDefault();

        const node = this.dates.find((date) => date.nativeElement === event.target);
        const index = this.dates.toArray().indexOf(node);
        if (node && index > -1 && index > 0) {
            this.dates.toArray()[index - 1].nativeElement.focus();
        }
    }

    /**
     * @hidden
     */
    @HostListener('keydown.arrowright', ['$event'])
    public onKeydownArrowRight(event: KeyboardEvent) {
        event.preventDefault();

        const node = this.dates.find((date) => date.nativeElement === event.target);
        const index = this.dates.toArray().indexOf(node);
        if (node && index > -1 && index < this.dates.length - 1) {
            this.dates.toArray()[index + 1].nativeElement.focus();
        }
    }

    /**
     * @hidden
     */
    @HostListener('keydown.home', ['$event'])
    public onKeydownHome(event: KeyboardEvent) {
        event.preventDefault();

        this.dates
            .filter((date) => date.isCurrentMonth)
            .shift().nativeElement.focus();
    }

    /**
     * @hidden
     */
    @HostListener('keydown.end', ['$event'])
    public onKeydownEnd(event: KeyboardEvent) {
        event.preventDefault();

        this.dates
            .filter((date) => date.isCurrentMonth)
            .pop().nativeElement.focus();
    }

    /**
     * @hidden
     */
    public dateTracker(index, item): string {
        return `${item.date.getMonth()}--${item.date.getDate()}`;
    }

    /**
     * @hidden
     */
    public rowTracker(index, item): string {
        return `${item[index].date.getMonth()}${item[index].date.getDate()}`;
    }

    /**
     * Performs a single selection.
     * @hidden
     */
    private selectSingle(value: Date) {
        this.selectedDates = value;
        this._onChangeCallback(this.selectedDates);
    }

    /**
     * Performs a multiple selection
     * @hidden
     */
    private selectMultiple(value: Date | Date[]) {
        if (Array.isArray(value)) {
            this.selectedDates = this.selectedDates.concat(value);
        } else {
            if (this.selectedDates.every((date: Date) => date.toDateString() !== value.toDateString())) {
                this.selectedDates.push(value);
            } else {
                this.selectedDates = this.selectedDates.filter(
                    (date: Date) => date.toDateString() !== value.toDateString()
                );
            }
        }

        this._onChangeCallback(this.selectedDates);
    }
/**
 *@hidden
 */
private selectRange(value: Date | Date[]) {
        let start: Date;
        let end: Date;

        if (Array.isArray(value)) {
            this._rangeStarted = false;
            value.sort((a: Date, b: Date) => a.valueOf() - b.valueOf());
            start = value.shift();
            end = value.pop();
            this.selectedDates = [start];

            this.selectedDates = [start, ...this.generateDateRange(start, end)];

        } else {
            if (!this._rangeStarted) {
                this._rangeStarted = true;
                this.selectedDates = [value];
            } else {
                this._rangeStarted = false;

                if (this.selectedDates[0].toDateString() === value.toDateString()) {
                    this.selectedDates = [];
                    this._onChangeCallback(this.selectedDates);
                    return;
                }

                this.selectedDates.push(value);
                this.selectedDates.sort((a: Date, b: Date) => a.valueOf() - b.valueOf());

                start = this.selectedDates.shift();
                end = this.selectedDates.pop();
                this.selectedDates = [start, ...this.generateDateRange(start, end)];
            }
        }
        this._onChangeCallback(this.selectedDates);
    }

    /**
     * Helper method building and returning the context object inside
     * the calendar templates.
     * @hidden
     */
    private generateContext(value: Date) {
        const formatObject = {
            monthView: () => this.activeViewYear(),
            yearView: () => this.activeViewDecade(),
            ...this.calendarModel.formatToParts(value, this.locale, this._formatOptions,
                                                    ['era', 'year', 'month', 'day', 'weekday'])
        };
        return { $implicit: formatObject };
    }
/**
 *@hidden
 */
private generateDateRange(start: Date, end: Date): Date[] {
        const result = [];

        while (start.toDateString() !== end.toDateString()) {
            start = this.calendarModel.timedelta(start, 'day', 1);
            result.push(start);
        }

        return result;
    }
/**
 *@hidden
 */
private generateYearRange(delta: number) {
        const currentYear = new Date().getFullYear();

        if ((delta > 0 && this._viewDate.getFullYear() - currentYear >= 95) ||
            (delta < 0 && currentYear - this._viewDate.getFullYear() >= 95)) {
            return;
        }
        this._viewDate = this.calendarModel.timedelta(this._viewDate, 'year', delta);
    }
/**
 *@hidden
 */
private _onTouchedCallback: () => void = () => { };
/**
 *@hidden
 */
private _onChangeCallback: (_: Date) => void = () => { };
}
