// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------
// Commerce is a global ambient namespace from SDK type defs (pos-tsconfig-base.json).
// ko is mapped to Libraries/knockout via the "paths" entry in tsconfig.json.
// Do NOT add `import Commerce = require("Commerce")` – it is not an AMD module.
// ----------------------------------------------------------------------------

import ko = require("knockout");
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
    // Knockout observable properties bound to MarginCalculationView.html
    // -----------------------------------------------------------------------

    /** Item identifier. */
    public itemId: KnockoutObservable<string>;

    /** Unit purchase price (cost) from InventTableModule (Purch). */
    public purchasePriceDisplay: KnockoutObservable<string>;

    /** Net amount (revenue) from the sales line. */
    public netAmountDisplay: KnockoutObservable<string>;

    /** Total cost = purchase price × quantity. */
    public totalCostDisplay: KnockoutObservable<string>;

    /** Margin amount = revenue − cost. */
    public marginAmountDisplay: KnockoutObservable<string>;

    /** Margin percentage formatted to 2 decimal places. */
    public marginPercentageDisplay: KnockoutObservable<string>;

    /** CSS class: "margin-positive" (green) or "margin-negative" (red). */
    public marginCssClass: KnockoutObservable<string>;

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    /**
     * @param data  Navigation data passed via
     *              Commerce.Host.instance.navigateToView("MarginCalculationView", data).
     */
    constructor(data?: IMarginCalculationResult | any) {

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

        let fmt: (n: number) => string = (n: number): string =>
            n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
