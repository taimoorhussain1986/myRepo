// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------

import { GetMarginCalculationRequest } from "../Messages/GetMarginCalculationRequest";
import { IMarginCalculationResult }    from "../Messages/GetMarginCalculationResponse";

/**
 * POS Operation: MarginCalculation (operationId = 50001)
 *
 * This operation is triggered by the custom "Margin" button placed on the
 * Sales Order transaction screen toolbar / button grid.
 *
 * Flow:
 *   1. Validate that exactly one sales line is selected.
 *   2. Build a GetMarginCalculationRequest and execute it against the CRT.
 *   3. Navigate to MarginCalculationView to display the results.
 *
 * Register in Manifest.json:
 *   "operations": [{ "operationId": "50001", "operationRequestHandlerPath": "Operations/MarginCalculationOperation" }]
 */
export default class MarginCalculationOperation
    implements Commerce.Extensibility.IOperationHandler {

    /**
     * Executes the Margin Calculation operation.
     * @param context  POS operation context (provides runtime, currentTransaction, etc.)
     * @param request  POS operation request (not used for custom data in this scenario).
     */
    public async execute(
        context: Commerce.Extensibility.IOperationContext,
        request: Commerce.Extensibility.ExtensionOperationRequestType<void>
    ): Promise<Commerce.Client.Entities.ICancelableResult> {

        // ----------------------------------------------------------------
        // Step 1 – Validate that a single line is selected.
        // In Store Commerce the selected line is typically exposed via
        // context.selectedSalesLineNumber. We match on LineNumber first,
        // then fall back to the first line so the operation always has data.
        // ----------------------------------------------------------------
        const selectedLineNumber = (context as any).selectedSalesLineNumber as number | undefined;

        const salesLine =
            (selectedLineNumber !== undefined
                ? context.currentTransaction?.salesLines?.find(
                      (l) => l.LineNumber === selectedLineNumber
                  )
                : null) ??
            context.currentTransaction?.salesLines?.[0];

        if (!salesLine) {
            await context.runtime.executeAsync(
                new Commerce.Client.Entities.ClientEntities.ShowMessageNotificationOperationRequest(
                    Commerce.Client.Entities.ClientEntities.NotificationDisplayType.ErrorDialog,
                    "No sales line selected. Please select a sales line before calculating margin."
                )
            );
            return { canceled: true };
        }

        const itemId    = salesLine.ItemId ?? "";
        const quantity  = salesLine.Quantity ?? 0;
        const netAmount = salesLine.NetAmountWithAllInclusiveTax ?? salesLine.NetAmount ?? 0;

        // DataAreaId: prefer channel's company, fall back to empty string.
        const dataAreaId =
            (context.runtime as any).currentChannel?.CompanyName ?? "";

        // ----------------------------------------------------------------
        // Step 2 – Call the CRT extension service.
        // ----------------------------------------------------------------
        let marginResult: IMarginCalculationResult | null = null;
        try {
            const crtRequest = new GetMarginCalculationRequest(
                itemId,
                quantity,
                netAmount,
                dataAreaId
            );

            const crtResponse = await context.runtime.executeAsync<
                Commerce.Proxy.Common.IDataServiceResponse
            >(crtRequest);

            // The CRT response entity is mapped to IMarginCalculationResult.
            marginResult = crtResponse?.data as IMarginCalculationResult;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            await context.runtime.executeAsync(
                new Commerce.Client.Entities.ClientEntities.ShowMessageNotificationOperationRequest(
                    Commerce.Client.Entities.ClientEntities.NotificationDisplayType.ErrorDialog,
                    `Margin calculation failed: ${msg}`
                )
            );
            return { canceled: true };
        }

        if (!marginResult) {
            await context.runtime.executeAsync(
                new Commerce.Client.Entities.ClientEntities.ShowMessageNotificationOperationRequest(
                    Commerce.Client.Entities.ClientEntities.NotificationDisplayType.ErrorDialog,
                    "Margin calculation returned no data."
                )
            );
            return { canceled: true };
        }

        // ----------------------------------------------------------------
        // Step 3 – Navigate to the custom MarginCalculationView.
        // ----------------------------------------------------------------
        const navParams: Commerce.Extensibility.ICustomViewNavigationParameters = {
            viewName: "MarginCalculationView",
            viewType: Commerce.Client.Entities.ClientEntities.CustomViewType.Page,
            initialData: marginResult
        };

        await context.runtime.executeAsync(
            new Commerce.Client.Entities.ClientEntities.ShowModalDialogOperationRequest(
                navParams
            )
        );

        return { canceled: false };
    }
}
