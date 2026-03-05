// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * Data class for passing margin calculation parameters to the CRT service.
 * Maps to C# GetMarginCalculationRequest in the CRT extension.
 *
 * Note: In Retail SDK 7.2.x, Commerce.Proxy.Common does not exist.
 * This is a plain TypeScript class used to hold the request parameters.
 * The actual server call is made from MarginCalculationOperation.ts via
 * the Commerce proxy manager once the Retail Server extension is deployed.
 */
export class GetMarginCalculationRequest {
    /** Item identifier selected on the sales line. */
    public itemId: string;

    /** Quantity on the selected sales line. */
    public quantity: number;

    /**
     * Net amount of the selected sales line.
     * Used as the revenue figure in the margin formula:
     * Margin % = (NetAmount - PurchasePrice x Qty) / NetAmount x 100
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
