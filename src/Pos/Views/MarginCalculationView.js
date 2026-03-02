// Pre-compiled AMD module - copy directly to Store Commerce Extensions folder.
// Source: src/Pos/Views/MarginCalculationView.ts
// Compiled for Store Commerce SDK 9.55 (no external AMD dependencies).
define([], function () {
    "use strict";
    // Commerce and ko are injected as globals by the POS framework at runtime.
    var MarginCalculationView = /** @class */ (function () {
        /**
         * @param data  Navigation data passed from MarginCalculationOperation via
         *              Commerce.Host.instance.navigateToView("MarginCalculationView", data)
         */
        function MarginCalculationView(data) {
            var result;
            if (data && typeof data === "object" && typeof data.itemId !== "undefined") {
                result = data;
            } else {
                result = {
                    itemId: "",
                    purchasePrice: 0,
                    quantity: 0,
                    netAmount: 0,
                    totalCost: 0,
                    marginAmount: 0,
                    marginPercentage: 0
                };
            }

            var fmt = function (n) {
                return n.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            };

            this.itemId                  = ko.observable(result.itemId);
            this.purchasePriceDisplay    = ko.observable(fmt(result.purchasePrice));
            this.netAmountDisplay        = ko.observable(fmt(result.netAmount));
            this.totalCostDisplay        = ko.observable(fmt(result.totalCost));
            this.marginAmountDisplay     = ko.observable(fmt(result.marginAmount));
            this.marginPercentageDisplay = ko.observable(result.marginPercentage.toFixed(2) + " %");
            this.marginCssClass          = ko.observable(
                result.marginPercentage >= 0 ? "margin-positive" : "margin-negative"
            );
        }

        MarginCalculationView.prototype.onClose = function () {
            Commerce.Host.instance.navigateBack();
        };

        return MarginCalculationView;
    }());
    return MarginCalculationView;
});
