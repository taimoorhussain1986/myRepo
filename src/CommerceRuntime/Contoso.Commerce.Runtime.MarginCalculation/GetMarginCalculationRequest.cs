// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------

namespace Contoso.Commerce.Runtime.MarginCalculation
{
    using System.Runtime.Serialization;
    using Microsoft.Dynamics.Commerce.Runtime.Messages;

    /// <summary>
    /// Request sent from POS to the CRT extension to calculate the margin
    /// for a selected sales order line.
    /// </summary>
    [DataContract]
    public sealed class GetMarginCalculationRequest : Request
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GetMarginCalculationRequest"/> class.
        /// </summary>
        /// <param name="itemId">The item identifier.</param>
        /// <param name="quantity">Quantity on the sales line.</param>
        /// <param name="netAmount">Net amount (revenue) on the sales line.</param>
        /// <param name="dataAreaId">The legal entity / company identifier (e.g. "USMF").</param>
        public GetMarginCalculationRequest(string itemId, decimal quantity, decimal netAmount, string dataAreaId)
        {
            this.ItemId = itemId;
            this.Quantity = quantity;
            this.NetAmount = netAmount;
            this.DataAreaId = dataAreaId;
        }

        /// <summary>Gets the item identifier.</summary>
        [DataMember]
        public string ItemId { get; private set; }

        /// <summary>Gets the quantity on the sales line.</summary>
        [DataMember]
        public decimal Quantity { get; private set; }

        /// <summary>
        /// Gets the net amount of the sales line – used as the revenue figure
        /// in the margin formula:  Margin% = (Revenue − Cost) / Revenue × 100.
        /// </summary>
        [DataMember]
        public decimal NetAmount { get; private set; }

        /// <summary>Gets the legal-entity identifier used to look up the purchase price.</summary>
        [DataMember]
        public string DataAreaId { get; private set; }
    }
}
