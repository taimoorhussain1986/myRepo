/**
 * GetMarginCalculationClientResponse.ts
 *
 * POS-side proxy response returned by the CRT handler.
 * Carries the purchase price retrieved from D365 F&O and the computed margin.
 */

import { Response } from "PosApi/Extend/RequestHandlers/CoreExtensionRequestHandlers";

/** Margin result payload. */
export interface IMarginResult {
    itemId: string;
    /** Purchase price from inventTableModule.Price in D365 F&O (cost). */
    purchasePrice: number;
    /** Net amount from the POS cart line (revenue). */
    netAmount: number;
    /**
     * Gross margin percentage:
     *   ((NetAmount - PurchasePrice) / NetAmount) * 100
     */
    marginPercentage: number;
    /** Absolute margin amount: NetAmount - PurchasePrice */
    marginAmount: number;
}

export class GetMarginCalculationClientResponse extends Response {
    public readonly marginResult: IMarginResult;

    constructor(marginResult: IMarginResult) {
        super();
        this.marginResult = marginResult;
    }
}
