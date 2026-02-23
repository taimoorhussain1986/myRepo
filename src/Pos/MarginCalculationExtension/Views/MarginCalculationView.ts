// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------
// Note: Do NOT add `import Commerce = require("Commerce")` or
//       `import ko = require("knockout")`.
// In Retail SDK 7.2.x:
//   - Commerce is a GLOBAL namespace (defined by BT.POS project type defs).
//   - ko is loaded at runtime by the POS framework (declared as global below).
// Importing either as AMD modules causes TS2792 / TS2304 errors.
// ----------------------------------------------------------------------------

// ko is loaded by the POS AMD loader from Libraries/knockout (see Manifest.json).
// Declaring as `any` lets us call ko.observable() without requiring knockout.d.ts
// to be in scope in the standalone extension tsconfig.
declare var ko: any;

import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * View controller for the Margin Calculation custom view.
 * Retail SDK 7.2.x compatible.
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
    // Knockout observable properties – typed as `any` so the file compiles
    // without a knockout.d.ts reference in the standalone tsconfig.
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
     * @param data  Navigation data passed by MarginCalculationOperation via
     *              Commerce.Host.instance.navigateToView("MarginCalculationView", data).
     */
    constructor(data?: IMarginCalculationResult | any) {

        // Guard: fall back to zeros if data is missing or of wrong shape.
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
     * Navigates back — bound to the Close button in MarginCalculationView.html.
     */
    public onClose(): void {
        Commerce.Host.instance.navigateBack();
    }
}
