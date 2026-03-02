// Pre-compiled AMD module for direct deployment to Store Commerce Extensions.
// Source: src/Pos/Views/MarginCalculationView.ts
//
// KEY FIX: "New view module does not inherit from ExtensionViewControllerBase."
//   Store Commerce 9.55 checks the prototype chain at load time.
//   This module requires "PosApi/Create/Views" and extends
//   Views.ExtensionViewControllerBase so the instanceof check passes.
//
// Deploy to: ...\Store Commerce\Extensions\Beaumont.Commerce\Views\MarginCalculationView.js
define(["require", "exports", "PosApi/Create/Views", "knockout"], function (require, exports, Views, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });

    // TypeScript __extends helper (inlined so no tslib dependency is needed).
    var __extends = (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) { if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; } };
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

    var MarginCalculationView = /** @class */ (function (_super) {
        __extends(MarginCalculationView, _super);

        /**
         * @param context  IExtensionViewControllerContext supplied by the framework.
         *                 context.state carries the IMarginCalculationResult data
         *                 that was passed when the operation called navigator.navigate().
         */
        function MarginCalculationView(context, state) {
            var _this = _super.call(this, context, state) || this;

            // Navigation data is passed directly as `state` (second constructor arg).
            // The operation calls navigate("MarginCalculationView", marginResult) so
            // state IS the IMarginCalculationResult — no { state: ... } wrapper.
            // After super(), _this.state also holds the same value.
            var data = state || (_this && _this.state) || (context && context.state) || null;
            var result;
            if (data && typeof data === "object" && typeof data.itemId !== "undefined") {
                result = data;
            } else {
                result = { itemId: "", purchasePrice: 0, quantity: 0, netAmount: 0, totalCost: 0, marginAmount: 0, marginPercentage: 0 };
            }

            var fmt = function (n) {
                return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            _this.itemId                  = ko.observable(result.itemId);
            _this.purchasePriceDisplay    = ko.observable(fmt(result.purchasePrice));
            _this.netAmountDisplay        = ko.observable(fmt(result.netAmount));
            _this.totalCostDisplay        = ko.observable(fmt(result.totalCost));
            _this.marginAmountDisplay     = ko.observable(fmt(result.marginAmount));
            _this.marginPercentageDisplay = ko.observable(result.marginPercentage.toFixed(2) + " %");
            _this.marginCssClass          = ko.observable(result.marginPercentage >= 0 ? "margin-positive" : "margin-negative");

            return _this;
        }

        // Called by the framework after the HTML template is in the DOM.
        // ko.applyBindings activates all data-bind attributes in MarginCalculationView.html.
        MarginCalculationView.prototype.onReady = function (element) {
            ko.applyBindings(this, element);
        };

        // Close button handler.
        MarginCalculationView.prototype.onClose = function () {
            if (this.context && this.context.navigator) {
                this.context.navigator.navigateBack();
            }
        };

        MarginCalculationView.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
        };

        return MarginCalculationView;
    }(Views.ExtensionViewControllerBase));

    exports["default"] = MarginCalculationView;
});
