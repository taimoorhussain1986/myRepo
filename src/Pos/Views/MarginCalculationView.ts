// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
import { ExtensionViewControllerBase, IExtensionViewControllerContext } from "PosApi/Create/Views";
import ko = require("knockout");
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * View controller for the Margin Calculation custom view.
 *
 * MUST extend ExtensionViewControllerBase — Store Commerce 9.55 validates
 * the prototype chain at load time and rejects modules that don't inherit
 * from it with "New view module does not inherit from ExtensionViewControllerBase."
 *
 * Navigation data is passed via context.state (set by MarginCalculationOperation
 * when it calls the navigator).
 *
 * Companion template : MarginCalculationView.html
 * Registered in manifest.json create.views:
 *   { "pageName": "MarginCalculationView",
 *     "viewControllerPath": "Views/MarginCalculationView" }
 */
export default class MarginCalculationView extends ExtensionViewControllerBase {

    public itemId: ReturnType<typeof ko.observable>;
    public purchasePriceDisplay: ReturnType<typeof ko.observable>;
    public netAmountDisplay: ReturnType<typeof ko.observable>;
    public totalCostDisplay: ReturnType<typeof ko.observable>;
    public marginAmountDisplay: ReturnType<typeof ko.observable>;
    public marginPercentageDisplay: ReturnType<typeof ko.observable>;
    public marginCssClass: ReturnType<typeof ko.observable>;

    constructor(context: IExtensionViewControllerContext, state?: any) {
        super(context, state);

        // Navigation data is passed directly as `state` (second constructor arg).
        // The operation calls navigator.navigate("MarginCalculationView", marginResult),
        // so state IS the IMarginCalculationResult object — no { state: ... } wrapper.
        // After super(), (this as any).state also holds the same value.
        const data: any = state || (this as any).state || (context as any).state;
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
        this.context.navigator.navigateBack();
    }

    public dispose(): void {
        super.dispose();
    }
}
