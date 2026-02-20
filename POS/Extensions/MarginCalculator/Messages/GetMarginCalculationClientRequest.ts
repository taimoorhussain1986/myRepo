/**
 * GetMarginCalculationClientRequest.ts
 *
 * POS-side proxy request that is serialised and sent to the CRT
 * GetMarginCalculationRequestHandler.  The CRT handler calls the D365 F&O
 * Real-Time Service to retrieve the purchase price and returns the margin.
 */

import { ExtensionRequestBase } from "PosApi/Extend/RequestHandlers/CoreExtensionRequestHandlers";
import { GetMarginCalculationClientResponse } from "./GetMarginCalculationClientResponse";

/**
 * Client request for retrieving margin data for a specific item and net amount.
 */
export class GetMarginCalculationClientRequest extends ExtensionRequestBase<GetMarginCalculationClientResponse> {
    /** The item number whose purchase price will be fetched from F&O. */
    public readonly itemId: string;

    /** Net revenue amount from the selected cart line. */
    public readonly netAmount: number;

    constructor(correlationId: string, itemId: string, netAmount: number) {
        super(correlationId);
        this.itemId = itemId;
        this.netAmount = netAmount;
    }
}
