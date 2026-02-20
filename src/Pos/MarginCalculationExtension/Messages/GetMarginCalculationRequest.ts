// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * CRT proxy request: sent from POS to the Commerce Runtime
 * GetMarginCalculationRequest handler.
 *
 * Maps 1-to-1 to the C# GetMarginCalculationRequest class.
 */
export class GetMarginCalculationRequest implements Commerce.Proxy.Common.IDataServiceRequest {
    /** @inheritdoc */
    public readonly serverRequestType = "GetMarginCalculationRequest";
    /** @inheritdoc */
    public readonly namespace = "Contoso.Commerce.Runtime.MarginCalculation";

    /** Item identifier selected on the sales line. */
    public itemId: string;

    /** Quantity on the selected sales line. */
    public quantity: number;

    /**
     * Net amount of the selected sales line.
     * Used as the **revenue** figure in the margin formula.
     */
    public netAmount: number;

    /**
     * Legal entity / company identifier (e.g. "USMF").
     * Passed to the D365 F&O real-time service to scope the purchase-price lookup.
     */
    public dataAreaId: string;

    constructor(itemId: string, quantity: number, netAmount: number, dataAreaId: string) {
        this.itemId = itemId;
        this.quantity = quantity;
        this.netAmount = netAmount;
        this.dataAreaId = dataAreaId;
    }
}
