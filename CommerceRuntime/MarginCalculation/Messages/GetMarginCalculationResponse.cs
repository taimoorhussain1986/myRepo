// GetMarginCalculationResponse.cs
// CRT response message returned to the POS client after margin is calculated.

using System.Runtime.Serialization;
using Microsoft.Dynamics.Commerce.Runtime.Messages;

namespace Contoso.Commerce.Runtime.MarginCalculation.Messages
{
    /// <summary>
    /// Response from the CRT handler carrying the margin calculation results.
    /// </summary>
    [DataContract]
    public sealed class GetMarginCalculationResponse : Response
    {
        /// <summary>
        /// Initialises a new instance of <see cref="GetMarginCalculationResponse"/>.
        /// </summary>
        /// <param name="itemId">Item number that was evaluated.</param>
        /// <param name="purchasePrice">Purchase price from inventTableModule.Price (cost).</param>
        /// <param name="netAmount">Net amount from the cart line (revenue).</param>
        /// <param name="marginAmount">Absolute margin: NetAmount − PurchasePrice.</param>
        /// <param name="marginPercentage">Gross margin %: ((NetAmount − PurchasePrice) / NetAmount) × 100.</param>
        public GetMarginCalculationResponse(
            string itemId,
            decimal purchasePrice,
            decimal netAmount,
            decimal marginAmount,
            decimal marginPercentage)
        {
            this.ItemId = itemId;
            this.PurchasePrice = purchasePrice;
            this.NetAmount = netAmount;
            this.MarginAmount = marginAmount;
            this.MarginPercentage = marginPercentage;
        }

        /// <summary>Gets the item number.</summary>
        [DataMember]
        public string ItemId { get; private set; }

        /// <summary>Gets the purchase price (cost) retrieved from D365 F&amp;O.</summary>
        [DataMember]
        public decimal PurchasePrice { get; private set; }

        /// <summary>Gets the net amount (revenue) from the cart line.</summary>
        [DataMember]
        public decimal NetAmount { get; private set; }

        /// <summary>Gets the absolute margin amount (NetAmount − PurchasePrice).</summary>
        [DataMember]
        public decimal MarginAmount { get; private set; }

        /// <summary>
        /// Gets the gross margin percentage:
        ///   ((NetAmount − PurchasePrice) / NetAmount) × 100.
        /// </summary>
        [DataMember]
        public decimal MarginPercentage { get; private set; }
    }
}
