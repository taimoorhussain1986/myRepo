// Pre-compiled AMD module - copy directly to Store Commerce Extensions.
// Source: src/Pos/Operations/MarginCalculationOperation.ts
//
// KEY: only ["require","exports"] as AMD deps — "PosApi/Create/Operations"
// is NOT resolvable at runtime in Store Commerce 9.55. Including it caused
// the define() callback to never fire, making the module invisible in F12.
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });

    // -----------------------------------------------------------------------
    // Request constructor — plain function, no SDK base class.
    // -----------------------------------------------------------------------
    function MarginCalculationOperationRequest(operationId, correlationId) {
        this.operationId   = operationId;
        this.correlationId = correlationId;
    }

    // -----------------------------------------------------------------------
    // Operation handler class — registered in manifest operations[].
    // -----------------------------------------------------------------------
    function MarginCalculationOperation() {}

    /** Return the request constructor — must be truthy. */
    MarginCalculationOperation.prototype.supportedRequestType = function () {
        return MarginCalculationOperationRequest;
    };

    /**
     * Called by POS framework when operation 50001 fires.
     * this.context is injected by the framework before calling executeAsync.
     */
    MarginCalculationOperation.prototype.executeAsync = function (request) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                // -------------------------------------------------------
                // Step 1 — Get cart (try context first, then global).
                // -------------------------------------------------------
                var cart = null;
                var ctx  = _this.context;

                if (ctx && ctx.cartAccessor && ctx.cartAccessor.cart) {
                    cart = ctx.cartAccessor.cart;
                } else if (typeof Commerce !== "undefined"
                        && Commerce.Session
                        && Commerce.Session.instance) {
                    cart = Commerce.Session.instance.cart;
                }

                if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                    alert("No sales line found. Please add a product to the transaction first.");
                    resolve({ canceled: false, data: {} });
                    return;
                }

                // Prefer highlighted line; fall back to first line.
                var selectedId = cart.SelectedCartLineId || "";
                var cartLine   = cart.CartLines.filter(function (l) {
                    return l.LineId === selectedId;
                })[0] || cart.CartLines[0];

                var itemId    = cartLine.ItemId   || "";
                var quantity  = cartLine.Quantity || 0;
                var netAmount = cartLine.NetAmountWithAllInclusiveTax
                              || cartLine.NetAmount
                              || 0;

                // -------------------------------------------------------
                // Step 2 — Phase 1: purchasePrice = 0.
                // -------------------------------------------------------
                var purchasePrice    = 0;
                var totalCost        = purchasePrice * Math.abs(quantity);
                var marginAmount     = netAmount - totalCost;
                var marginPercentage = netAmount !== 0
                    ? (marginAmount / netAmount) * 100
                    : 0;

                var marginResult = {
                    itemId:           itemId,
                    purchasePrice:    purchasePrice,
                    quantity:         quantity,
                    netAmount:        netAmount,
                    totalCost:        totalCost,
                    marginAmount:     marginAmount,
                    marginPercentage: marginPercentage
                };

                // -------------------------------------------------------
                // Step 3 — Navigate to Margin Calculation view.
                // -------------------------------------------------------
                if (ctx && ctx.navigator && typeof ctx.navigator.navigate === "function") {
                    ctx.navigator.navigate("MarginCalculationView", marginResult);
                } else if (typeof Commerce !== "undefined"
                        && Commerce.Host
                        && Commerce.Host.instance) {
                    Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
                } else {
                    alert("Margin: " + marginPercentage.toFixed(2) + " %\n"
                        + "Item: "  + itemId + "\n"
                        + "Net: "   + netAmount.toFixed(2));
                }

                resolve({ canceled: false, data: {} });
            } catch (ex) {
                console.error("[MarginCalculationOperation] executeAsync error:", ex);
                reject(ex);
            }
        });
    };

    exports["default"] = MarginCalculationOperation;
    return MarginCalculationOperation;
});
