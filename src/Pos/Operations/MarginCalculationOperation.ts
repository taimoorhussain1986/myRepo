// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
// Store Commerce App SDK (PosApi) — operation handler for custom op 50001.
// Registered in manifest.json under requestHandlers.
// Button is added to the button grid in HQ Screen Layout Designer:
//   blank Action → Operation number 50001
// ----------------------------------------------------------------------------

import { ExtensionOperationRequestHandlerBase, ExtensionOperationRequestType } from "PosApi/Create/Operations";
import { ClientEntities } from "PosApi/Entities";
import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

/**
 * POS Operation handler for Margin Calculation (Operation ID: 50001).
 */
export default class MarginCalculationOperation extends ExtensionOperationRequestHandlerBase {

    /** Return the request type this handler supports. */
    public supportedRequestType(): ExtensionOperationRequestType {
        return new ExtensionOperationRequestType(50001);
    }

    /**
     * Called by the POS runtime when operation 50001 fires.
     * context: ExtensionOperationRequestHandlerBase.IContext
     * request: the extension operation request carrying IOperationOptions
     */
    public executeAsync(
        context: ExtensionOperationRequestHandlerBase.IContext,
        request: ClientEntities.ExtensionOperationRequest<ClientEntities.IOperationOptions>
    ): Promise<ClientEntities.ICancelableDataResult<void>> {

        // -----------------------------------------------------------------------
        // Step 1: Read the current cart via the POS runtime.
        // -----------------------------------------------------------------------
        let cart: any = (context as any).currentTransaction;

        if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
            // No product line in the transaction — show a message and cancel.
            return (context as any).messageDialogHelper
                .showMessage("Please select a product line before calculating margin.")
                .then((): ClientEntities.ICancelableDataResult<void> => {
                    return { canceled: true, data: undefined };
                });
        }

        // Use the first cart line (or the selected line if your SDK exposes it).
        let cartLine: any = cart.CartLines[0];

        let itemId: string    = cartLine.ItemId    || "";
        let quantity: number  = cartLine.Quantity  || 0;
        // NetAmountWithAllInclusiveTax is the revenue figure in the margin formula.
        let netAmount: number = cartLine.NetAmountWithAllInclusiveTax
                             || cartLine.NetAmount
                             || 0;

        // -----------------------------------------------------------------------
        // Step 2: Retrieve purchase price from CRT via the real-time service.
        //
        // Once the D365 F&O real-time service method (ContosoGetItemPurchasePrice)
        // is deployed and the BT.ScaleUnit proxy is regenerated, replace the
        // placeholder block below with the generated proxy call, e.g.:
        //
        //   let dataServiceManager: any = new (context as any).dataServiceHandlerFactory
        //       .create("MarginCalculationDataService");
        //   return dataServiceManager.getItemPurchasePrice(itemId)
        //       .then((priceResponse: any) => {
        //           let purchasePrice: number = priceResponse.purchasePrice || 0;
        //           ... compute margin ...
        //           (context as any).navigator.navigate("MarginCalculationView", { data: marginResult });
        //           return { canceled: false, data: undefined };
        //       });
        //
        // Until the CRT service is deployed, purchasePrice defaults to 0.
        // -----------------------------------------------------------------------
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

        // -----------------------------------------------------------------------
        // Step 3: Navigate to the custom Margin Calculation view.
        // -----------------------------------------------------------------------
        (context as any).navigator.navigate("MarginCalculationView", { data: marginResult });

        return Promise.resolve({ canceled: false, data: undefined });
    }
}
