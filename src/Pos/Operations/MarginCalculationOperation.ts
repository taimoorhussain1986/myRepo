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

/**
 * POS Operation handler for Margin Calculation (Operation ID: 50001).
 *
 * Registered in manifest.json under components.extend.operations:
 *   { "operationId": 50001,
 *     "operationRequestHandlerPath": "Operations/MarginCalculationOperation" }
 *
 * ⚠️  DO NOT extend Commerce.Operations.OperationHandlerBase here.
 *     In Store Commerce SDK 9.55, that property does NOT exist on the global
 *     Commerce namespace at module-load time.  Accessing it yields `undefined`,
 *     and `class Foo extends undefined` throws a TypeError immediately when the
 *     module is first imported — the POS framework catches it and shows
 *     "operation is not supported" with NO event-viewer entry.
 *
 *     The manifest `operations` registration only requires the exported class
 *     to have an `executeAsync(request)` method.  No base class is needed.
 */
export default class MarginCalculationOperation {

    /**
     * Called by the POS runtime when operation 50001 fires.
     * @param options  Runtime options passed by the button grid framework.
     *
     * Returns a native Promise — Commerce.AsyncQueue is a Retail SDK 7.2.x
     * construct that does NOT exist in Store Commerce 9.55.  Using it would
     * throw "Commerce.AsyncQueue is not a constructor" at runtime, which the
     * framework catches and surfaces as "operation is not supported".
     */
    public executeAsync(options: any): any {

        return new Promise<any>((resolve: any, reject: any): void => {

            try {
                // ------------------------------------------------------------------
                // Step 1 — Resolve the active cart and selected cart line.
                // Guard every Commerce.* access with a null-check so that a
                // missing runtime API gives a safe message, not a thrown TypeError.
                // ------------------------------------------------------------------
                let session: any = Commerce.Session && Commerce.Session.instance;
                let cart: any    = session ? session.cart : null;

                if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                    // Show a friendly error and cancel without navigating.
                    alert("No sales line found. Please select a product line first.");
                    resolve({ canceled: true });
                    return;
                }

                // Prefer the currently-highlighted line; fall back to the first line.
                let selectedId: string = cart.SelectedCartLineId || "";
                let cartLine: any = cart.CartLines.filter(
                    (l: any) => l.LineId === selectedId
                )[0] || cart.CartLines[0];

                let itemId: string    = cartLine.ItemId    || "";
                let quantity: number  = cartLine.Quantity   || 0;
                // NetAmountWithAllInclusiveTax is the revenue figure in the margin formula.
                let netAmount: number = cartLine.NetAmountWithAllInclusiveTax
                                     || cartLine.NetAmount
                                     || 0;

                // ------------------------------------------------------------------
                // Step 2 — Retrieve purchase price from CRT via real-time service.
                //
                // PHASE 1 (current): purchasePrice = 0 so you can test the view
                // end-to-end before the X++ real-time service is deployed.
                //
                // PHASE 2 (after deploying the X++ real-time service + CRT handler):
                // Replace the line below with a call to the generated proxy, e.g.:
                //
                //   let manager = Commerce.Proxy.ObjectFactory.Create<any>("...");
                //   manager.GetMarginCalculation(itemId, quantity, netAmount)
                //       .then((result: any) => {
                //           Commerce.Host.instance.navigateToView("MarginCalculationView", result);
                //           resolve({ canceled: false });
                //       })
                //       .catch(reject);
                //   return; // exit the try-block; resolve() called in callback
                // ------------------------------------------------------------------
                let purchasePrice: number = 0;

                let totalCost: number        = purchasePrice * Math.abs(quantity);
                let marginAmount: number     = netAmount - totalCost;
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
                // Step 3 — Navigate to the custom view, passing the margin data.
                // ------------------------------------------------------------------
                let host: any = Commerce.Host && Commerce.Host.instance;
                if (host && typeof host.navigateToView === "function") {
                    host.navigateToView("MarginCalculationView", marginResult);
                } else {
                    // Fallback for environments where navigateToView is absent.
                    alert("Margin: " + marginResult.marginPercentage.toFixed(2) + " %");
                }

                resolve({ canceled: false });

            } catch (ex) {
                // Surface exceptions as rejected Promises so the framework can
                // display them cleanly instead of showing "operation not supported".
                reject(ex);
            }
        });
    }
}
