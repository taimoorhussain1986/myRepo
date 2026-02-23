// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------
// Commerce is a global ambient namespace injected by the BT.POS project's SDK
// type definitions.  When this file is compiled standalone (our own tsconfig),
// no type definition file is in scope, so we declare Commerce as `any` here.
// This is a MODULE-LOCAL declaration (the file has `export`) so it does NOT
// conflict with the global `namespace Commerce` in the parent BT.POS project.
declare var Commerce: any;

import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * POS Operation handler for Margin Calculation (Operation ID: 50001).
 *
 * The "Margin" button must be added to the button grid in HQ via:
 * Screen Layout Designer → blank Action → Operation number 50001
 *
 * Registered in Manifest.json requestHandlers:
 *   { "name": "MarginCalculationOperation",
 *     "description": "MarginCalculationOperation",
 *     "modulePath": "Operations/MarginCalculationOperation" }
 */

// Intermediate variable so TypeScript 4.x can accept `extends _Base`.
// `Commerce` is typed as `any` above, so property access returns `any`.
// TypeScript 4.2+ allows a class to extend an expression typed as `any`.
const _Base: any = Commerce.Operations.OperationHandlerBase;

export default class MarginCalculationOperation extends _Base {

    /**
     * Called by the POS runtime when operation 50001 fires.
     */
    public executeAsync(options: any): any {

        // All variables are typed as `any` to avoid TS2503 namespace errors
        // when compiling without the full BT.POS SDK type definitions.
        let asyncQueue: any = new Commerce.AsyncQueue();

        asyncQueue.enqueue((): any => {

            // ------------------------------------------------------------------
            // Step 1: Get current cart and the active cart line.
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

            // Default to first cart line.
            // Adapt to use Commerce.Session.instance.selectedCartLine if available in your SDK.
            let cartLine: any = cart.CartLines[0];

            let itemId: string    = cartLine.ItemId    || "";
            let quantity: number  = cartLine.Quantity  || 0;
            // NetAmountWithAllInclusiveTax is the revenue figure in the margin formula.
            let netAmount: number = cartLine.NetAmountWithAllInclusiveTax
                                 || cartLine.NetAmount
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

            return Commerce.AsyncResult.createResolved({ canceled: false });
        });

        return asyncQueue.run();
    }
}
