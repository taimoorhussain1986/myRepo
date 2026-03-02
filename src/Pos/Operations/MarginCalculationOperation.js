// Pre-compiled AMD module - copy directly to Store Commerce Extensions folder.
// Source: src/Pos/Operations/MarginCalculationOperation.ts
// Compiled for Store Commerce SDK 9.55 (no external AMD dependencies).
define([], function () {
    "use strict";
    // Commerce is injected as a global by the POS framework at runtime.
    var MarginCalculationOperation = /** @class */ (function () {
        function MarginCalculationOperation() {
        }
        /**
         * Called by the POS runtime when operation 50001 fires.
         */
        MarginCalculationOperation.prototype.executeAsync = function (options) {
            return new Promise(function (resolve, reject) {
                try {
                    // Step 1: Resolve active cart and selected cart line.
                    var session = Commerce.Session && Commerce.Session.instance;
                    var cart = session ? session.cart : null;

                    if (!cart || !cart.CartLines || cart.CartLines.length === 0) {
                        alert("No sales line found. Please select a product line first.");
                        resolve({ canceled: true });
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

                    // Step 2: Phase 1 - purchase price = 0 (CRT call wired in Phase 2).
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

                    // Step 3: Navigate to the custom view.
                    // Wrap in { state: ... } so ExtensionViewControllerBase exposes
                    // the data via context.state inside MarginCalculationView.
                    var host = Commerce.Host && Commerce.Host.instance;
                    if (host && typeof host.navigateToView === "function") {
                        host.navigateToView("MarginCalculationView", { state: marginResult });
                    } else {
                        // Fallback: show alert if navigation API unavailable.
                        alert("Margin: " + marginResult.marginPercentage.toFixed(2) + " %\n"
                            + "Item: " + itemId + "\n"
                            + "Net Amount: " + netAmount.toFixed(2) + "\n"
                            + "Purchase Price: " + purchasePrice.toFixed(2));
                    }

                    resolve({ canceled: false });
                } catch (ex) {
                    reject(ex);
                }
            });
        };
        return MarginCalculationOperation;
    }());
    return MarginCalculationOperation;
});
