// Pre-compiled AMD module - copy directly to Store Commerce Extensions folder.
// Source: src/Pos/Operations/MarginCalculationOperation.ts
// SDK 9.55: extends Operations.ExtensionOperationRequestHandlerBase — the runtime
// Pos.Controls.js instanceof check requires this prototype chain (same as views
// needing CustomViewControllerBase). Plain class → "operation not supported".
define(["require", "exports", "PosApi/Create/Operations"], function (require, exports, Operations) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var MarginCalculationOperation = /** @class */ (function (_super) {
        __extends(MarginCalculationOperation, _super);
        function MarginCalculationOperation() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MarginCalculationOperation.prototype.supportedRequestType = function () {
            return null;
        };
        /**
         * Called by the POS runtime when operation 50001 fires.
         * SDK 9.55: context.cartAccessor.cart — current transaction.
         *           context.navigator.navigate(pageName, state) — navigate to view.
         */
        MarginCalculationOperation.prototype.executeAsync = function (context) {
            return new Promise(function (resolve, reject) {
                try {
                    // Step 1: Get current cart from context.cartAccessor.cart
                    var cart = context && context.cartAccessor
                        ? context.cartAccessor.cart
                        : null;

                    if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                        alert("No sales line found. Please select a product line first.");
                        resolve({ canceled: true, data: void 0 });
                        return;
                    }

                    // Prefer selected line; fall back to first line.
                    var selectedId = cart.SelectedCartLineId || "";
                    var cartLine = cart.CartLines.filter(function (l) {
                        return l.LineId === selectedId;
                    })[0] || cart.CartLines[0];

                    var itemId = cartLine.ItemId || "";
                    var quantity = cartLine.Quantity || 0;
                    var netAmount = cartLine.NetAmountWithAllInclusiveTax
                        || cartLine.NetAmount
                        || 0;

                    // Step 2: Phase 1 — purchasePrice = 0.
                    // Phase 2: replace with CRT real-time service proxy call.
                    var purchasePrice = 0;
                    var totalCost = purchasePrice * Math.abs(quantity);
                    var marginAmount = netAmount - totalCost;
                    var marginPercentage = netAmount !== 0
                        ? (marginAmount / netAmount) * 100
                        : 0;

                    var marginResult = {
                        itemId: itemId,
                        purchasePrice: purchasePrice,
                        quantity: quantity,
                        netAmount: netAmount,
                        totalCost: totalCost,
                        marginAmount: marginAmount,
                        marginPercentage: marginPercentage
                    };

                    // Step 3: Navigate to Margin Calculation view.
                    if (context && context.navigator
                            && typeof context.navigator.navigate === "function") {
                        context.navigator.navigate("MarginCalculationView", marginResult);
                    } else {
                        alert("Margin: " + marginResult.marginPercentage.toFixed(2) + " %");
                    }

                    resolve({ canceled: false, data: void 0 });
                } catch (ex) {
                    reject(ex);
                }
            });
        };
        return MarginCalculationOperation;
    }(Operations.ExtensionOperationRequestHandlerBase));
    exports["default"] = MarginCalculationOperation;
    return MarginCalculationOperation;
});
