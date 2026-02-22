// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------

namespace Contoso.Commerce.Runtime.MarginCalculation
{
    using System;
    using System.Collections.Generic;
    using System.Collections.ObjectModel;
    using System.Threading.Tasks;
    using Microsoft.Dynamics.Commerce.Runtime;
    using Microsoft.Dynamics.Commerce.Runtime.Messages;
    using Microsoft.Dynamics.Commerce.Runtime.RealtimeServices.Messages;

    /// <summary>
    /// CRT service that handles <see cref="GetMarginCalculationRequest"/>.
    ///
    /// Flow:
    ///   1. Receive item / line details from the POS extension.
    ///   2. Call the D365 F&amp;O real-time service extension method
    ///      <c>ContosoGetItemPurchasePrice</c> to retrieve
    ///      <c>InventTableModule.Price</c> (ModuleType = Purch).
    ///   3. Compute margin and return <see cref="GetMarginCalculationResponse"/>.
    ///
    /// Register this assembly in CommerceRuntime.ext.config:
    ///   &lt;add source="assembly" value="Contoso.Commerce.Runtime.MarginCalculation" /&gt;
    ///
    /// Note: [Export] attribute is NOT required in Commerce Scale Unit SDK.
    /// Handlers implementing IRequestHandlerAsync are discovered automatically
    /// when the assembly is registered in the composition config.
    /// </summary>
    public sealed class MarginCalculationService : IRequestHandlerAsync
    {
        /// <summary>
        /// Name of the X++ static method exposed via the D365 F&amp;O
        /// <c>RetailTransactionServiceEx</c> extension class.
        /// Must match the <c>[SysEntryPointAttribute(true)]</c> method name exactly.
        /// </summary>
        private const string RealtimeServiceMethodName = "ContosoGetItemPurchasePrice";

        /// <inheritdoc/>
        public IEnumerable<Type> SupportedRequestTypes =>
            new[] { typeof(GetMarginCalculationRequest) };

        /// <inheritdoc/>
        public async Task<Response> Execute(Request request)
        {
            ThrowIf.Null(request, nameof(request));

            var marginRequest = (GetMarginCalculationRequest)request;

            // ----------------------------------------------------------------
            // Step 1: Call the D365 F&O real-time service to get the
            // purchase price from InventTableModule (ModuleType = Purch).
            // The X++ method signature (see ContosoRetailTransactionServiceExt.xpp):
            //   public static RetailTransactionServiceResponse
            //       ContosoGetItemPurchasePrice(str itemId, str dataAreaId)
            // ----------------------------------------------------------------
            var realtimeRequest = new InvokeExtensionMethodRealtimeRequest(
                RealtimeServiceMethodName,
                marginRequest.ItemId,
                marginRequest.DataAreaId);

            InvokeExtensionMethodRealtimeResponse realtimeResponse =
                await request.RequestContext
                    .ExecuteAsync<InvokeExtensionMethodRealtimeResponse>(realtimeRequest)
                    .ConfigureAwait(false);

            // The X++ method returns: [0] = succeeded (bool), [1] = message, [2] = purchasePrice (real)
            ReadOnlyCollection<object> results = realtimeResponse.Result;

            bool succeeded = results.Count > 0 && Convert.ToBoolean(results[0]);
            if (!succeeded)
            {
                string errorMessage = results.Count > 1
                    ? Convert.ToString(results[1])
                    : "Unknown error from real-time service.";

                throw new CommerceException(
                    "MARGIN_REALTIME_ERROR",
                    $"Real-time service call '{RealtimeServiceMethodName}' failed: {errorMessage}");
            }

            decimal purchasePrice = results.Count > 2
                ? Convert.ToDecimal(results[2])
                : 0m;

            // ----------------------------------------------------------------
            // Step 2: Return the margin response.
            // Margin% = (NetAmount − PurchasePrice × Qty) / NetAmount × 100
            // ----------------------------------------------------------------
            var response = new GetMarginCalculationResponse(
                marginRequest.ItemId,
                purchasePrice,
                marginRequest.Quantity,
                marginRequest.NetAmount);

            return response;
        }
    }
}
