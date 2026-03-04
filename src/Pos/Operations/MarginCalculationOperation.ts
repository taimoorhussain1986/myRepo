// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
//
// "PosApi/Create/Operations" IS resolvable at runtime in Store Commerce 9.55
// (same AMD bundle system as "PosApi/Create/Views" which works for the view).
//
// We use intermediate `any`-typed consts to bypass TypeScript's unsatisfiable
// generic constraints (private _responseId, CRTP _t) on ExtensionOperationRequestBase
// and ExtensionOperationRequestHandlerBase. At runtime the prototype chain is
// set up correctly via __extends, so all instanceof checks pass.
//
declare var Commerce: any;

import * as Operations from "PosApi/Create/Operations";
import type { IMarginCalculationResult } from "../Messages/GetMarginCalculationResponse";

// Any-typed intermediates — bypass TypeScript private/CRTP generic constraints.
const _ReqBase: any = (Operations as any).ExtensionOperationRequestBase;
const _OpBase: any  = (Operations as any).ExtensionOperationRequestHandlerBase;

// ---------------------------------------------------------------------------
// Request class — extends ExtensionOperationRequestBase at runtime via __extends.
// Required so that the framework's instanceof check passes in Pos.Controls.js.
// ---------------------------------------------------------------------------
class MarginCalculationOperationRequest extends _ReqBase {
    constructor() {
        super(50001, "margin-calculation-request");
    }
}

// ---------------------------------------------------------------------------
// Operation handler — registered in manifest components.extend.operations[].
// Extends ExtensionOperationRequestHandlerBase at runtime via __extends.
// ---------------------------------------------------------------------------
export default class MarginCalculationOperation extends _OpBase {

    /** Return the request constructor — must satisfy instanceof ExtensionOperationRequestBase. */
    public supportedRequestType(): any {
        return MarginCalculationOperationRequest;
    }

    /**
     * Called by the POS framework when operation 50001 fires.
     * this.context is a protected property set by the base class before calling.
     */
    public executeAsync(request: any): Promise<any> {
        return new Promise<any>((resolve: any, reject: any): void => {
            try {
                // ---------------------------------------------------------------
                // Step 1 — Get cart.
                // ---------------------------------------------------------------
                const ctx: any = (this as any).context;
                let cart: any = null;

                if (ctx && ctx.cartAccessor && ctx.cartAccessor.cart) {
                    cart = ctx.cartAccessor.cart;
                } else if (typeof Commerce !== "undefined" && Commerce.Session && Commerce.Session.instance) {
                    cart = Commerce.Session.instance.cart;
                }

                if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                    alert("No sales line found. Please add a product to the transaction first.");
                    resolve({ canceled: false, data: {} });
                    return;
                }

                const selectedId: string = cart.SelectedCartLineId || "";
                const cartLine: any = cart.CartLines.filter(
                    (l: any): boolean => l.LineId === selectedId
                )[0] || cart.CartLines[0];

                const itemId: string    = cartLine.ItemId   || "";
                const quantity: number  = cartLine.Quantity || 0;
                const netAmount: number = cartLine.NetAmountWithAllInclusiveTax
                                       || cartLine.NetAmount || 0;

                // ---------------------------------------------------------------
                // Step 2 — Phase 1: purchasePrice = 0 (Phase 2: CRT call).
                // ---------------------------------------------------------------
                const purchasePrice: number    = 0;
                const totalCost: number        = purchasePrice * Math.abs(quantity);
                const marginAmount: number     = netAmount - totalCost;
                const marginPercentage: number = netAmount !== 0
                    ? (marginAmount / netAmount) * 100
                    : 0;

                const marginResult: IMarginCalculationResult = {
                    itemId, purchasePrice, quantity, netAmount,
                    totalCost, marginAmount, marginPercentage
                };

                // ---------------------------------------------------------------
                // Step 3 — Navigate to Margin Calculation view.
                // ---------------------------------------------------------------
                if (ctx && ctx.navigator && typeof ctx.navigator.navigate === "function") {
                    ctx.navigator.navigate("MarginCalculationView", marginResult);
                } else if (typeof Commerce !== "undefined" && Commerce.Host && Commerce.Host.instance) {
                    Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
                } else {
                    alert("Margin: " + marginPercentage.toFixed(2) + " %\nItem: " + itemId);
                }

                resolve({ canceled: false, data: {} });
            } catch (ex) {
                console.error("[MarginCalculationOperation] executeAsync error:", ex);
                reject(ex);
            }
        });
    }
}
