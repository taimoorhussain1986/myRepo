// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * Typed representation of the CRT GetMarginCalculationResponse returned
 * by Contoso.Commerce.Runtime.MarginCalculation.GetMarginCalculationResponse.
 */
export interface IMarginCalculationResult {
    /** Item identifier. */
    itemId: string;

    /**
     * Unit purchase price from InventTableModule.Price (ModuleType = Purch)
     * retrieved via the D365 F&O real-time service.
     */
    purchasePrice: number;

    /** Quantity on the sales line. */
    quantity: number;

    /** Net amount (revenue) of the sales line. */
    netAmount: number;

    /** Total cost = PurchasePrice × Quantity. */
    totalCost: number;

    /** Margin amount = Revenue − Cost. */
    marginAmount: number;

    /**
     * Margin percentage = (Revenue − Cost) / Revenue × 100.
     * Rounded to 2 decimal places by the view.
     */
    marginPercentage: number;
}
