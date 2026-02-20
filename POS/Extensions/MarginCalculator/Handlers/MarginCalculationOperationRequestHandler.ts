/**
 * MarginCalculationOperationRequestHandler.ts
 *
 * Handles the MarginCalculationOperationRequest (Operation ID 5001).
 *
 * Flow:
 *  1. Receive the operation request containing itemId + netAmount.
 *  2. Call the CRT via GetMarginCalculationClientRequest (which internally
 *     calls the D365 F&O Real-Time Service to get inventTableModule.Price).
 *  3. Navigate to MarginCalculationView to display the results.
 */

import { ExtensionOperationRequestHandlerBase, IOperationContext } from "PosApi/Create/Operations";
import { ClientEntities } from "PosApi/Entities";
import {
    MarginCalculationOperationRequest,
    MarginCalculationOperationResponse,
} from "../Operations/MarginCalculationOperation";
import { GetMarginCalculationClientRequest } from "../Messages/GetMarginCalculationClientRequest";
import { GetMarginCalculationClientResponse, IMarginResult } from "../Messages/GetMarginCalculationClientResponse";

export default class MarginCalculationOperationRequestHandler
    extends ExtensionOperationRequestHandlerBase<
        MarginCalculationOperationRequest,
        MarginCalculationOperationResponse
    >
{
    /**
     * Executes the margin calculation operation.
     */
    public executeAsync(
        request: MarginCalculationOperationRequest
    ): Promise<ClientEntities.ICancelableDataResult<MarginCalculationOperationResponse>> {
        const crtRequest = new GetMarginCalculationClientRequest(
            request.correlationId,
            request.itemId,
            request.netAmount
        );

        // Execute the CRT request – this reaches the server-side CRT handler
        // which calls the D365 F&O Real-Time Service.
        return this.context.runtime
            .executeAsync<GetMarginCalculationClientResponse>(crtRequest)
            .then(
                (
                    result: ClientEntities.ICancelableDataResult<GetMarginCalculationClientResponse>
                ) => {
                    if (result.canceled) {
                        return { canceled: true, data: new MarginCalculationOperationResponse(false) };
                    }

                    const marginResult: IMarginResult = result.data.marginResult;

                    // Navigate to the custom MarginCalculationView to show results.
                    return this.context.navigator
                        .navigate("MarginCalculationView", {
                            itemId: marginResult.itemId,
                            purchasePrice: marginResult.purchasePrice,
                            netAmount: marginResult.netAmount,
                            marginPercentage: marginResult.marginPercentage,
                            marginAmount: marginResult.marginAmount,
                            lineDescription: request.lineDescription,
                        })
                        .then(() => ({
                            canceled: false,
                            data: new MarginCalculationOperationResponse(true),
                        }));
                }
            )
            .catch((error: Error) => {
                this.context.logger.logError(
                    `MarginCalculationOperationRequestHandler: Failed – ${error.message}`
                );
                return Promise.reject(error);
            });
    }
}
