// Pre-compiled AMD module for direct deployment to Store Commerce Extensions.
// Source: src/Pos/Operations/MarginCalculationOperation.ts
//
// DIAGNOSTIC VERSION:
//   - Logs all available exports from PosApi/Create/Operations to console
//   - Guards every __extends call so undefined base class never crashes module
//   - Module ALWAYS registers exports["default"] even if SDK base is unavailable
//
// Open F12 DevTools → Console tab while Store Commerce is running.
// After clicking Margin button, look for "[MarginCalc]" entries to see what
// Operations exports at runtime.
//
// Deploy to: ...\Store Commerce\Extensions\Beaumont.Commerce\BT.POS\Operations\MarginCalculationOperation.js
define(["require", "exports", "PosApi/Create/Operations"], function (require, exports, Operations) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });

    // -----------------------------------------------------------------------
    // DIAGNOSTIC: log what PosApi/Create/Operations actually exports at runtime.
    // Check F12 → Console for "[MarginCalc]" entries.
    // -----------------------------------------------------------------------
    try {
        console.log("[MarginCalc] PosApi/Create/Operations exports:", Object.keys(Operations || {}));
        console.log("[MarginCalc] ExtensionOperationRequestHandlerBase:", typeof Operations.ExtensionOperationRequestHandlerBase);
        console.log("[MarginCalc] ExtensionOperationRequestBase:", typeof Operations.ExtensionOperationRequestBase);
    } catch (e) { /* ignore */ }

    // TypeScript __extends helper (inlined — no tslib dependency).
    var __extends = (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            if (typeof b !== "function" && b !== null)
                throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();

    // -----------------------------------------------------------------------
    // Request token — plain constructor (no SDK extends).
    // supportedRequestType() returns this constructor.
    // The framework checks: typeof handler.supportedRequestType() === "function"
    // -----------------------------------------------------------------------
    function MarginCalculationOperationRequest() {}
    MarginCalculationOperationRequest.prototype.operationId = 50001;

    // -----------------------------------------------------------------------
    // Handler class.
    // We try to extend ExtensionOperationRequestHandlerBase for the instanceof
    // check at Pos.Controls.js:18851. If it's undefined (abstract/compiled-away),
    // we use a plain class and log the fallback so you can see it in F12.
    // -----------------------------------------------------------------------
    var _OpBase = Operations && Operations.ExtensionOperationRequestHandlerBase;

    function buildHandler(_super) {
        if (typeof _super === "function") {
            try { __extends(MarginCalculationOperation, _super); }
            catch (e) { console.error("[MarginCalc] __extends failed:", e); }
        } else {
            console.warn("[MarginCalc] ExtensionOperationRequestHandlerBase not a function at runtime:", _super,
                ". Using plain class — 'operation not supported' may still occur if framework requires instanceof.");
        }

        function MarginCalculationOperation() {
            if (_super && typeof _super === "function") {
                return _super.apply(this, arguments) || this;
            }
        }

        /** Returns the request constructor. */
        MarginCalculationOperation.prototype.supportedRequestType = function () {
            return MarginCalculationOperationRequest;
        };

        /**
         * Called by the POS framework when operation 50001 fires.
         * this.context is set by the base class before calling executeAsync.
         */
        MarginCalculationOperation.prototype.executeAsync = function (request) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                try {
                    console.log("[MarginCalc] executeAsync called. this.context:", _this.context);

                    // -----------------------------------------------------------
                    // Step 1 — Get cart.
                    // -----------------------------------------------------------
                    var ctx  = _this.context;
                    var cart = null;

                    if (ctx && ctx.cartAccessor && ctx.cartAccessor.cart) {
                        cart = ctx.cartAccessor.cart;
                    } else if (typeof Commerce !== "undefined"
                            && Commerce.Session && Commerce.Session.instance) {
                        cart = Commerce.Session.instance.cart;
                    }

                    if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                        alert("No sales line found. Please add a product to the transaction first.");
                        resolve({ canceled: false, data: {} });
                        return;
                    }

                    var selectedId = cart.SelectedCartLineId || "";
                    var cartLine   = cart.CartLines.filter(function (l) {
                        return l.LineId === selectedId;
                    })[0] || cart.CartLines[0];

                    var itemId    = cartLine.ItemId   || "";
                    var quantity  = cartLine.Quantity || 0;
                    var netAmount = cartLine.NetAmountWithAllInclusiveTax
                                 || cartLine.NetAmount || 0;

                    // -----------------------------------------------------------
                    // Step 2 — Phase 1: purchasePrice = 0.
                    // -----------------------------------------------------------
                    var purchasePrice    = 0;
                    var totalCost        = purchasePrice * Math.abs(quantity);
                    var marginAmount     = netAmount - totalCost;
                    var marginPercentage = netAmount !== 0
                        ? (marginAmount / netAmount) * 100
                        : 0;

                    var marginResult = {
                        itemId: itemId, purchasePrice: purchasePrice,
                        quantity: quantity, netAmount: netAmount,
                        totalCost: totalCost, marginAmount: marginAmount,
                        marginPercentage: marginPercentage
                    };

                    // -----------------------------------------------------------
                    // Step 3 — Navigate to Margin Calculation view.
                    // -----------------------------------------------------------
                    if (ctx && ctx.navigator && typeof ctx.navigator.navigate === "function") {
                        ctx.navigator.navigate("MarginCalculationView", marginResult);
                    } else if (typeof Commerce !== "undefined"
                            && Commerce.Host && Commerce.Host.instance) {
                        Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
                    } else {
                        alert("Margin: " + marginPercentage.toFixed(2) + " %\nItem: " + itemId
                            + "\nNet: " + netAmount.toFixed(2));
                    }

                    resolve({ canceled: false, data: {} });
                } catch (ex) {
                    console.error("[MarginCalc] executeAsync error:", ex);
                    reject(ex);
                }
            });
        };

        return MarginCalculationOperation;
    }

    var MarginCalculationOperation = buildHandler(_OpBase);

    exports["default"] = MarginCalculationOperation;
});
