// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
//
// Mirrors the exact pattern used by StoreHoursView / BatchView in BT.POS:
//   - "PosApi/Create/Views" (namespace import)
//   - extends Views.CustomViewControllerBase   (NOT deprecated ExtensionViewControllerBase)
//   - import ko from "knockout"
//
import * as Views from "PosApi/Create/Views";
import ko from "knockout";
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * View controller for the Margin Calculation custom view.
 *
 * Extends Views.CustomViewControllerBase — same as BatchView / StoreHoursView.
 * SDK 9.55 requires CustomViewControllerBase; ExtensionViewControllerBase is deprecated.
 *
 * Companion template : MarginCalculationView.html
 * Registered in manifest.json create.views:
 *   { "pageName": "MarginCalculationView",
 *     "viewControllerPath": "Views/MarginCalculationView" }
 */
export default class MarginCalculationView extends Views.CustomViewControllerBase {

    public itemId: KnockoutObservable<string>;
    public purchasePriceDisplay: KnockoutObservable<string>;
    public netAmountDisplay: KnockoutObservable<string>;
    public totalCostDisplay: KnockoutObservable<string>;
    public marginAmountDisplay: KnockoutObservable<string>;
    public marginPercentageDisplay: KnockoutObservable<string>;
    public marginCssClass: KnockoutObservable<string>;

    constructor(context: Views.ICustomViewControllerContext, state?: Views.ICustomViewControllerBaseState) {
        super(context);

        // Navigation data is passed as the state parameter by the operation.
        const data: any = state;
        let result: IMarginCalculationResult;
        if (data && typeof data === "object" && typeof data.itemId !== "undefined") {
            result = data as IMarginCalculationResult;
        } else {
            result = { itemId: "", purchasePrice: 0, quantity: 0, netAmount: 0, totalCost: 0, marginAmount: 0, marginPercentage: 0 };
        }

        const fmt = (n: number): string =>
            n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        this.itemId                  = ko.observable(result.itemId);
        this.purchasePriceDisplay    = ko.observable(fmt(result.purchasePrice));
        this.netAmountDisplay        = ko.observable(fmt(result.netAmount));
        this.totalCostDisplay        = ko.observable(fmt(result.totalCost));
        this.marginAmountDisplay     = ko.observable(fmt(result.marginAmount));
        this.marginPercentageDisplay = ko.observable(result.marginPercentage.toFixed(2) + " %");
        this.marginCssClass          = ko.observable(result.marginPercentage >= 0 ? "margin-positive" : "margin-negative");
    }

    /**
     * Called by the framework after the HTML template is rendered into the DOM.
     * ko.applyBindings activates all data-bind attributes in MarginCalculationView.html.
     * Same pattern as StoreHoursView / BatchView.
     */
    public onReady(element: HTMLElement): void {
        ko.applyBindings(this, element);
    }

    /** Close button handler — navigates back to the previous view. */
    public onClose(): void {
        this.context.navigator.navigateBack();
    }
}
