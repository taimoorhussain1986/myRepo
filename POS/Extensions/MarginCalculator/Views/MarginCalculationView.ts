/**
 * MarginCalculationView.ts
 *
 * Custom POS view that displays the margin calculation results for a selected
 * sales order line.
 *
 * The view receives navigation parameters from MarginCalculationOperationRequestHandler
 * and renders them using MarginCalculationView.html.
 */

import {
    ICustomViewControllerBaseState,
    CustomViewControllerBase,
    ICustomViewControllerContext,
} from "PosApi/Create/Views";
import { ObjectExtensions } from "PosApi/TypeExtensions";
import ko from "knockout";

/** Navigation parameters passed from the operation handler. */
export interface IMarginCalculationViewOptions {
    itemId: string;
    lineDescription: string;
    purchasePrice: number;
    netAmount: number;
    marginPercentage: number;
    marginAmount: number;
}

interface IMarginCalculationViewState extends ICustomViewControllerBaseState {
    // No additional framework state required.
}

export default class MarginCalculationView extends CustomViewControllerBase {
    // Knockout observables bound to the HTML template.
    public readonly itemId: ko.Observable<string>;
    public readonly lineDescription: ko.Observable<string>;
    public readonly purchasePrice: ko.Observable<string>;
    public readonly netAmount: ko.Observable<string>;
    public readonly marginPercentage: ko.Observable<string>;
    public readonly marginAmount: ko.Observable<string>;
    public readonly marginCssClass: ko.Observable<string>;

    constructor(context: ICustomViewControllerContext, options?: IMarginCalculationViewOptions) {
        super(context);

        this.title = "Margin Calculation";

        // Initialise observables with formatted values from navigation options.
        const opts = options || {} as IMarginCalculationViewOptions;

        const purchasePrice = ObjectExtensions.isNullOrUndefined(opts.purchasePrice) ? 0 : opts.purchasePrice;
        const netAmt = ObjectExtensions.isNullOrUndefined(opts.netAmount) ? 0 : opts.netAmount;
        const marginPct = ObjectExtensions.isNullOrUndefined(opts.marginPercentage) ? 0 : opts.marginPercentage;
        const marginAmt = ObjectExtensions.isNullOrUndefined(opts.marginAmount) ? 0 : opts.marginAmount;

        this.itemId = ko.observable(opts.itemId || "");
        this.lineDescription = ko.observable(opts.lineDescription || opts.itemId || "");
        this.purchasePrice = ko.observable(purchasePrice.toFixed(2));
        this.netAmount = ko.observable(netAmt.toFixed(2));
        this.marginPercentage = ko.observable(marginPct.toFixed(2) + " %");
        this.marginAmount = ko.observable(marginAmt.toFixed(2));

        // Colour-code the margin percentage: red if negative, green otherwise.
        this.marginCssClass = ko.observable(marginPct < 0 ? "marginNegative" : "marginPositive");
    }

    /**
     * Called by the framework when the view is shown.
     * @param state  View state provided by the framework.
     */
    public onShown(state: IMarginCalculationViewState): void {
        // No additional initialisation required.
    }

    /** Handler for the "Close" button in the view. */
    public closeView(): void {
        this.context.navigator.navigateBack();
    }
}
