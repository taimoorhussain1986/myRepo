// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------

import Commerce = require("Commerce");
import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * POS Operation handler for Margin Calculation (Operation ID: 50001).
 * Retail SDK 7.2.x / Commerce Scale Unit SDK compatible implementation.
 *
 * Triggered when the "Margin" button (configured in HQ Screen Layout Designer
 * with blank Action and Operation number 50001) is pressed.
 *
 * Registered in Manifest.json requestHandlers:
 *   { "name": "MarginCalculationOperation",
 *     "description": "MarginCalculationOperation",
 *     "modulePath": "Operations/MarginCalculationOperation" }
 */
export default class MarginCalculationOperation extends Commerce.Operations.OperationHandlerBase {

    /**
     * Entry point called by the POS runtime when operation 50001 is triggered.
     */
    public executeAsync(
        options: Commerce.Operations.IOperationOptions
    ): IAsyncResult<Commerce.Client.Entities.ICancelable> {

        let asyncQueue = new Commerce.AsyncQueue();

        asyncQueue.enqueue((): IAsyncResult<Commerce.Client.Entities.ICancelable> => {

            // ------------------------------------------------------------------
            // Step 1: Get current cart and the first (or selected) cart line.
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

            // Use first cart line as default (adapt if your SDK exposes the selected line).
            let cartLine: Commerce.Proxy.Entities.CartLine = cart.CartLines[0];
            let itemId: string     = cartLine.ItemId || "";
            let quantity: number   = cartLine.Quantity || 0;
            // NetAmountWithAllInclusiveTax is the revenue figure per the margin formula.
            let netAmount: number  = cartLine.NetAmountWithAllInclusiveTax
                                  || cartLine.NetAmount
                                  || 0;

            // ------------------------------------------------------------------
            // Step 2: Get purchase price from CRT via Retail Server proxy.
            //
            // To complete the CRT real-time service integration:
            //   a) Add a Retail Server extension controller (e.g. MarginCalculationController.cs
            //      in BT.ScaleUnit\BT.RetailServer) that exposes an OData action calling
            //      the CRT GetMarginCalculationRequest.
            //   b) Run TypeScript proxy generation in BT.ScaleUnit to create the proxy manager.
            //   c) Replace the placeholder block below with:
            //
            //      let manager = Commerce.Proxy.ObjectFactory
            //          .Create<IMarginCalculationManager>(/* entity set name */);
            //      return manager.getMarginCalculation(itemId, quantity, netAmount, dataAreaId)
            //          .map((response): Commerce.Client.Entities.ICancelable => {
            //              Commerce.Host.instance.navigateToView("MarginCalculationView", response);
            //              return { canceled: false };
            //          });
            //
            // Until the Retail Server controller is deployed and the proxy generated,
            // purchasePrice defaults to 0 — the view will show margin based on revenue only.
            // ------------------------------------------------------------------
            let purchasePrice: number = 0;

            let totalCost: number       = purchasePrice * Math.abs(quantity);
            let marginAmount: number    = netAmount - totalCost;
            let marginPercentage: number = netAmount !== 0
                ? (marginAmount / netAmount) * 100
                : 0;

            let marginResult: IMarginCalculationResult = {
                itemId:            itemId,
                purchasePrice:     purchasePrice,
                quantity:          quantity,
                netAmount:         netAmount,
                totalCost:         totalCost,
                marginAmount:      marginAmount,
                marginPercentage:  marginPercentage
            };

            // ------------------------------------------------------------------
            // Step 3: Navigate to the Margin Calculation custom view.
            // ------------------------------------------------------------------
            Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);

            return Commerce.AsyncResult.createResolved<Commerce.Client.Entities.ICancelable>(
                { canceled: false }
            );
        });

        return asyncQueue.run();
    }
}
