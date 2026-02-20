/**
 * MarginCalculationOperation.ts
 *
 * Defines the custom POS operation request and response types for Margin Calculation.
 * Operation ID 5001 maps to the "MarginCalculation" button in the POS button grid.
 */

import { ExtensionOperationRequestBase } from "PosApi/Create/Operations";

/**
 * The request payload sent by the button click handler.
 * Contains the selected cart line's item ID and net amount.
 */
export interface IMarginCalculationOperationRequest {
    itemId: string;
    netAmount: number;
    lineDescription: string;
}

/**
 * Custom POS operation request for Margin Calculation (Operation ID 5001).
 */
export class MarginCalculationOperationRequest
    extends ExtensionOperationRequestBase<MarginCalculationOperationResponse>
{
    public readonly itemId: string;
    public readonly netAmount: number;
    public readonly lineDescription: string;

    constructor(
        correlationId: string,
        itemId: string,
        netAmount: number,
        lineDescription: string
    ) {
        super(5001, correlationId);
        this.itemId = itemId;
        this.netAmount = netAmount;
        this.lineDescription = lineDescription;
    }
}

/**
 * Response returned after the operation completes.
 */
export class MarginCalculationOperationResponse {
    public readonly success: boolean;
    constructor(success: boolean) {
        this.success = success;
    }
}
