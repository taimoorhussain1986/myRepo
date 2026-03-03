// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
import {
    ExtensionOperationRequestHandlerBase,
    ExtensionOperationRequestBase
} from "PosApi/Create/Operations";
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

// SDK 9.55: Generic constraints on ExtensionOperationRequestHandlerBase<T> and
// ExtensionOperationRequestBase<TResponse> require private members that cannot
// be satisfied by a plain class. Intermediate any-typed variables bypass the
// constraint check at compile time; runtime prototype chain is identical.
const _OpBase: any = ExtensionOperationRequestHandlerBase;
const _ReqBase: any = ExtensionOperationRequestBase;

// ---------------------------------------------------------------------------
// Request class — must extend ExtensionOperationRequestBase so that the
// framework's instanceof check at Pos.Controls.js passes.
// ---------------------------------------------------------------------------
class MarginCalculationOperationRequest extends _ReqBase {
    constructor(correlationId: string) {
        super(50001, correlationId);
    }
}

// ---------------------------------------------------------------------------
// Handler class — registered in manifest operations[] for operationId 50001.
// ---------------------------------------------------------------------------
export default class MarginCalculationOperation extends _OpBase {

    /**
     * SDK REQUIREMENT: must return a constructor whose prototype inherits from
     * ExtensionOperationRequestBase. The framework checks this with instanceof.
     */
    public supportedRequestType(): any {
        return MarginCalculationOperationRequest;
    }

    /**
     * Single-parameter executeAsync — called by POS framework with the request
     * instance created from supportedRequestType().
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
                    alert("No sales line found. Please add a product to the transaction first.");
                    resolve({ canceled: false, data: { canceled: false } });
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
                    // Fallback: show alert if navigator is not available.
                    alert("Margin: " + marginResult.marginPercentage.toFixed(2) + " %\n"
                        + "Item: " + itemId + "\n"
                        + "Net Amount: " + netAmount.toFixed(2));
                }

                resolve({ canceled: false, data: { canceled: false } });

            } catch (ex) {
                reject(ex);
            }
        });
    }
}
