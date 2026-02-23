// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------
// Commerce and ko are global objects loaded by the POS framework at runtime.
// When this file is compiled standalone (our own tsconfig), no SDK type
// definition file is in scope, so we declare both as `any` here.
// These are MODULE-LOCAL declarations (file has `export`) so they do NOT
// conflict with the global `namespace Commerce` in the parent BT.POS project.
declare var Commerce: any;
declare var ko: any;

import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * View controller for the Margin Calculation custom view.
 *
 * Navigated to by MarginCalculationOperation via:
 *   Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult)
 *
 * Companion template: MarginCalculationView.html
 * Registered in Manifest.json create.views:
 *   { "pageName": "MarginCalculationView",
 *     "viewControllerPath": "Views/MarginCalculationView" }
 */
export default class MarginCalculationViewController {

    // -----------------------------------------------------------------------
    // Knockout observable properties.
    // Typed as `any` to compile without knockout.d.ts in standalone tsconfig.
    // At runtime these are standard KnockoutObservable instances.
    // -----------------------------------------------------------------------

    /** Item identifier. */
    public itemId: any;

    /** Unit purchase price (cost) from InventTableModule (Purch). */
    public purchasePriceDisplay: any;

    /** Net amount (revenue) from the sales line. */
    public netAmountDisplay: any;

    /** Total cost = purchase price × quantity. */
    public totalCostDisplay: any;

    /** Margin amount = revenue − cost. */
    public marginAmountDisplay: any;

    /** Margin percentage formatted to 2 decimal places. */
    public marginPercentageDisplay: any;

    /** CSS class: "margin-positive" (green) or "margin-negative" (red). */
    public marginCssClass: any;

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    /**
     * @param data  Navigation data passed via
     *              Commerce.Host.instance.navigateToView("MarginCalculationView", data).
     */
    constructor(data?: any) {

        // Guard: fall back to zeros if navigation data is missing or malformed.
        let result: IMarginCalculationResult;
        if (data && typeof data === "object" && typeof data.itemId !== "undefined") {
            result = data as IMarginCalculationResult;
        } else {
            result = {
                itemId:           "",
                purchasePrice:    0,
                quantity:         0,
                netAmount:        0,
                totalCost:        0,
                marginAmount:     0,
                marginPercentage: 0
            };
        }

        let fmt: (n: number) => string = function(n: number): string {
            return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        this.itemId                  = ko.observable(result.itemId);
        this.purchasePriceDisplay    = ko.observable(fmt(result.purchasePrice));
        this.netAmountDisplay        = ko.observable(fmt(result.netAmount));
        this.totalCostDisplay        = ko.observable(fmt(result.totalCost));
        this.marginAmountDisplay     = ko.observable(fmt(result.marginAmount));
        this.marginPercentageDisplay = ko.observable(result.marginPercentage.toFixed(2) + " %");
        this.marginCssClass          = ko.observable(
            result.marginPercentage >= 0 ? "margin-positive" : "margin-negative"
        );
    }

    /**
     * Navigates back to the previous POS view.
     * Bound to the Close button in MarginCalculationView.html.
     */
    public onClose(): void {
        Commerce.Host.instance.navigateBack();
    }
}
