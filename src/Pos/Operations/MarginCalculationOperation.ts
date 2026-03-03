// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
// SDK 9.55 custom operation handler — correct API:
//
// 1. Request class MUST extend ExtensionOperationRequestBase<TResponse>
//    (not OperationRequest — that does not exist in PosApi/Create/Operations).
//    ExtensionOperationRequestBase provides _responseId, responseId,
//    skipManagerPermissionChecks, operationId, correlationId, _t — all required
//    by the ExtensionOperationRequestHandlerBase<T> generic constraint.
//
// 2. executeAsync takes ONE parameter: the request object.
//    The execution context is accessed via this.context (set by the base class).
//
// 3. supportedRequestType() must return the request class constructor.
// ----------------------------------------------------------------------------
import {
    ExtensionOperationRequestBase,
    ExtensionOperationRequestHandlerBase,
    ExtensionOperationRequestType
} from "PosApi/Create/Operations";
import { ClientEntities } from "PosApi/Entities";
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

// ---------------------------------------------------------------------------
// Request class — T for ExtensionOperationRequestHandlerBase<T, TResponse>.
// Constructor must accept (operationId: number, correlationId: string).
// ---------------------------------------------------------------------------
export class MarginCalculationOperationRequest extends ExtensionOperationRequestBase<void> {
    constructor(operationId: number, correlationId: string) {
        super(operationId, correlationId);
    }
}

// ---------------------------------------------------------------------------
// Handler class — registered in manifest operations[] for operationId 50001.
// ---------------------------------------------------------------------------
export default class MarginCalculationOperation
    extends ExtensionOperationRequestHandlerBase<MarginCalculationOperationRequest, void> {

    /**
     * SDK REQUIREMENT: must return the request class constructor.
     * Pos.Controls.js:18851 checks: if (!handler.supportedRequestType()) throw.
     */
    public supportedRequestType(): ExtensionOperationRequestType<MarginCalculationOperationRequest, void> {
        return MarginCalculationOperationRequest;
    }

    /**
     * Single-parameter signature — matches base class.
     * Access execution context via this.context (set by ExtensionOperationRequestHandlerBase).
     */
    public executeAsync(
        request: MarginCalculationOperationRequest
    ): Promise<ClientEntities.ICancelableDataResult<void>> {

        let _this: any = this;

        return new Promise<ClientEntities.ICancelableDataResult<void>>(
            (resolve: (value: ClientEntities.ICancelableDataResult<void>) => void,
             reject: (reason?: any) => void): void => {

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
