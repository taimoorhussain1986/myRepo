// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------
// Commerce is a global ambient namespace declared by the SDK type definitions
// included via pos-tsconfig-base.json (from the parent BT.POS project).
// Do NOT add `import Commerce = require("Commerce")` – it is not an AMD module.
// ----------------------------------------------------------------------------

import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * POS Operation handler for Margin Calculation (Operation ID: 50001).
 *
 * The "Margin" button must be added to the button grid in HQ via:
 *   Screen Layout Designer → blank Action → Operation number 50001
 *
 * Registered in Manifest.json requestHandlers:
 *   { "name": "MarginCalculationOperation",
 *     "description": "MarginCalculationOperation",
 *     "modulePath": "Operations/MarginCalculationOperation" }
 */
export default class MarginCalculationOperation extends Commerce.Operations.OperationHandlerBase {

    /** Called by the POS runtime when operation 50001 fires. */
    public executeAsync(
        options: Commerce.Operations.IOperationOptions
    ): IAsyncResult<Commerce.Client.Entities.ICancelable> {

        let asyncQueue: Commerce.AsyncQueue = new Commerce.AsyncQueue();

        asyncQueue.enqueue((): IAsyncResult<Commerce.Client.Entities.ICancelable> => {

            // ------------------------------------------------------------------
            // Step 1: Get current cart and the active cart line.
            // ------------------------------------------------------------------
            let cart: Commerce.Proxy.Entities.Cart = Commerce.Session.instance.cart;

            if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                let errors: Commerce.Proxy.Entities.Error[] = [
                    new Commerce.Proxy.Entities.Error(
                        "MARGIN_CALC_NO_LINE",
                        false,
                        "No sales line found. Please add a product to the transaction first."
                    )
                ];
                return Commerce.NotificationHandler.displayClientErrors(errors)
                    .map((): Commerce.Client.Entities.ICancelable => ({ canceled: true }));
            }

            // Default to first cart line.
            // Adapt to use Commerce.Session.instance.selectedCartLine if available in your SDK.
            let cartLine: Commerce.Proxy.Entities.CartLine = cart.CartLines[0];

            let itemId: string    = cartLine.ItemId    || "";
            let quantity: number  = cartLine.Quantity  || 0;
            // NetAmountWithAllInclusiveTax is the revenue figure in the margin formula.
            let netAmount: number = (cartLine as any).NetAmountWithAllInclusiveTax
                                 || (cartLine as any).NetAmount
                                 || 0;

            // ------------------------------------------------------------------
            // Step 2: Get purchase price from CRT via Retail Server proxy.
            //
            // Replace the placeholder below once you have:
            //   a) A Retail Server extension controller (BT.RetailServer project)
            //      exposing an OData action for GetMarginCalculationRequest.
            //   b) Generated TypeScript proxies (BT.ScaleUnit proxy generation).
            //
            // Proxy call example (replace this whole block):
            //   let manager = Commerce.Proxy.ObjectFactory.Create("<entityset>");
            //   return manager.getMarginCalculation(itemId, quantity, netAmount, dataAreaId)
            //       .map((r: IMarginCalculationResult): Commerce.Client.Entities.ICancelable => {
            //           Commerce.Host.instance.navigateToView("MarginCalculationView", r);
            //           return { canceled: false };
            //       });
            //
            // Until the controller is deployed, purchasePrice defaults to 0.
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
            // Step 3: Navigate to the custom Margin Calculation view.
            // ------------------------------------------------------------------
            Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);

            return Commerce.AsyncResult.createResolved<Commerce.Client.Entities.ICancelable>(
                { canceled: false }
            );
        });

        return asyncQueue.run();
    }
}
