// Pre-compiled AMD module — deploy directly to Store Commerce Extensions.
// Source: src/Pos/Operations/MarginCalculationOperationRequestFactory.ts
//
// PURPOSE:
//   In Store Commerce 9.55, the runtime validates that a request factory
//   exists for custom operation IDs BEFORE calling PreOperation triggers.
//   Without this factory, the framework throws "operation not supported"
//   before the trigger can cancel the operation.
//
//   This factory creates a minimal request object for op 50001.
//   The actual logic is in MarginCalculationPreOperationTrigger.
//
// Deploy to:
//   ...\Store Commerce\Extensions\Beaumont.Commerce\BT.POS\Operations\
//       MarginCalculationOperationRequestFactory.js
//
// Manifest registration:
//   "create": {
//     "operationRequestFactories": [
//       { "operationId": 50001,
//         "requestFactoryPath": "Operations/MarginCalculationOperationRequestFactory" }
//     ]
//   }
//
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });

    console.log("[MarginCalcFactory] module loaded");

    /** Minimal operation request for op 50001. */
    function MarginCalculationOperationRequest() {
        this.operationId   = 50001;
        this.correlationId = "margin-calculation-" + Date.now();
    }

    /**
     * Factory class for Margin Calculation (op 50001).
     *
     * Returns a minimal request object so the framework doesn't throw
     * "operation not supported" before the PreOperationTrigger runs.
     */
    function MarginCalculationOperationRequestFactory() {}

    MarginCalculationOperationRequestFactory.prototype.create = function (operationId, options) {
        console.log("[MarginCalcFactory] create called for operationId =", operationId);
        return new MarginCalculationOperationRequest();
    };

    exports["default"] = MarginCalculationOperationRequestFactory;
});
