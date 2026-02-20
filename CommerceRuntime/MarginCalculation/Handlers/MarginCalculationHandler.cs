// MarginCalculationHandler.cs
// CRT request handler that retrieves the purchase price via D365 F&O Real-Time Service
// and computes the gross margin for the requested item / net amount.

using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using Microsoft.Dynamics.Commerce.Runtime;
using Microsoft.Dynamics.Commerce.Runtime.DataModel;
using Microsoft.Dynamics.Commerce.Runtime.Messages;
using Microsoft.Dynamics.Commerce.Runtime.RealtimeServices.Messages;
using Contoso.Commerce.Runtime.MarginCalculation.Messages;

namespace Contoso.Commerce.Runtime.MarginCalculation.Handlers
{
    /// <summary>
    /// CRT handler for <see cref="GetMarginCalculationRequest"/>.
    ///
    /// Execution flow:
    /// 1. Receive the request (itemId + netAmount) from the POS.
    /// 2. Call the D365 F&amp;O Real-Time Service method
    ///    <c>ContosoGetItemPurchasePrice</c> to get <c>inventTableModule.Price</c>.
    /// 3. Calculate:
    ///       MarginAmount     = NetAmount − PurchasePrice
    ///       MarginPercentage = (MarginAmount / NetAmount) × 100
    /// 4. Return a <see cref="GetMarginCalculationResponse"/>.
    /// </summary>
    public class MarginCalculationHandler : SingleAsyncRequestHandler<GetMarginCalculationRequest>
    {
        // Name of the Real-Time Service method registered in D365 F&O.
        // This maps to the static method on the X++ class
        // ContosoRetailTransactionServiceEx.getItemPurchasePrice().
        private const string RtsMethodName = "ContosoGetItemPurchasePrice";

        /// <inheritdoc />
        protected override async Task<Response> Process(GetMarginCalculationRequest request)
        {
            ThrowIf.Null(request, nameof(request));

            // ── Step 1: Call the D365 F&O Real-Time Service ──────────────────
            // InvokeExtensionMethodRealtimeRequest forwards the call to the
            // matching [RealtimeTransactionServiceAttribute]-decorated method
            // in D365 F&O (see FOExtensions/MarginCalculation/MarginCalculationRTService.xpp).
            var realtimeRequest = new InvokeExtensionMethodRealtimeRequest(
                RtsMethodName,
                request.ItemId);   // Pass itemId as the first RTS parameter.

            InvokeExtensionMethodRealtimeResponse realtimeResponse =
                await request.RequestContext
                    .ExecuteAsync<InvokeExtensionMethodRealtimeResponse>(realtimeRequest)
                    .ConfigureAwait(false);

            // The RTS method returns a single decimal value: the purchase price.
            ReadOnlyCollection<object> results = realtimeResponse.Result;
            if (results == null || results.Count == 0)
            {
                throw new CommerceException(
                    "MARGIN_CALC_ERROR",
                    ExceptionSeverity.Warning,
                    null,
                    $"Real-Time Service '{RtsMethodName}' returned no data for item '{request.ItemId}'.");
            }

            decimal purchasePrice = Convert.ToDecimal(results[0]);

            // ── Step 2: Calculate margin ──────────────────────────────────────
            decimal netAmount = request.NetAmount;
            decimal marginAmount = netAmount - purchasePrice;

            // Guard against division by zero when NetAmount is 0.
            decimal marginPercentage = netAmount != 0
                ? Math.Round((marginAmount / netAmount) * 100m, 2)
                : 0m;

            marginAmount = Math.Round(marginAmount, 2);

            // ── Step 3: Return response ───────────────────────────────────────
            return new GetMarginCalculationResponse(
                request.ItemId,
                purchasePrice,
                netAmount,
                marginAmount,
                marginPercentage);
        }
    }
}
