// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
import {
    ExtensionOperationRequestHandlerBase
} from "PosApi/Create/Operations";
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

// SDK 9.55: ExtensionOperationRequestHandlerBase<T> has generic constraints on T
// (private _responseId, CRTP _t) that cannot be satisfied by a plain class.
// Using an intermediate any-typed variable to extend without type-checking
// the constraint — runtime behaviour is identical (prototype chain is correct).
const _OpBase: any = ExtensionOperationRequestHandlerBase;

// ---------------------------------------------------------------------------
// Handler class — registered in manifest operations[] for operationId 50001.
// ---------------------------------------------------------------------------
export default class MarginCalculationOperation extends _OpBase {

    /**
     * SDK REQUIREMENT: must return a truthy value.
     * Pos.Controls.js:18851 checks: if (!handler.supportedRequestType()) throw.
     */
    public supportedRequestType(): any {
        return function MarginCalculationOperationRequest() { return {}; };
    }

    /**
     * Single-parameter executeAsync — called by POS framework.
     */
    public executeAsync(request: any): Promise<any> {

        let _this: any = this;

        return new Promise<any>((resolve: any, reject: any): void => {

            try {
                let context: any = _this.context;

                // ------------------------------------------------------------------
                // Step 1 — Resolve the active cart and selected cart line.
                // ------------------------------------------------------------------
                let cart: any = context && context.cartAccessor
                    ? context.cartAccessor.cart
                    : null;

                if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                    alert("No sales line found. Please select a product line first.");
                    resolve({ canceled: true, data: void 0 });
                    return;
                }

                // Prefer the currently-highlighted line; fall back to first line.
                let selectedId: string = cart.SelectedCartLineId || "";
                let cartLine: any = cart.CartLines.filter(
                    (l: any) => l.LineId === selectedId
                )[0] || cart.CartLines[0];

                let itemId: string    = cartLine.ItemId    || "";
                let quantity: number  = cartLine.Quantity  || 0;
                let netAmount: number = cartLine.NetAmountWithAllInclusiveTax
                                     || cartLine.NetAmount
                                     || 0;

                // ------------------------------------------------------------------
                // Step 2 — PHASE 1: purchasePrice = 0.
                // Replace with CRT real-time service call in Phase 2.
                // ------------------------------------------------------------------
                let purchasePrice: number = 0;

                let totalCost: number        = purchasePrice * Math.abs(quantity);
                let marginAmount: number     = netAmount - totalCost;
                let marginPercentage: number = netAmount !== 0
                    ? (marginAmount / netAmount) * 100
                    : 0;

                let marginResult: IMarginCalculationResult = {
                    itemId:           itemId,
                    purchasePrice:    purchasePrice,
                    quantity:         quantity,
                    netAmount:        netAmount,
                    totalCost:        totalCost,
                    marginAmount:     marginAmount,
                    marginPercentage: marginPercentage
                };

                // ------------------------------------------------------------------
                // Step 3 — Navigate to the Margin Calculation view.
                // SDK 9.55: this.context.navigator.navigate(pageName, state).
                // ------------------------------------------------------------------
                let nav: any = context && context.navigator;
                if (nav && typeof nav.navigate === "function") {
                    nav.navigate("MarginCalculationView", marginResult);
                } else {
                    alert("Margin: " + marginResult.marginPercentage.toFixed(2) + " %");
                }

                resolve({ canceled: false, data: void 0 });

            } catch (ex) {
                reject(ex);
            }
        });
    }
}
