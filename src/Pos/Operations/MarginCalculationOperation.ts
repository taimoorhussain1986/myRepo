// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
// SDK 9.55: operation handlers must extend ExtensionOperationRequestHandlerBase
// from PosApi/Create/Operations — the same pattern as views needing
// CustomViewControllerBase from PosApi/Create/Views.
// A plain class without this base fails the Pos.Controls.js instanceof check
// and gives "operation is not supported".
import * as Operations from "PosApi/Create/Operations";
import { ClientEntities } from "PosApi/Entities";
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

export default class MarginCalculationOperation
    extends Operations.ExtensionOperationRequestHandlerBase<any> {

    public supportedRequestType(): any {
        return null;
    }

    public executeAsync(context: any): Promise<ClientEntities.ICancelableDataResult<void>> {

        return new Promise<ClientEntities.ICancelableDataResult<void>>(
            (resolve: (value: ClientEntities.ICancelableDataResult<void>) => void,
             reject: (reason?: any) => void): void => {

            try {
                // ------------------------------------------------------------------
                // Step 1 — Resolve the active cart and selected cart line.
                // In SDK 9.55 the cart is on context.cartAccessor.cart.
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
                // SDK 9.55: context.navigator.navigate(pageName, state).
                // ------------------------------------------------------------------
                if (context && context.navigator
                        && typeof context.navigator.navigate === "function") {
                    context.navigator.navigate("MarginCalculationView", marginResult);
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
