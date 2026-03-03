// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
// SDK 9.55: Custom operation handler pattern.
//
// KEY FIX: supportedRequestType() MUST return the constructor of the request
// class — NOT null.  Pos.Controls.js:18851 checks:
//   if (!handler.supportedRequestType()) { throw CommerceError("not supported"); }
// Returning null causes "operation is not supported" regardless of base class.
//
// The request class must extend Operations.OperationRequest (from
// PosApi/Create/Operations). executeAsync takes (context, request).
// ----------------------------------------------------------------------------
import * as Operations from "PosApi/Create/Operations";
import { ClientEntities } from "PosApi/Entities";
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

// ---------------------------------------------------------------------------
// Request class — required by ExtensionOperationRequestHandlerBase<T>.
// T must extend Operations.OperationRequest.
// ---------------------------------------------------------------------------
export class MarginCalculationOperationRequest extends Operations.OperationRequest {
    constructor(correlationId: string) {
        super(correlationId);
    }
}

// ---------------------------------------------------------------------------
// Handler class — registered in manifest operations[] for operationId 50001.
// ---------------------------------------------------------------------------
export default class MarginCalculationOperation
    extends Operations.ExtensionOperationRequestHandlerBase<MarginCalculationOperationRequest> {

    /**
     * SDK REQUIREMENT: must return the constructor of the request type.
     * Returning null → framework throws "operation is not supported".
     */
    public supportedRequestType(): Operations.ExtensionOperationRequestType<MarginCalculationOperationRequest> {
        return MarginCalculationOperationRequest;
    }

    public executeAsync(
        context: Operations.ExtensionOperationRequestHandlerBase.IContext,
        request: MarginCalculationOperationRequest
    ): Promise<ClientEntities.ICancelableDataResult<void>> {

        return new Promise<ClientEntities.ICancelableDataResult<void>>(
            (resolve: (value: ClientEntities.ICancelableDataResult<void>) => void,
             reject: (reason?: any) => void): void => {

            try {
                // ------------------------------------------------------------------
                // Step 1 — Resolve the active cart and selected cart line.
                // In SDK 9.55 the cart is on context.cartAccessor.cart.
                // ------------------------------------------------------------------
                let cart: any = context && (context as any).cartAccessor
                    ? (context as any).cartAccessor.cart
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
                // SDK 9.55: context.navigator.navigate(pageName, state).
                // ------------------------------------------------------------------
                let nav: any = (context as any).navigator;
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
