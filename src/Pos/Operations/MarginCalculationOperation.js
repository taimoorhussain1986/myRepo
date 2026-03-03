// Pre-compiled AMD module - copy directly to Store Commerce Extensions.
// Source: src/Pos/Operations/MarginCalculationOperation.ts
//
// KEY FIX: supportedRequestType() MUST return the constructor of a request
// class that extends Operations.OperationRequest.
// Pos.Controls.js:18851 does: if (!handler.supportedRequestType()) { throw ... }
// Returning null → "operation is not supported". Returning the constructor → OK.
//
define(["require", "exports", "PosApi/Create/Operations"], function (require, exports, Operations) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            if (typeof b !== "function" && b !== null) {
                throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            }
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();

    // -------------------------------------------------------------------------
    // MarginCalculationOperationRequest — required generic type T for
    // ExtensionOperationRequestHandlerBase<T>. T must extend OperationRequest.
    // -------------------------------------------------------------------------
    var MarginCalculationOperationRequest = /** @class */ (function (_super) {
        __extends(MarginCalculationOperationRequest, _super);
        function MarginCalculationOperationRequest(correlationId) {
            return _super.call(this, correlationId) || this;
        }
        return MarginCalculationOperationRequest;
    }(Operations.OperationRequest));
    exports.MarginCalculationOperationRequest = MarginCalculationOperationRequest;

    // -------------------------------------------------------------------------
    // MarginCalculationOperation — registered in manifest operations[] for
    // operationId 50001.
    // -------------------------------------------------------------------------
    var MarginCalculationOperation = /** @class */ (function (_super) {
        __extends(MarginCalculationOperation, _super);
        function MarginCalculationOperation() {
            return _super !== null && _super.apply(this, arguments) || this;
        }

        /**
         * SDK REQUIREMENT: return the request constructor — NOT null.
         * Pos.Controls.js:18851 does: if (!handler.supportedRequestType()) throw.
         */
        MarginCalculationOperation.prototype.supportedRequestType = function () {
            return MarginCalculationOperationRequest;
        };

        /**
         * Called by the POS runtime when operation 50001 fires.
         * @param {any} context  Execution context — contains navigator, cartAccessor etc.
         * @param {any} request  The MarginCalculationOperationRequest instance.
         */
        MarginCalculationOperation.prototype.executeAsync = function (context, request) {
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
                    var nav = context && context.navigator;
                    if (nav && typeof nav.navigate === "function") {
                        nav.navigate("MarginCalculationView", marginResult);
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
