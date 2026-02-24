// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
// Commerce is a global ambient namespace loaded by the POS framework at runtime.
// Declaring it as `any` here lets this file compile in isolation without the
// full SDK type-definition tree.  Because this file has an `export`, this
// declaration is MODULE-LOCAL and does not conflict with the global
// `namespace Commerce` declared in the parent BT.POS project.
declare var Commerce: any;

import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

// ---------------------------------------------------------------------------
// `Commerce` is `any`, so property access on it is also `any`.
// TypeScript 4.2+ allows a class to `extend` an expression typed as `any`.
// ---------------------------------------------------------------------------
const _Base: any = Commerce.Operations.OperationHandlerBase;

/**
 * POS Operation handler for Margin Calculation (Operation ID: 50001).
 *
 * Registered in manifest.json under requestHandlers:
 *   { "name": "MarginCalculationOperation",
 *     "description": "Margin Calculation",
 *     "modulePath": "Operations/MarginCalculationOperation" }
 *
 * Button added in HQ:
 *   Screen Layout Designer → Button Grid → Configure → blank Action → Operation number 50001
 */
export default class MarginCalculationOperation extends _Base {

    /**
     * Called by the POS runtime when operation 50001 fires.
     * @param options  Runtime options passed by the button grid framework.
     */
    public executeAsync(options: any): any {

        let asyncQueue: any = new Commerce.AsyncQueue();

        asyncQueue.enqueue((): any => {

            // ------------------------------------------------------------------
            // Step 1 — Resolve the active cart and selected cart line.
            // ------------------------------------------------------------------
            let cart: any = Commerce.Session.instance.cart;

            if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                let errors: any[] = [
                    new Commerce.Proxy.Entities.Error(
                        "MARGIN_CALC_NO_LINE",
                        false,
                        "No sales line found. Please add a product to the transaction first."
                    )
                ];
                return Commerce.NotificationHandler.displayClientErrors(errors)
                    .map((): any => ({ canceled: true }));
            }

            // Prefer the currently-highlighted line; fall back to the first line.
            let selectedId: string = cart.SelectedCartLineId || "";
            let cartLine: any = cart.CartLines.filter(
                (l: any) => l.LineId === selectedId
            )[0] || cart.CartLines[0];

            let itemId: string   = cartLine.ItemId   || "";
            let quantity: number = cartLine.Quantity  || 0;
            // NetAmountWithAllInclusiveTax is the revenue figure in the margin formula.
            let netAmount: number = cartLine.NetAmountWithAllInclusiveTax
                                 || cartLine.NetAmount
                                 || 0;

            // ------------------------------------------------------------------
            // Step 2 — Retrieve purchase price from CRT via real-time service.
            //
            // PHASE 1 (current): purchasePrice is 0 so you can test the view
            // end-to-end before the X++ real-time service is deployed.
            //
            // PHASE 2 (after deploying ContosoGetItemPurchasePrice X++ + CRT):
            // The build will auto-generate a proxy entry in DataService/DataServiceRequests.g.ts.
            // Replace the block below with:
            //
            //   let getMarginReq: any = new Commerce.Proxy.DataServiceRequests
            //       .GetMarginCalculationRequest(itemId, quantity, netAmount);
            //   return asyncQueue.runNext().run(getMarginReq)
            //       .map((result: any) => {
            //           Commerce.Host.instance.navigateToView("MarginCalculationView", result.data);
            //           return { canceled: false };
            //       });
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
            // Step 3 — Navigate to the custom view, passing the margin data.
            // ------------------------------------------------------------------
            Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
            return asyncQueue.runNext();
        });

        return asyncQueue.run().map((): any => ({ canceled: false }));
    }
}
