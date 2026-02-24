// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
// Store Commerce App SDK (PosApi) — operation handler for custom op 50001.
// Registered in manifest.json under requestHandlers.
// Button is added to the button grid in HQ Screen Layout Designer:
//   blank Action → Operation number 50001
// ----------------------------------------------------------------------------

import { ExtensionOperationRequestHandlerBase, ExtensionOperationRequestType } from "PosApi/Create/Operations";
import { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

// ---------------------------------------------------------------------------
// SDK 9.55: ExtensionOperationRequestHandlerBase<T> is generic.
// ExtensionOperationRequestType<T> is a constructor-type alias (not a class) —
// it cannot be instantiated with `new`.  supportedRequestType() must return
// the REQUEST CLASS CONSTRUCTOR (typeof MarginCalculationRequest), not an instance.
// ---------------------------------------------------------------------------

/**
 * Minimal request class for custom operation 50001.
 * The shape (operationId + operationOptions) satisfies the SDK generic constraint.
 */
export class MarginCalculationRequest {
    public readonly operationId: number = 50001;
    public readonly operationOptions: any = {};
    public readonly correlationId: string;
    constructor(correlationId: string) {
        this.correlationId = correlationId;
    }
}

/**
 * POS Operation handler for Margin Calculation (Operation ID: 50001).
 * Registered in manifest.json under requestHandlers.
 * Button added in HQ: Screen Layout Designer → Button Grid → blank Action → Operation 50001.
 */
export default class MarginCalculationOperation extends ExtensionOperationRequestHandlerBase<MarginCalculationRequest> {

    /**
     * Returns the request CLASS CONSTRUCTOR (not an instance).
     * SDK resolves the constructor type as ExtensionOperationRequestType<T>.
     */
    public supportedRequestType(): ExtensionOperationRequestType<MarginCalculationRequest> {
        return MarginCalculationRequest as any;
    }

    /**
     * Called by the POS runtime when operation 50001 fires.
     * context — typed as any: SDK 9.55 provides IExtensionOperationHandlerContext
     *           which is a separate export (not a namespace member of the base class).
     */
    public executeAsync(
        context: any,
        request: MarginCalculationRequest
    ): Promise<{ canceled: boolean; data: void; }> {

        // -----------------------------------------------------------------------
        // Step 1: Read the current cart via the POS runtime.
        // -----------------------------------------------------------------------
        let cart: any = (context as any).currentTransaction;

        if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
            // No product line in the transaction — show a message and cancel.
            return (context as any).messageDialogHelper
                .showMessage("Please select a product line before calculating margin.")
                .then((): { canceled: boolean; data: void; } => {
                    return { canceled: true, data: undefined as any };
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
