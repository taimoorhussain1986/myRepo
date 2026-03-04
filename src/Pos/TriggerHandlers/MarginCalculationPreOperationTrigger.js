// Pre-compiled AMD module for direct deployment to Store Commerce Extensions.
// Source: src/Pos/TriggerHandlers/MarginCalculationPreOperationTrigger.ts
//
// CRITICAL: Must extend PreOperationTrigger from "PosApi/Extend/Triggers/OperationTriggers".
// Store Commerce 9.55 validates the prototype chain and rejects triggers that
// do not inherit from the correct base class.
//
// Deploy to:
//   ...\Store Commerce\Extensions\Beaumont.Commerce\BT.POS\TriggerHandlers\
//       MarginCalculationPreOperationTrigger.js
//
define(["require", "exports", "PosApi/Extend/Triggers/OperationTriggers"], function (require, exports, Triggers) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });

    // TypeScript __extends helper — sets up the prototype chain.
    var __extends = (this && this.__extends) || (function () {
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

    var MARGIN_OPERATION_ID = 50001;

    /**
     * PreOperation trigger for Margin Calculation (op 50001).
     * Extends Triggers.PreOperationTrigger so the framework's instanceof check passes.
     */
    var MarginCalculationPreOperationTrigger = /** @class */ (function (_super) {
        __extends(MarginCalculationPreOperationTrigger, _super);

        function MarginCalculationPreOperationTrigger() {
            return _super.call(this) || this;
        }

        MarginCalculationPreOperationTrigger.prototype.execute = function (options) {
            // SDK 9.55: operation ID is at options.request.operationId
            var opId = (options && options.request && options.request.operationId) || 0;

            console.log("[MarginCalcTrigger] execute called, opId =", opId);

            if (opId !== MARGIN_OPERATION_ID) {
                return Promise.resolve({ halt: false });
            }

            var _this = this;

            return new Promise(function (resolve) {
                try {
                    console.log("[MarginCalcTrigger] handling op 50001");

                    // -----------------------------------------------------------
                    // Step 1 — Get current cart.
                    // -----------------------------------------------------------
                    var cart = null;
                    var ctx = _this.context;

                    if (ctx && ctx.cartAccessor && ctx.cartAccessor.cart) {
                        cart = ctx.cartAccessor.cart;
                    }
                    if (!cart && typeof Commerce !== "undefined"
                            && Commerce.Session && Commerce.Session.instance) {
                        cart = Commerce.Session.instance.cart;
                    }

                    if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                        alert("Margin Calculation: Please add a product to the transaction first.");
                        resolve({ halt: true });
                        return;
                    }

                    // -----------------------------------------------------------
                    // Step 2 — Find the active cart line.
                    // -----------------------------------------------------------
                    var selectedId = cart.SelectedCartLineId || "";
                    var cartLine = null;
                    if (selectedId) {
                        var matches = cart.CartLines.filter(function (l) {
                            return l.LineId === selectedId;
                        });
                        cartLine = matches.length > 0 ? matches[0] : null;
                    }
                    cartLine = cartLine || cart.CartLines[0];

                    var itemId    = cartLine.ItemId   || "";
                    var quantity  = cartLine.Quantity || 0;
                    var netAmount = cartLine.NetAmountWithAllInclusiveTax
                                 || cartLine.NetAmount || 0;

                    // -----------------------------------------------------------
                    // Step 3 — Compute margin (Phase 1: purchasePrice = 0).
                    // -----------------------------------------------------------
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

                    console.log("[MarginCalcTrigger] marginResult:", marginResult);

                    // -----------------------------------------------------------
                    // Step 4 — Navigate to MarginCalculationView.
                    // -----------------------------------------------------------
                    var navigated = false;

                    if (ctx && ctx.navigator && typeof ctx.navigator.navigate === "function") {
                        ctx.navigator.navigate("MarginCalculationView", marginResult);
                        navigated = true;
                    }

                    if (!navigated
                            && typeof Commerce !== "undefined"
                            && Commerce.Host && Commerce.Host.instance
                            && typeof Commerce.Host.instance.navigateToView === "function") {
                        Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
                        navigated = true;
                    }

                    if (!navigated) {
                        alert("Margin Calculation\n"
                            + "Item:   " + itemId + "\n"
                            + "Net:    " + netAmount.toFixed(2) + "\n"
                            + "Margin: " + marginPercentage.toFixed(2) + " %");
                    }

                    // Halt = true: prevents framework from trying to execute a
                    // (non-existent) operation handler for op 50001.
                    resolve({ halt: true });

                } catch (ex) {
                    console.error("[MarginCalcTrigger] execute error:", ex);
                    resolve({ halt: true });
                }
            });
        };

        return MarginCalculationPreOperationTrigger;
    }(Triggers.PreOperationTrigger));

    exports["default"] = MarginCalculationPreOperationTrigger;
});

