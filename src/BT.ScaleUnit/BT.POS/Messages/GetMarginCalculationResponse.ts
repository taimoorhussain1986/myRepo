// ----------------------------------------------------------------------------
// Copyright (c) Beaumont Commerce. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * Describes the margin calculation result that is passed to MarginCalculationView
 * and can be used for display or further processing.
 */
export interface IMarginCalculationResult {
    /** The item identifier from the cart line. */
    itemId: string;
    /** The unit purchase/cost price used for the calculation (Phase 1: placeholder 0). */
    purchasePrice: number;
    /** Quantity from the cart line. */
    quantity: number;
    /** Net sale amount for the line (after discounts, inc. tax where applicable). */
    netAmount: number;
    /** Total cost = purchasePrice × |quantity|. */
    totalCost: number;
    /** Margin amount = netAmount − totalCost. */
    marginAmount: number;
    /** Gross margin percentage = (marginAmount / netAmount) × 100. */
    marginPercentage: number;
}
