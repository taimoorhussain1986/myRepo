// Pre-compiled AMD module for direct deployment to Store Commerce Extensions.
// Source: src/Pos/TriggerHandlers/MarginCalculationPreOperationTrigger.ts
//
// KEY FACTS:
//   - ZERO external AMD dependencies  → guaranteed to load at startup
//   - Pre-loaded at manifest processing time (same as all other triggers)
//   - Will appear in F12 debugger under TriggerHandlers/
//   - Intercepts op 50001, computes margin, navigates to view, cancels op
//
// Deploy to:
//   ...\Store Commerce\Extensions\Beaumont.Commerce\BT.POS\TriggerHandlers\
//       MarginCalculationPreOperationTrigger.js
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });

    var MARGIN_OPERATION_ID = 50001;

    /**
     * PreOperation trigger — handles Margin Calculation (op 50001).
     *
     * The framework calls execute() before every operation.
     * For op 50001 we compute margin, navigate to MarginCalculationView and
     * return { canceled: true } so no operation handler is needed.
     */
    function MarginCalculationPreOperationTrigger() {}

    MarginCalculationPreOperationTrigger.prototype.execute = function (options) {
        // Only intercept op 50001.
        if (!options || options.operationId !== MARGIN_OPERATION_ID) {
            return Promise.resolve({ canceled: false, data: undefined });
        }

        var _this = this;

        return new Promise(function (resolve) {
            try {
                console.log("[MarginCalcTrigger] execute called for op 50001");

                // ---------------------------------------------------------------
                // Step 1 — Get current cart.
                // ---------------------------------------------------------------
                var cart = null;

                // Try SDK 9.55 context accessor.
                var ctx = _this.context;
                if (ctx && ctx.cartAccessor && ctx.cartAccessor.cart) {
                    cart = ctx.cartAccessor.cart;
                }

                // Fall back to global Commerce namespace.
                if (!cart && typeof Commerce !== "undefined"
                        && Commerce.Session && Commerce.Session.instance) {
                    cart = Commerce.Session.instance.cart;
                }

                if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                    alert("Margin Calculation: Please add a product to the transaction first.");
                    resolve({ canceled: true, data: undefined });
                    return;
                }

                // ---------------------------------------------------------------
                // Step 2 — Find the active cart line.
                // ---------------------------------------------------------------
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

                // ---------------------------------------------------------------
                // Step 3 — Compute margin.
                // Phase 1: purchasePrice = 0.
                // Phase 2: replace with CRT proxy call.
                // ---------------------------------------------------------------
                var purchasePrice    = 0;
                var totalCost        = purchasePrice * Math.abs(quantity);
                var marginAmount     = netAmount - totalCost;
                var marginPercentage = netAmount !== 0
                    ? (marginAmount / netAmount) * 100
                    : 0;

                var marginResult = {
                    itemId:            itemId,
                    purchasePrice:     purchasePrice,
                    quantity:          quantity,
                    netAmount:         netAmount,
                    totalCost:         totalCost,
                    marginAmount:      marginAmount,
                    marginPercentage:  marginPercentage
                };

                console.log("[MarginCalcTrigger] marginResult:", marginResult);

                // ---------------------------------------------------------------
                // Step 4 — Navigate to MarginCalculationView.
                // ---------------------------------------------------------------
                var navigated = false;

                // Primary: SDK context navigator.
                if (ctx && ctx.navigator && typeof ctx.navigator.navigate === "function") {
                    ctx.navigator.navigate("MarginCalculationView", marginResult);
                    navigated = true;
                }

                // Fallback: Commerce.Host global.
                if (!navigated
                        && typeof Commerce !== "undefined"
                        && Commerce.Host && Commerce.Host.instance
                        && typeof Commerce.Host.instance.navigateToView === "function") {
                    Commerce.Host.instance.navigateToView("MarginCalculationView", marginResult);
                    navigated = true;
                }

                // Last resort: alert.
                if (!navigated) {
                    alert("Margin Calculation\n"
                        + "Item:   " + itemId + "\n"
                        + "Net:    " + netAmount.toFixed(2) + "\n"
                        + "Margin: " + marginPercentage.toFixed(2) + " %");
                }

                // Cancel the original operation — prevents "operation not supported".
                resolve({ canceled: true, data: undefined });

            } catch (ex) {
                console.error("[MarginCalcTrigger] execute error:", ex);
                resolve({ canceled: true, data: undefined });
            }
        });
    };

    exports["default"] = MarginCalculationPreOperationTrigger;
});
