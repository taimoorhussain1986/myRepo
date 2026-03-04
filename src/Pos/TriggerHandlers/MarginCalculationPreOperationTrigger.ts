// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
//
// PreOperation trigger for Margin Calculation (operation ID 50001).
//
// WHY A TRIGGER INSTEAD OF AN OPERATION HANDLER:
//   The manifest `components.extend.operations` key lazy-loads the handler
//   module only when the button fires.  In Store Commerce 9.55, the AMD
//   require issued at that moment fails silently when the module depends on
//   `PosApi/Create/Operations`, so the module is never visible in the F12
//   debugger and the framework falls back to "operation not supported".
//
//   PreOperation triggers are PRE-LOADED by the manifest processor along with
//   all other triggers at startup.  They are always in the AMD module registry
//   before any button is pressed.
//
// REGISTRATION (manifest.json):
//   Add to components.extend.triggers:
//   {
//     "name":        "MarginCalculationPreOperationTrigger",
//     "description": "Handles op 50001 – Margin Calculation",
//     "triggerType": "PreOperation",
//     "modulePath":  "TriggerHandlers/MarginCalculationPreOperationTrigger"
//   }
//
// Commerce global is injected by the POS framework at runtime.
// `declare var Commerce: any` keeps TypeScript happy without a global.d.ts.
declare var Commerce: any;

import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/** Operation ID assigned in HQ POS Operations and button layout. */
const MARGIN_OPERATION_ID: number = 50001;

/**
 * PreOperation trigger that intercepts operation 50001, computes the margin
 * for the active (or first) cart line, navigates to MarginCalculationView and
 * cancels the original operation so the blank-operation fallback never fires.
 */
export default class MarginCalculationPreOperationTrigger {

    /**
     * Called by the framework before every operation.
     * @param options  Framework-provided options object with `operationId`.
     */
    public execute(options: any): Promise<any> {
        // Only intercept our custom operation.
        if (!options || options.operationId !== MARGIN_OPERATION_ID) {
            return Promise.resolve({ canceled: false, data: undefined });
        }

        return new Promise<any>((resolve: any): void => {
            try {
                // ------------------------------------------------------------------
                // Step 1 — Get the current cart.
                // ------------------------------------------------------------------
                let cart: any = null;

                // Try the context accessor first (SDK 9.55 recommended).
                const ctx: any = (this as any).context;
                if (ctx && ctx.cartAccessor && ctx.cartAccessor.cart) {
                    cart = ctx.cartAccessor.cart;
                }
                // Fall back to the global Commerce namespace (always available).
                if (!cart && typeof Commerce !== "undefined"
                        && Commerce.Session && Commerce.Session.instance) {
                    cart = Commerce.Session.instance.cart;
                }

                if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                    alert("Margin Calculation: Please add a product to the transaction first.");
                    resolve({ canceled: true, data: undefined });
                    return;
                }

                // ------------------------------------------------------------------
                // Step 2 — Identify the active cart line.
                // ------------------------------------------------------------------
                const selectedId: string = cart.SelectedCartLineId || "";
                const cartLine: any = (selectedId
                    ? cart.CartLines.filter((l: any): boolean => l.LineId === selectedId)[0]
                    : null) || cart.CartLines[0];

                const itemId: string    = cartLine.ItemId   || "";
                const quantity: number  = cartLine.Quantity || 0;
                const netAmount: number = cartLine.NetAmountWithAllInclusiveTax
                                       || cartLine.NetAmount || 0;

                // ------------------------------------------------------------------
                // Step 3 — Calculate margin.
                // Phase 1: purchase price = 0 (hard-coded placeholder).
                // Phase 2: replace with a CRT/Retail Server proxy call to fetch
                //          the actual purchase price from InventTableModule.
                // ------------------------------------------------------------------
                const purchasePrice: number    = 0;
                const totalCost: number        = purchasePrice * Math.abs(quantity);
                const marginAmount: number     = netAmount - totalCost;
                const marginPercentage: number = netAmount !== 0
                    ? (marginAmount / netAmount) * 100
                    : 0;

                const marginResult: IMarginCalculationResult = {
                    itemId, purchasePrice, quantity,
                    netAmount, totalCost, marginAmount, marginPercentage
                };

                // ------------------------------------------------------------------
                // Step 4 — Navigate to the Margin Calculation view.
                // ------------------------------------------------------------------
                // Primary: SDK 9.55 recommended navigator (if context is available).
                if (ctx && ctx.navigator && typeof ctx.navigator.navigate === "function") {
                    ctx.navigator.navigate("MarginCalculationView", marginResult);
                }
                // Fallback: global Commerce.Host (always available in Store Commerce).
                else if (typeof Commerce !== "undefined"
                         && Commerce.Host && Commerce.Host.instance
                         && typeof Commerce.Host.instance.navigateToView === "function") {
                    Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
                }
                // Last resort: show a plain alert with the key figures.
                else {
                    alert("Margin Calculation\n"
                        + "Item:   " + itemId + "\n"
                        + "Net:    " + netAmount.toFixed(2) + "\n"
                        + "Margin: " + marginPercentage.toFixed(2) + " %");
                }

                // Cancel the original operation so the framework does not try
                // to execute the (non-existent) operation handler and throw
                // "operation not supported".
                resolve({ canceled: true, data: undefined });

            } catch (ex) {
                console.error("[MarginCalcTrigger] execute error:", ex);
                // Resolve as canceled so we don't bubble an unhandled rejection.
                resolve({ canceled: true, data: undefined });
            }
        });
    }
}
