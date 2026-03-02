// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
//
// Uses the SAME base class as all other BT.POS views (BatchView, ReceiptView, etc.)
// so the AMD dependency chain, knockout binding, and ExtensionViewControllerBase
// prototype chain are all resolved exactly the same way as working views.
//
import KnockoutExtensionViewControllerBase from "../BaseClasses/KnockoutExtensionViewControllerBase";
import ko = require("knockout");
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * View controller for the Margin Calculation custom view.
 *
 * Extends KnockoutExtensionViewControllerBase (same as BatchView, ReceiptView)
 * which itself extends ExtensionViewControllerBase — so the Store Commerce 9.55
 * prototype chain check passes exactly as it does for all other BT.POS views.
 *
 * Navigation data is passed via the state parameter from MarginCalculationOperation.
 *
 * Companion template : MarginCalculationView.html
 * Registered in manifest.json create.views:
 *   { "pageName": "MarginCalculationView",
 *     "viewControllerPath": "Views/MarginCalculationView" }
 */
export default class MarginCalculationView extends KnockoutExtensionViewControllerBase {

    public itemId: KnockoutObservable<string>;
    public purchasePriceDisplay: KnockoutObservable<string>;
    public netAmountDisplay: KnockoutObservable<string>;
    public totalCostDisplay: KnockoutObservable<string>;
    public marginAmountDisplay: KnockoutObservable<string>;
    public marginPercentageDisplay: KnockoutObservable<string>;
    public marginCssClass: KnockoutObservable<string>;

    constructor(context: any, state?: any) {
        super(context, state);

        // Navigation data is passed directly as the state parameter.
        // The operation calls navigator.navigate("MarginCalculationView", marginResult).
        // After super(), (this as any).state also holds the same value.
        const data: any = state || (this as any).state || (context && context.state);
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
     * Called by the framework after the HTML template is in the DOM.
     * ko.applyBindings activates all data-bind attributes in MarginCalculationView.html.
     */
    public onReady(element: HTMLElement): void {
        ko.applyBindings(this, element);
    }

    /** Close button handler — navigates back to the previous view. */
    public onClose(): void {
        if (this.context && (this.context as any).navigator) {
            (this.context as any).navigator.navigateBack();
        }
    }

    public dispose(): void {
        super.dispose();
    }
}
