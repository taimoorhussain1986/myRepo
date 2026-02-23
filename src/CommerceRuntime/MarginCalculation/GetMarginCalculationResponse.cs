// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------

namespace Beaumont.Commerce.Runtime.MarginCalculation
{
    using Microsoft.Dynamics.Commerce.Runtime.Messages;

    /// <summary>
    /// Response returned by the CRT margin-calculation service containing
    /// the purchase price retrieved from D365 F&amp;O and the computed margin figures.
    /// </summary>
    public sealed class GetMarginCalculationResponse : Response
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GetMarginCalculationResponse"/> class.
        /// </summary>
        /// <param name="itemId">The item identifier.</param>
        /// <param name="purchasePrice">
        ///   The unit purchase price from <c>InventTableModule.Price</c> (ModuleType = Purch).
        /// </param>
        /// <param name="quantity">Quantity on the sales line.</param>
        /// <param name="netAmount">Net amount (revenue) of the sales line.</param>
        public GetMarginCalculationResponse(
            string itemId,
            decimal purchasePrice,
            decimal quantity,
            decimal netAmount)
        {
            this.ItemId = itemId;
            this.PurchasePrice = purchasePrice;
            this.Quantity = quantity;
            this.NetAmount = netAmount;

            // Total cost = purchase price × quantity
            this.TotalCost = purchasePrice * quantity;

            // Margin amount = revenue − cost
            this.MarginAmount = netAmount - this.TotalCost;

            // Margin % = (Revenue − Cost) / Revenue × 100   (guard division by zero)
            this.MarginPercentage = netAmount != 0
                ? (this.MarginAmount / netAmount) * 100m
                : 0m;
        }

        /// <summary>Gets the item identifier.</summary>
        public string ItemId { get; }

        /// <summary>
        /// Gets the unit purchase price sourced from
        /// <c>InventTableModule.Price</c> where <c>ModuleType = Purch</c>.
        /// </summary>
        public decimal PurchasePrice { get; }

        /// <summary>Gets the quantity on the sales line.</summary>
        public decimal Quantity { get; }

        /// <summary>Gets the net amount of the sales line (revenue).</summary>
        public decimal NetAmount { get; }

        /// <summary>Gets the total cost (PurchasePrice × Quantity).</summary>
        public decimal TotalCost { get; }

        /// <summary>Gets the margin amount (Revenue − Cost).</summary>
        public decimal MarginAmount { get; }

        /// <summary>Gets the margin percentage ((Revenue − Cost) / Revenue × 100).</summary>
        public decimal MarginPercentage { get; }
    }
}
