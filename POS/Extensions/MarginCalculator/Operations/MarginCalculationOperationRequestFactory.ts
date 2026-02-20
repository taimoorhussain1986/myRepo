/**
 * MarginCalculationOperationRequestFactory.ts
 *
 * Factory that constructs the MarginCalculationOperationRequest from the POS
 * button-grid invocation context.  Store Commerce calls this factory when the
 * operator presses the "Margin Calculation" button.
 */

import { IExtensionOperationRequestContext } from "PosApi/Create/Operations";
import {
    MarginCalculationOperationRequest,
    MarginCalculationOperationResponse,
} from "./MarginCalculationOperation";

/**
 * Creates a MarginCalculationOperationRequest from the current POS context.
 * Validates that at least one cart line is selected before proceeding.
 *
 * @param context  Operation request context provided by Store Commerce.
 * @returns        A resolved promise with the new operation request.
 */
export default function createOperationRequest(
    context: IExtensionOperationRequestContext<MarginCalculationOperationResponse>
): Promise<MarginCalculationOperationRequest> {
    const correlationId: string = context.correlationId;

    // Retrieve the currently selected cart line(s) from the POS cart.
    const cartLines = context.cart ? context.cart.CartLines : [];
    const selectedLine = cartLines.find((line) => line.IsSelected) || cartLines[0];

    if (!selectedLine) {
        // No line selected – reject so Store Commerce shows a default error.
        return Promise.reject("Please select a sales line before using Margin Calculation.");
    }

    const itemId: string = selectedLine.ItemId || "";
    const netAmount: number = selectedLine.NetAmount || 0;
    const lineDescription: string = selectedLine.Description || selectedLine.ItemId || "";

    return Promise.resolve(
        new MarginCalculationOperationRequest(correlationId, itemId, netAmount, lineDescription)
    );
}
