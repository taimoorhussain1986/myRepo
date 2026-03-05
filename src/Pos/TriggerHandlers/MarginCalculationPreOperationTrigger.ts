// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
//
// PreOperation trigger for Margin Calculation (operation ID 50001).
//
// MUST extend Triggers.PreOperationTrigger — Store Commerce 9.55 validates the
// prototype chain and rejects triggers that do not inherit from the correct base.
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
declare var Commerce: any;

import * as Triggers from "PosApi/Extend/Triggers/OperationTriggers";
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/** Operation ID assigned in HQ POS Operations and button layout. */
const MARGIN_OPERATION_ID: number = 50001;

/**
 * PreOperation trigger that intercepts operation 50001, computes the margin
 * for the active (or first) cart line, navigates to MarginCalculationView and
 * cancels the original operation so the blank-operation fallback never fires.
 */
export default class MarginCalculationPreOperationTrigger extends Triggers.PreOperationTrigger {

    /**
     * Called by the framework before every operation.
     * No constructor — TypeScript auto-generates one that forwards all
     * framework-provided arguments (including context) to the base class.
     * @param options  IPreOperationOptions – contains `request.operationId`.
     */
    public execute(options: Triggers.IPreOperationTriggerOptions): any {
        const opId: number = (options && options.request && (options.request as any).operationId)
            || 0;

        if (opId !== MARGIN_OPERATION_ID) {
            return Promise.resolve({ halt: false });
        }

        const ctx: any = this.context;

        return new Promise<Triggers.IHaltCondition>((resolve: any): void => {
            try {
                // ------------------------------------------------------------------
                // Step 1 — Get the current cart.
                // ------------------------------------------------------------------
                let cart: any = null;

                if (ctx && ctx.cartAccessor && ctx.cartAccessor.cart) {
                    cart = ctx.cartAccessor.cart;
                }
                if (!cart && typeof Commerce !== "undefined"
                        && Commerce.Session && Commerce.Session.instance) {
                    cart = Commerce.Session.instance.cart;
                }

                if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                    alert("Margin Calculation: Please add a product to the transaction first.");
                    resolve({ halt: true });
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
                // Step 3 — Calculate margin (Phase 1: purchasePrice = 0 placeholder).
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
                if (ctx && ctx.navigator && typeof ctx.navigator.navigate === "function") {
                    ctx.navigator.navigate("MarginCalculationView", marginResult);
                } else if (typeof Commerce !== "undefined"
                         && Commerce.Host && Commerce.Host.instance
                         && typeof Commerce.Host.instance.navigateToView === "function") {
                    Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
                } else {
                    alert("Margin Calculation\n"
                        + "Item:   " + itemId + "\n"
                        + "Net:    " + netAmount.toFixed(2) + "\n"
                        + "Margin: " + marginPercentage.toFixed(2) + " %");
                }

                resolve({ halt: true });

            } catch (ex) {
                console.error("[MarginCalcTrigger] execute error:", ex);
                resolve({ halt: true });
            }
        });
    }
}
