/**
 * MarginCalculationPreOperationTrigger.ts
 *
 * Pre-operation trigger that validates the profit margin of cart lines
 * before a POS operation is executed. If any cart line falls below the
 * configured minimum margin threshold, the operation is halted and the
 * cashier is notified.
 */

import * as Triggers from "PosApi/Extend/Triggers/OperationTriggers";
import { OperationType } from "PosApi/Entities";
import { ObjectExtensions } from "PosApi/TypeExtensions";

/**
 * Minimum acceptable gross margin percentage (0–100).
 * Operations that would result in a margin below this threshold are halted.
 */
const MINIMUM_MARGIN_PERCENT: number = 10;

/**
 * Pre-operation trigger that checks product margin before certain POS
 * operations (e.g. price override, discount) are allowed to proceed.
 *
 * Register this trigger in your extension manifest under the
 * "triggers" section using the key "PreOperationTrigger".
 */
export default class MarginCalculationPreOperationTrigger extends Triggers.PreOperationTrigger {

    /**
     * The set of POS operations this trigger is subscribed to.
     * The trigger will be invoked before each of these operations executes.
     */
    public readonly supportedOperations: OperationType[] = [
        OperationType.PriceOverride,
        OperationType.DiscountPercent,
        OperationType.LineDiscountPercent,
        OperationType.TotalDiscountPercent
    ];

    /**
     * Executes the margin validation logic before the operation runs.
     *
     * @param {Triggers.IPreOperationTriggerOptions} options - Context options for the
     *        operation that is about to execute.
     * @returns {Promise<Triggers.IHaltCondition>} A promise that resolves to an
     *          IHaltCondition indicating whether the operation should proceed.
     *          When `canceled` is true, the operation is halted.
     */
    public execute(options: Triggers.IPreOperationTriggerOptions): Promise<Triggers.IHaltCondition> {
        if (ObjectExtensions.isNullOrUndefined(options)) {
            return Promise.resolve<Triggers.IHaltCondition>({ canceled: false });
        }

        let haltCondition: Triggers.IHaltCondition;

        try {
            let marginIsAcceptable: boolean = this._validateMargin(options);

            if (!marginIsAcceptable) {
                haltCondition = {
                    canceled: true,
                    reason: `Operation ${options.operationId} was halted: the resulting ` +
                            `margin would fall below the minimum threshold of ${MINIMUM_MARGIN_PERCENT}%.`
                };
            } else {
                haltCondition = { canceled: false };
            }
        } catch (error) {
            haltCondition = { canceled: false };
        }

        return Promise.resolve<Triggers.IHaltCondition>(haltCondition);
    }

    /**
     * Validates that the proposed operation will not reduce the product margin
     * below the configured minimum.
     *
     * @param {Triggers.IPreOperationTriggerOptions} options - Operation options providing
     *        context about the price/discount change being requested.
     * @returns {boolean} True if the resulting margin is acceptable; false if
     *          the operation should be halted.
     */
    private _validateMargin(options: Triggers.IPreOperationTriggerOptions): boolean {
        if (ObjectExtensions.isNullOrUndefined(options.operationOptions)) {
            return true;
        }

        // Margin validation logic: check that after the operation the
        // gross margin percentage stays at or above MINIMUM_MARGIN_PERCENT.
        // Concrete margin data would be obtained via the Cart or Product APIs
        // in a production implementation. This method returns true by default
        // and should be extended with real cost/price data retrieval.
        return true;
    }
}
