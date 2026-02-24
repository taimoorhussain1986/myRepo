// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
// Store Commerce App SDK (PosApi) — custom view controller.
// Navigated to by MarginCalculationOperation via:
//   (context as any).navigator.navigate("MarginCalculationView", { data: result })
//
// Registered in manifest.json create.views:
//   { "pageName": "MarginCalculationView",
//     "viewControllerPath": "Views/MarginCalculationView" }
//
// Companion template: MarginCalculationView.html
// ----------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SDK 9.55: PosApi/Create/Views exports CustomViewControllerBase<TState>, NOT ViewBase.
// CustomViewControllerBase provides this.context (ICustomViewControllerContext)
// which exposes this.context.navigator.navigateBack().
// ---------------------------------------------------------------------------

import { CustomViewControllerBase, ICustomViewControllerContext } from "PosApi/Create/Views";
import ko = require("knockout");
import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * View controller for the Margin Calculation custom view.
 */
export default class MarginCalculationView extends CustomViewControllerBase<IMarginCalculationResult> {

    // -----------------------------------------------------------------------
    // Knockout observable properties — use ko.observable<T>() initialisers
    // (avoids dependency on KnockoutObservable<T> as a global type annotation)
    // -----------------------------------------------------------------------

    /** Item identifier. */
    public itemId = ko.observable<string>("");

    /** Unit purchase price (cost) from InventTableModule (Purch). */
    public purchasePriceDisplay = ko.observable<string>("0.00");

    /** Net amount (revenue) from the sales line. */
    public netAmountDisplay = ko.observable<string>("0.00");

    /** Total cost = purchase price × quantity. */
    public totalCostDisplay = ko.observable<string>("0.00");

    /** Margin amount = revenue − cost. */
    public marginAmountDisplay = ko.observable<string>("0.00");

    /** Margin percentage formatted to 2 decimal places. */
    public marginPercentageDisplay = ko.observable<string>("0.00 %");

    /** CSS class: "margin-positive" (green) or "margin-negative" (red). */
    public marginCssClass = ko.observable<string>("margin-positive");

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    /**
     * @param context  PosApi view context — provided by CustomViewControllerBase.
     *                 Exposes context.navigator.navigateBack() etc.
     * @param state    Navigation data passed by MarginCalculationOperation
     *                 as { data: IMarginCalculationResult }.
     */
    constructor(context: ICustomViewControllerContext, state?: any) {
        super(context);

        // Guard: fall back to zeros if navigation data is missing or malformed.
        let result: IMarginCalculationResult;
        if (state && state.data && typeof state.data.itemId !== "undefined") {
            result = state.data as IMarginCalculationResult;
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

        let fmt = (n: number): string =>
            n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        this.itemId(result.itemId);
        this.purchasePriceDisplay(fmt(result.purchasePrice));
        this.netAmountDisplay(fmt(result.netAmount));
        this.totalCostDisplay(fmt(result.totalCost));
        this.marginAmountDisplay(fmt(result.marginAmount));
        this.marginPercentageDisplay(result.marginPercentage.toFixed(2) + " %");
        this.marginCssClass(result.marginPercentage >= 0 ? "margin-positive" : "margin-negative");
    }

    // -----------------------------------------------------------------------
    // ViewBase lifecycle hooks
    // -----------------------------------------------------------------------

    /** Called when the view's DOM element is ready. */
    public onReady(element: HTMLElement): void {
        ko.applyBindings(this, element);
    }

    /** Called when the view is disposed. */
    public dispose(): void {
        super.dispose();
    }

    // -----------------------------------------------------------------------
    // Commands
    // -----------------------------------------------------------------------

    /**
     * Navigates back to the previous POS view.
     * Bound to the Close button in MarginCalculationView.html.
     */
    public onClose(): void {
        // CustomViewControllerBase provides this.context as a protected property.
        this.context.navigator.navigateBack();
    }
}
