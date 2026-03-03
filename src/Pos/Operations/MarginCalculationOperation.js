// Pre-compiled AMD module - copy directly to Store Commerce Extensions.
// Source: src/Pos/Operations/MarginCalculationOperation.ts
define(["require", "exports", "PosApi/Create/Operations"], function (require, exports, Create_Operations_1) {
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

    // Intermediate variable so TypeScript (and the runtime) can extend without
    // triggering generic type constraints on ExtensionOperationRequestHandlerBase.
    var _OpBase = Create_Operations_1.ExtensionOperationRequestHandlerBase;

    // -------------------------------------------------------------------------
    // Handler class — registered in manifest operations[] for operationId 50001.
    // -------------------------------------------------------------------------
    var MarginCalculationOperation = /** @class */ (function (_super) {
        __extends(MarginCalculationOperation, _super);
        function MarginCalculationOperation() {
            return _super !== null && _super.apply(this, arguments) || this;
        }

        /**
         * Return a truthy value.
         * Pos.Controls.js checks: if (!handler.supportedRequestType()) throw.
         */
        MarginCalculationOperation.prototype.supportedRequestType = function () {
            return function MarginCalculationOperationRequest() { return {}; };
        };

        /**
         * Single-parameter executeAsync — called by POS framework.
         * Context is injected via this.context by the base class.
         */
        MarginCalculationOperation.prototype.executeAsync = function (request) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                try {
                    var context = _this.context;

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
    }(_OpBase));

    exports["default"] = MarginCalculationOperation;
    return MarginCalculationOperation;
});
