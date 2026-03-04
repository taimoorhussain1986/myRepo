// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
//
// NO imports that produce AMD require() calls at runtime.
// "PosApi/Create/Operations" is NOT a resolvable runtime AMD bundle in
// Store Commerce 9.55 — importing it causes the define() callback to never
// fire, making the module invisible in F12 debugger.
//
// Commerce is injected by the POS framework into the global scope.
// declare var makes it available for compile-time use without generating
// any AMD dependency entry.
//
declare var Commerce: any;

import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

// ---------------------------------------------------------------------------
// Request class — plain class, no SDK base class needed at runtime.
// The framework's check at Pos.Controls.js only verifies that
// supportedRequestType() returns a truthy constructor (not instanceof).
// ---------------------------------------------------------------------------
class MarginCalculationOperationRequest {
    public readonly operationId: number;
    public readonly correlationId: string;
    constructor(operationId: number, correlationId: string) {
        this.operationId   = operationId;
        this.correlationId = correlationId;
    }
}

// ---------------------------------------------------------------------------
// Operation handler — registered in manifest operations[].
// Plain class, no SDK base class, compiles to define(["require","exports"]).
// ---------------------------------------------------------------------------
export default class MarginCalculationOperation {

    /** Return the request constructor — must be truthy. */
    public supportedRequestType(): any {
        return MarginCalculationOperationRequest;
    }

    /**
     * Called by the POS framework when operation 50001 fires.
     * Context is injected as this.context by the framework before calling.
     */
    public executeAsync(request: any): Promise<any> {
        return new Promise<any>((resolve: any, reject: any): void => {
            try {
                // ---------------------------------------------------------------
                // Step 1 — Get cart (try context first, then global).
                // ---------------------------------------------------------------
                let cart: any = null;

                // Try this.context first (SDK 9.55 standard)
                const ctx: any = (this as any).context;
                if (ctx && ctx.cartAccessor && ctx.cartAccessor.cart) {
                    cart = ctx.cartAccessor.cart;
                } else if (Commerce && Commerce.Session && Commerce.Session.instance) {
                    // Fallback: Retail SDK 7.x / Cloud POS globals
                    cart = Commerce.Session.instance.cart;
                }

                if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                    alert("No sales line found. Please add a product to the transaction first.");
                    resolve({ canceled: false, data: {} });
                    return;
                }

                // Prefer the highlighted line; fall back to first line.
                const selectedId: string = cart.SelectedCartLineId || "";
                const cartLine: any = cart.CartLines.filter(
                    (l: any): boolean => l.LineId === selectedId
                )[0] || cart.CartLines[0];

                const itemId: string    = cartLine.ItemId   || "";
                const quantity: number  = cartLine.Quantity || 0;
                const netAmount: number = cartLine.NetAmountWithAllInclusiveTax
                                       || cartLine.NetAmount
                                       || 0;

                // ---------------------------------------------------------------
                // Step 2 — Phase 1: purchasePrice = 0 (replace in Phase 2).
                // ---------------------------------------------------------------
                const purchasePrice: number = 0;
                const totalCost: number        = purchasePrice * Math.abs(quantity);
                const marginAmount: number     = netAmount - totalCost;
                const marginPercentage: number = netAmount !== 0
                    ? (marginAmount / netAmount) * 100
                    : 0;

                const marginResult: IMarginCalculationResult = {
                    itemId,
                    purchasePrice,
                    quantity,
                    netAmount,
                    totalCost,
                    marginAmount,
                    marginPercentage
                };

                // ---------------------------------------------------------------
                // Step 3 — Navigate to the Margin Calculation view.
                // ---------------------------------------------------------------
                // Try SDK 9.55 context navigator first.
                if (ctx && ctx.navigator && typeof ctx.navigator.navigate === "function") {
                    ctx.navigator.navigate("MarginCalculationView", marginResult);
                } else if (Commerce && Commerce.Host && Commerce.Host.instance) {
                    // Fallback: Cloud POS / Retail SDK style navigation.
                    Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
                } else {
                    // Final fallback: display summary in alert.
                    alert("Margin: " + marginPercentage.toFixed(2) + " %\n"
                        + "Item: " + itemId + "\n"
                        + "Net: " + netAmount.toFixed(2));
                }

                resolve({ canceled: false, data: {} });
            } catch (ex) {
                console.error("[MarginCalculationOperation] executeAsync error:", ex);
                reject(ex);
            }
        });
    }
}
