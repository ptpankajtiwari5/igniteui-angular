import { IBaseEventArgs } from '../core/utils';
import { IgxDatePickerComponent } from './public_api';

/**
 * Provides information about date picker reference and its current value
 * when onDisabledDate event is fired.
 */
export interface IDatePickerDisabledDateEventArgs extends IBaseEventArgs {
    datePicker: IgxDatePickerComponent;
    currentValue: Date;
}

/**
 * Provides information about date picker reference and its previously valid value
 * when onValidationFailed event is fired.
 */
export interface IDatePickerValidationFailedEventArgs extends IBaseEventArgs {
    datePicker: IgxDatePickerComponent;
    prevValue: Date;
}


/** Configures calendar format view options. */
export interface IFormatViews {
    day?: boolean;
    month?: boolean;
    year?: boolean;
}

/** Configures calendar format options. */
export interface IFormatOptions {
    day?: string;
    month?: string;
    weekday?: string;
    year?: string;
}
