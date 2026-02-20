// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------

import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * View controller for the Margin Calculation custom view.
 *
 * This controller is instantiated by the POS framework when
 * MarginCalculationOperation navigates to "MarginCalculationView".
 *
 * The companion template is MarginCalculationView.html.
 *
 * Register in Manifest.json:
 *   "views": [{ "viewName": "MarginCalculationView", "viewPath": "Views/MarginCalculationView" }]
 */
export default class MarginCalculationViewController
    implements Commerce.Extensibility.IExtensionViewControllerBase {

    // ----------------------------------------------------------------
    // Observable properties bound to MarginCalculationView.html
    // ----------------------------------------------------------------

    /** Item identifier label. */
    public itemId: Commerce.Observable<string>;

    /** Unit purchase price (cost) from InventTableModule. */
    public purchasePriceDisplay: Commerce.Observable<string>;

    /** Net amount (revenue) from the sales line. */
    public netAmountDisplay: Commerce.Observable<string>;

    /** Total cost = purchase price × quantity. */
    public totalCostDisplay: Commerce.Observable<string>;

    /** Margin amount = revenue − cost. */
    public marginAmountDisplay: Commerce.Observable<string>;

    /** Margin percentage formatted to 2 decimal places. */
    public marginPercentageDisplay: Commerce.Observable<string>;

    /** CSS class applied to the margin KPI card (green / red). */
    public marginCssClass: Commerce.Observable<string>;

    // ----------------------------------------------------------------
    // Button commands
    // ----------------------------------------------------------------

    /** Closes / dismisses this view. */
    public closeCommand: Commerce.Client.Entities.ClientEntities.ProxyEntities.Command;

    // ----------------------------------------------------------------
    // Constructor
    // ----------------------------------------------------------------

    constructor(context: Commerce.Extensibility.IExtensionViewContext) {
        const data = context.viewParameters as IMarginCalculationResult;

        // Guard: default to zeros if data is absent.
        const result: IMarginCalculationResult = data ?? {
            itemId: "",
            purchasePrice: 0,
            quantity: 0,
            netAmount: 0,
            totalCost: 0,
            marginAmount: 0,
            marginPercentage: 0
        };

        const fmt = (n: number): string =>
            n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        this.itemId                = Commerce.ko.observable(result.itemId);
        this.purchasePriceDisplay  = Commerce.ko.observable(fmt(result.purchasePrice));
        this.netAmountDisplay      = Commerce.ko.observable(fmt(result.netAmount));
        this.totalCostDisplay      = Commerce.ko.observable(fmt(result.totalCost));
        this.marginAmountDisplay   = Commerce.ko.observable(fmt(result.marginAmount));
        this.marginPercentageDisplay = Commerce.ko.observable(
            `${result.marginPercentage.toFixed(2)} %`
        );

        // Colour the margin card: green when margin >= 0, red otherwise.
        this.marginCssClass = Commerce.ko.observable(
            result.marginPercentage >= 0 ? "margin-positive" : "margin-negative"
        );

        // Close button
        this.closeCommand = {
            label: "Close",
            execute: () => context.viewContextManager.closeView()
        };
    }
}
