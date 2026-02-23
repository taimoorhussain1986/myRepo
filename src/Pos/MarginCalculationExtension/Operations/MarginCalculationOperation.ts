// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------
// Note: Do NOT add `import Commerce = require("Commerce")`.
// In Retail SDK 7.2.x the Commerce namespace is a GLOBAL declared by the
// BT.POS project's type definition files (Pos.Api.d.ts / PosApi.d.ts).
// Importing it as an AMD module causes TS2792 / TS2304 errors.
// ----------------------------------------------------------------------------

import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * POS Operation handler for Margin Calculation (Operation ID: 50001).
 * Retail SDK 7.2.x compatible.
 *
 * The "Margin" button must be added to the button grid in HQ
 * (Screen Layout Designer → blank Action → Operation number 50001).
 *
 * Registered in Manifest.json requestHandlers:
 *   { "name": "MarginCalculationOperation",
 *     "description": "MarginCalculationOperation",
 *     "modulePath": "Operations/MarginCalculationOperation" }
 */
export default class MarginCalculationOperation extends Commerce.Operations.OperationHandlerBase {

    /**
     * Called by the POS runtime when operation 50001 fires.
     * Return type is `any` so this file compiles standalone (IAsyncResult is
     * a global defined in the parent BT.POS project's type definitions).
     */
    public executeAsync(options: Commerce.Operations.IOperationOptions): any {

        let asyncQueue: Commerce.AsyncQueue = new Commerce.AsyncQueue();

        asyncQueue.enqueue((): any => {

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
                    .map((): any => ({ canceled: true }));
            }

            // Default to first cart line. Adapt here to use the selected line
            // if your SDK version exposes Commerce.Session.instance.selectedCartLine.
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
            //      that exposes an OData action calling GetMarginCalculationRequest.
            //   b) Generated TypeScript proxies via BT.ScaleUnit proxy generation.
            //
            // Proxy call example (replace placeholder):
            //   let manager = Commerce.Proxy.ObjectFactory.Create<IMarginManager>("<entityset>");
            //   return manager.getMarginCalculation(itemId, quantity, netAmount, dataAreaId)
            //       .map((r: any): any => {
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

            return Commerce.AsyncResult.createResolved<any>({ canceled: false });
        });

        return asyncQueue.run();
    }
}
