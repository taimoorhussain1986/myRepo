// Pre-compiled AMD module for direct deployment to Store Commerce Extensions.
// Source: src/Pos/Operations/MarginCalculationOperation.ts
//
// KEY FACTS:
//   1. "PosApi/Create/Operations" IS resolvable at runtime (same AMD bundle
//      system as "PosApi/Create/Views" which loads correctly for the view).
//   2. MarginCalculationOperationRequest MUST extend ExtensionOperationRequestBase
//      via __extends so that the framework's instanceof check in Pos.Controls.js
//      passes.
//   3. MarginCalculationOperation MUST extend ExtensionOperationRequestHandlerBase
//      so that the handler's prototype chain is correct.
//   4. The define() factory must NOT return a value — only write to exports.
//
// Deploy to: ...\Store Commerce\Extensions\Beaumont.Commerce\BT.POS\Operations\MarginCalculationOperation.js
define(["require", "exports", "PosApi/Create/Operations"], function (require, exports, Operations) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });

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
    // Request class — extends SDK ExtensionOperationRequestBase.
    // The framework checks instanceof ExtensionOperationRequestBase, so this
    // prototype chain is required.
    // -----------------------------------------------------------------------
    var _ReqBase = Operations.ExtensionOperationRequestBase;
    var MarginCalculationOperationRequest = /** @class */ (function (_super) {
        __extends(MarginCalculationOperationRequest, _super);
        function MarginCalculationOperationRequest() {
            return _super.call(this, 50001, "margin-calculation-request") || this;
        }
        return MarginCalculationOperationRequest;
    }(_ReqBase));

    // -----------------------------------------------------------------------
    // Handler class — extends SDK ExtensionOperationRequestHandlerBase.
    // Registered in manifest components.extend.operations[].
    // -----------------------------------------------------------------------
    var _OpBase = Operations.ExtensionOperationRequestHandlerBase;
    var MarginCalculationOperation = /** @class */ (function (_super) {
        __extends(MarginCalculationOperation, _super);
        function MarginCalculationOperation() {
            return _super !== null && _super.apply(this, arguments) || this;
        }

        /** Returns the request constructor (must be instanceof-correct). */
        MarginCalculationOperation.prototype.supportedRequestType = function () {
            return MarginCalculationOperationRequest;
        };

        /**
         * Called by the POS framework when operation 50001 fires.
         * this.context is set by ExtensionOperationRequestHandlerBase before calling.
         */
        MarginCalculationOperation.prototype.executeAsync = function (request) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                try {
                    // -------------------------------------------------------
                    // Step 1 — Get cart.
                    // -------------------------------------------------------
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
                            && Commerce.Host && Commerce.Host.instance) {
                        Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
                    } else {
                        alert("Margin: " + marginPercentage.toFixed(2) + " %\nItem: " + itemId
                            + "\nNet: " + netAmount.toFixed(2));
                    }

                    resolve({ canceled: false, data: {} });
                } catch (ex) {
                    console.error("[MarginCalculationOperation] executeAsync error:", ex);
                    reject(ex);
                }
            });
        };

        return MarginCalculationOperation;
    }(_OpBase));

    // No return statement — AMD factory must only write to exports.
    exports["default"] = MarginCalculationOperation;
});
