// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------
//
// Operation Request Factory for Margin Calculation (operation ID 50001).
//
// PURPOSE:
//   In Store Commerce 9.55 the runtime validates that a request factory exists
//   for a custom operation ID before it calls any PreOperation triggers.
//   Without a factory, the framework throws "operation not supported" BEFORE
//   the trigger has a chance to cancel the operation.
//
//   This factory creates a minimal request object for op 50001. The actual
//   work is done by MarginCalculationPreOperationTrigger which intercepts the
//   operation and returns { canceled: true }.
//
// REGISTRATION (manifest.json):
//   Add to components.create.operationRequestFactories:
//   {
//     "operationId": 50001,
//     "requestFactoryPath": "Operations/MarginCalculationOperationRequestFactory"
//   }
//
declare var Commerce: any;

/** Minimal operation request for op 50001. */
class MarginCalculationOperationRequest {
    public operationId: number;
    public correlationId: string;
    constructor() {
        this.operationId = 50001;
        this.correlationId = "margin-calculation-" + Date.now();
    }
}

/**
 * Factory class for Margin Calculation operation requests.
 * Returns a minimal request object — the PreOperationTrigger does the real work.
 */
export default class MarginCalculationOperationRequestFactory {

    /** Called by the POS framework to create an operation request for op 50001. */
    public create(operationId: number, options: string): any {
        return new MarginCalculationOperationRequest();
    }
}
