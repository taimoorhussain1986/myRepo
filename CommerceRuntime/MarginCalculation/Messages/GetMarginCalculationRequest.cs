// GetMarginCalculationRequest.cs
// CRT request message that carries the item ID and net amount to the handler.

using System.Runtime.Serialization;
using Microsoft.Dynamics.Commerce.Runtime.Messages;

namespace Contoso.Commerce.Runtime.MarginCalculation.Messages
{
    /// <summary>
    /// Request sent from the POS client to the CRT to calculate the margin for a
    /// specific item on a sales order line.
    /// </summary>
    [DataContract]
    public sealed class GetMarginCalculationRequest : Request
    {
        /// <summary>
        /// Initialises a new instance of <see cref="GetMarginCalculationRequest"/>.
        /// </summary>
        /// <param name="itemId">The item number to look up in D365 F&amp;O.</param>
        /// <param name="netAmount">Net amount (revenue) from the selected cart line.</param>
        public GetMarginCalculationRequest(string itemId, decimal netAmount)
        {
            this.ItemId = itemId;
            this.NetAmount = netAmount;
        }

        /// <summary>Gets the item number.</summary>
        [DataMember]
        public string ItemId { get; private set; }

        /// <summary>Gets the net amount (revenue) from the POS cart line.</summary>
        [DataMember]
        public decimal NetAmount { get; private set; }
    }
}
