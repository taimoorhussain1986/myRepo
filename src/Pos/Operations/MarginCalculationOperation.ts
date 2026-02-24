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

// ---------------------------------------------------------------------------
// SDK 9.55:
//   ExtensionOperationRequestHandlerBase<T extends Response>
//   T must satisfy `extends Response`, i.e. it must have _responseId / responseId.
//   ClientEntities.ExtensionOperationRequest<TOptions> already extends Response,
//   so we derive our request from it.
//
//   executeAsync(request: T) — single parameter; context comes via request.context.
//
//   supportedRequestType() must return the CLASS CONSTRUCTOR (not `new ...`).
// ---------------------------------------------------------------------------

/**
 * Typed request for custom operation 50001.
 * Extending ClientEntities.ExtensionOperationRequest<IOperationOptions>
 * satisfies the `T extends Response` constraint on
 * ExtensionOperationRequestHandlerBase<T>.
 */
export class MarginCalculationRequest
    extends ClientEntities.ExtensionOperationRequest<ClientEntities.IOperationOptions> {

    constructor(correlationId: string, options: ClientEntities.IOperationOptions) {
        super(50001, correlationId, options);
    }
}

/**
 * POS Operation handler for Margin Calculation (Operation ID: 50001).
 * Registered in manifest.json under requestHandlers.
 * Button added in HQ: Screen Layout Designer → Button Grid → blank Action → Operation 50001.
 */
export default class MarginCalculationOperation
    extends ExtensionOperationRequestHandlerBase<MarginCalculationRequest> {

    /**
     * Returns the request CLASS CONSTRUCTOR.
     * SDK resolves it as ExtensionOperationRequestType<T>.
     */
    public supportedRequestType(): ExtensionOperationRequestType<MarginCalculationRequest> {
        return MarginCalculationRequest;
    }

    /**
     * Called by the POS runtime when operation 50001 fires.
     * In SDK 9.55 the handler receives a SINGLE request parameter;
     * the execution context is accessed via request.context.
     */
    public executeAsync(
        request: MarginCalculationRequest
    ): Promise<ClientEntities.ICancelableDataResult<void>> {

        let context: any = (request as any).context;

        // -----------------------------------------------------------------------
        // Step 1: Read the current transaction (cart) via the context.
        // -----------------------------------------------------------------------
        let cart: any = context && context.currentTransaction
            ? context.currentTransaction
            : null;

        if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
            return Promise.resolve({ canceled: true, data: undefined });
        }

        // Use the first cart line — swap in your line-selection logic if needed.
        let cartLine: any = cart.CartLines[0];

        let itemId: string    = cartLine.ItemId   || "";
        let quantity: number  = cartLine.Quantity || 0;
        // NetAmountWithAllInclusiveTax is the revenue figure in the margin formula.
        let netAmount: number = cartLine.NetAmountWithAllInclusiveTax
                             || cartLine.NetAmount
                             || 0;

        // -----------------------------------------------------------------------
        // Step 2: Retrieve purchase price from CRT via real-time service.
        //
        // Once ContosoGetItemPurchasePrice (X++) is deployed and the
        // BT.ScaleUnit proxy regenerated, replace the block below with the
        // generated proxy call, e.g.:
        //
        //   let dataService: any = context.runtime.executeAsync(
        //       new GetMarginCalculationRequest(itemId, quantity, netAmount));
        //   return dataService.then((resp: any) => {
        //       let result = resp.data;
        //       context.navigator.navigate("MarginCalculationView", { data: result });
        //       return { canceled: false, data: undefined };
        //   });
        //
        // Until CRT is deployed, purchasePrice is 0 so you can verify the view.
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
        // Step 3: Navigate to the custom view.
        // -----------------------------------------------------------------------
        if (context && context.navigator) {
            context.navigator.navigate("MarginCalculationView", { data: marginResult });
        }

        return Promise.resolve({ canceled: false, data: undefined });
    }
}
