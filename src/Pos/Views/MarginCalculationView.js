// Pre-compiled AMD module for direct deployment to Store Commerce Extensions.
// Source: src/Pos/Views/MarginCalculationView.ts
//
// Mirrors EXACT pattern of StoreHoursView / BatchView:
//   - "PosApi/Create/Views" AMD dependency
//   - import ko from "knockout" (default import)
//   - extends Views.CustomViewControllerBase (NOT deprecated ExtensionViewControllerBase)
//   - super(context) single arg
//   - onReady(element) + ko.applyBindings
//
// Deploy to: ...\Store Commerce\Extensions\Beaumont.Commerce\BT.POS\Views\MarginCalculationView.js
define(["require", "exports", "PosApi/Create/Views", "knockout"], function (require, exports, Views, knockout_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });

    // Handle both ES module default export and CommonJS export of knockout.
    var ko = (knockout_1 && knockout_1["default"]) ? knockout_1["default"] : knockout_1;

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

    var MarginCalculationView = /** @class */ (function (_super) {
        __extends(MarginCalculationView, _super);

        // constructor(context: ICustomViewControllerContext, state?: ICustomViewControllerBaseState)
        function MarginCalculationView(context, state) {
            // super(context) — single arg, same as StoreHoursView / BatchView
            var _this = _super.call(this, context) || this;

            // Navigation data is the state parameter passed by the operation.
            var data = state || null;
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

        // Called by the framework after the HTML template is rendered into the DOM.
        // Same pattern as StoreHoursView / BatchView.
        MarginCalculationView.prototype.onReady = function (element) {
            ko.applyBindings(this, element);
        };

        // Close button handler.
        MarginCalculationView.prototype.onClose = function () {
            this.context.navigator.navigateBack();
        };

        return MarginCalculationView;
    }(Views.CustomViewControllerBase));

    exports["default"] = MarginCalculationView;
});
