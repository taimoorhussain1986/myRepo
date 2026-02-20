// ----------------------------------------------------------------------------
// Copyright (c) Contoso. All rights reserved.
// ----------------------------------------------------------------------------
// The [Export(typeof(IRequestHandlerAsync))] attribute is applied directly
// on MarginCalculationService.  No separate factory class is needed.
//
// To register the extension, add the following to CommerceRuntime.ext.config:
//
//   <composition>
//     <add source="assembly" value="Contoso.Commerce.Runtime.MarginCalculation" />
//   </composition>
// ----------------------------------------------------------------------------
