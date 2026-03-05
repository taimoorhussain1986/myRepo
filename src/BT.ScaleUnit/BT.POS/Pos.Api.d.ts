/**
 * Type declarations for the Dynamics 365 Commerce POS API (PosApi).
 * These declarations expose the extension points, interfaces, and base classes
 * required to build POS extensions.
 */

declare module "PosApi/Entities" {
    export namespace ClientEntities {
        export interface IOperationOptions {
            operationId: number;
        }

        export interface ICancelable {
            canceled: boolean;
        }

        export class ExtensionError extends Error {
            constructor(message: string, commerceErrorCode?: string);
        }
    }

    export namespace ProxyEntities {
        export interface SimpleProduct {
            RecordId: number;
            Name: string;
            BasePrice: number;
            Price: number;
            AdjustedPrice: number;
            PrimaryImageUrl: string;
            ItemId: string;
        }

        export interface CartLine {
            LineId: string;
            ItemId: string;
            Description: string;
            Price: number;
            Quantity: number;
            ExtendedPrice: number;
            NetAmount: number;
            TaxAmount: number;
            DiscountAmount: number;
            PercentDiscount: number;
        }

        export interface Cart {
            Id: string;
            CartLines: CartLine[];
            TotalAmount: number;
            SubtotalAmount: number;
            TaxAmount: number;
            DiscountAmount: number;
        }
    }

    export enum OperationType {
        None = 0,
        AddItemToCart = 100,
        VoidTransaction = 200,
        PayCash = 201,
        ReturnTransaction = 504,
        DiscountPercent = 603,
        LineDiscountPercent = 604,
        TotalDiscountPercent = 605,
        PriceOverride = 700,
        SetQuantity = 1005
    }
}

declare module "PosApi/Extend/Triggers/OperationTriggers" {
    import { ClientEntities, OperationType } from "PosApi/Entities";

    /**
     * Options passed to a pre-operation trigger. Provides context about
     * the POS operation that is about to execute.
     */
    export interface IPreOperationTriggerOptions {
        /** The ID of the operation being executed. */
        readonly operationId: number;
        /** The options associated with the operation. */
        readonly operationOptions: ClientEntities.IOperationOptions;
        /** A correlation ID that can be used for logging or tracing. */
        readonly correlationId: string;
        /**
         * The request object carrying the operation ID in Store Commerce 9.55+.
         * Access operationId via `options.request.operationId`.
         */
        readonly request?: { readonly operationId: number; [key: string]: any; };
    }

    /**
     * Represents the result of a pre-operation trigger execution.
     * When `canceled` is true, the POS operation is halted.
     */
    export interface IHaltCondition {
        /** Whether the operation should be canceled/halted. */
        canceled: boolean;
        /** Optional reason message when the operation is halted. */
        reason?: string;
    }

    /**
     * Interface that must be implemented by all pre-operation triggers.
     */
    export interface IPreOperationTrigger {
        /**
         * The list of operation IDs this trigger applies to.
         * When omitted the framework invokes the trigger for every operation;
         * override in derived classes to restrict to specific operation IDs.
         */
        readonly supportedOperations?: OperationType[];
        /**
         * Executes the trigger logic before the POS operation runs.
         * @param options - Contextual options for the operation.
         * @returns A promise (or any value) indicating whether the operation
         *          should proceed or be canceled/halted.
         */
        execute(options: IPreOperationTriggerOptions): any;
    }

    /**
     * Abstract base class for pre-operation triggers.
     * Extend this class and implement `execute` to create a custom trigger.
     * The framework injects `context` at runtime.
     */
    export abstract class PreOperationTrigger {
        /** Runtime context injected by the POS framework (navigator, cartAccessor, etc.). */
        readonly context: any;
        /**
         * The list of operation IDs this trigger applies to.
         * When not overridden the framework invokes this trigger for every operation;
         * override in a subclass to restrict to specific operation IDs.
         */
        readonly supportedOperations: OperationType[];
        abstract execute(options: IPreOperationTriggerOptions): any;
    }

    /**
     * Options passed to a post-operation trigger.
     */
    export interface IPostOperationTriggerOptions {
        readonly operationId: number;
        readonly operationOptions: ClientEntities.IOperationOptions;
        readonly correlationId: string;
    }

    /**
     * Interface that must be implemented by all post-operation triggers.
     */
    export interface IPostOperationTrigger {
        readonly supportedOperations: OperationType[];
        execute(options: IPostOperationTriggerOptions): Promise<void>;
    }

    /**
     * Abstract base class for post-operation triggers.
     */
    export abstract class PostOperationTrigger implements IPostOperationTrigger {
        abstract readonly supportedOperations: OperationType[];
        abstract execute(options: IPostOperationTriggerOptions): Promise<void>;
    }
}

declare module "PosApi/Extend/Triggers/ProductTriggers" {
    import { ProxyEntities } from "PosApi/Entities";

    export interface IPreProductSaleTriggerOptions {
        cartLineId: string;
        product: ProxyEntities.SimpleProduct;
        quantity: number;
    }

    export interface IPostProductSaleTriggerOptions {
        cartLineId: string;
        product: ProxyEntities.SimpleProduct;
        quantity: number;
    }

    export interface IPreProductSaleTrigger {
        execute(options: IPreProductSaleTriggerOptions): Promise<void>;
    }

    export interface IPostProductSaleTrigger {
        execute(options: IPostProductSaleTriggerOptions): Promise<void>;
    }
}

declare module "PosApi/TypeExtensions" {
    export namespace ObjectExtensions {
        function isNullOrUndefined(value: any): boolean;
        function isString(value: any): value is string;
        function isNumber(value: any): value is number;
        function isBoolean(value: any): value is boolean;
    }

    export namespace StringExtensions {
        function isNullOrWhitespace(value: string): boolean;
        function format(template: string, ...args: any[]): string;
    }

    export namespace NumberExtensions {
        function isNumeric(value: any): boolean;
    }
}

declare module "PosApi/Consume/Cart" {
    import { ProxyEntities } from "PosApi/Entities";

    export interface IGetCurrentCartClientRequest {
        readonly correlationId: string;
    }

    export interface IGetCurrentCartClientResponse {
        readonly data: ProxyEntities.Cart;
    }
}
