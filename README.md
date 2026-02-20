# D365 Store Commerce – Margin Calculation Extension

A complete, end-to-end extension that adds a **Margin Calculation** button to the D365 Store Commerce (POS) sales transaction screen.  
When an operator selects a sales line and clicks the button the system:

1. Calls a **CRT (Commerce Runtime) handler** on the server.
2. The CRT handler invokes a **D365 F&O Real-Time Service (RTS)** to fetch the item's purchase price from `inventTableModule.Price`.
3. Calculates the **gross margin** using the formula:
   > **Margin % = ((Net Amount − Purchase Price) ÷ Net Amount) × 100**
4. Displays the results in a **custom POS view**.

---

## Repository Structure

```
├── POS/
│   └── Extensions/
│       └── MarginCalculator/
│           ├── manifest.json                          # Extension manifest
│           ├── Operations/
│           │   ├── MarginCalculationOperation.ts      # Operation request/response types
│           │   └── MarginCalculationOperationRequestFactory.ts
│           ├── Handlers/
│           │   └── MarginCalculationOperationRequestHandler.ts
│           ├── Messages/
│           │   ├── GetMarginCalculationClientRequest.ts
│           │   └── GetMarginCalculationClientResponse.ts
│           └── Views/
│               ├── MarginCalculationView.ts           # View controller
│               ├── MarginCalculationView.html         # Knockout template
│               └── MarginCalculationView.scss         # Styles
│
├── CommerceRuntime/
│   └── MarginCalculation/
│       ├── MarginCalculation.csproj
│       ├── Messages/
│       │   ├── GetMarginCalculationRequest.cs
│       │   └── GetMarginCalculationResponse.cs
│       └── Handlers/
│           └── MarginCalculationHandler.cs
│
└── FOExtensions/
    └── MarginCalculation/
        └── MarginCalculationRTService.xpp             # D365 F&O Real-Time Service (X++)
```

---

## Step-by-Step Deployment Guide

### Prerequisites

| Requirement | Version |
|---|---|
| D365 Finance & Operations | 10.0.21 + |
| Store Commerce (sealed POS) | 9.28 + |
| Commerce Scale Unit (CSU) | Cloud or self-hosted |
| .NET SDK | 6.0 + |
| Node.js | 16 LTS + |
| Store Commerce SDK | Matching your POS version |

---

### Step 1 – Deploy the D365 F&O Real-Time Service

The Real-Time Service is an **X++ class** in D365 F&O that the CRT calls to fetch the purchase price.

1. Open **Visual Studio** configured for D365 F&O development.
2. In your extension model (e.g., `ContosoCommerce`), create a new class file and paste the contents of `FOExtensions/MarginCalculation/MarginCalculationRTService.xpp`.
3. **Build** the model: **Dynamics 365 → Build models**.
4. Navigate to **Retail and Commerce → Headquarters setup → Parameters → Commerce parameters → Real-time service** and confirm the connection profile is active.
5. Run **Retail and Commerce → Distribution schedule → 9999 (All)** (or a targeted job) to push changes to channel databases.

> **Note:** The `[RealtimeTransactionServiceAttribute]` decorator on both the class and the method registers the RTS endpoint automatically after build & sync. No additional AIF/service configuration is required.

---

### Step 2 – Build and Deploy the CRT Extension

The CRT extension runs inside the Commerce Scale Unit and calls the F&O Real-Time Service.

```bash
cd CommerceRuntime/MarginCalculation
dotnet restore
dotnet build -c Release
```

#### For Cloud Scale Unit (CSU)

1. Package the extension by following the [CSU extension packaging guide](https://docs.microsoft.com/en-us/dynamics365/commerce/dev-itpro/csu-core-extension).
2. Copy the compiled `Contoso.Commerce.Runtime.MarginCalculation.dll` into your CSU extension package.
3. Register the handler in your `commerceruntime.ext.config`:

```xml
<composition>
  <add source="assembly"
       value="Contoso.Commerce.Runtime.MarginCalculation" />
</composition>
```

4. Deploy the updated CSU package from **LCS** or via the Commerce Scale Unit self-service installer.

#### For Self-Hosted Scale Unit / Dev Environment

1. Copy the compiled DLL to `%CRT_Runtime_Path%\ext\` (e.g., `C:\RetailServer\webroot\bin\ext\`).
2. Update `commerceruntime.ext.config` as shown above.
3. Restart IIS.

---

### Step 3 – Build and Package the POS Extension

The POS extension adds the button operation and custom view to Store Commerce.

#### 3a – Set up the Store Commerce SDK

```bash
# From the Store Commerce SDK root (downloaded from LCS / NuGet)
npm install
```

#### 3b – Copy extension files

Copy the `POS/Extensions/MarginCalculator/` folder into your POS extension project:

```
<YourPosExtensionProject>/
└── src/
    └── extensions/
        └── MarginCalculator/   ← copy here
```

#### 3c – Reference the extension in the extension package manifest

In your root `manifest.json` (extension package level), add:

```json
{
  "extensionPackages": [
    {
      "baseUrl": "MarginCalculator"
    }
  ]
}
```

#### 3d – Build the POS extension

```bash
npm run build
```

#### 3e – Package and deploy

```bash
npm run package
```

Follow the [Store Commerce extension deployment guide](https://docs.microsoft.com/en-us/dynamics365/commerce/dev-itpro/pos-extension/create-pos-extension-package) to side-load or deploy the package via LCS.

---

### Step 4 – Add the Button to the POS Button Grid in HQ

The custom operation must be wired to a physical button in the POS UI via Commerce Headquarters.

1. Go to **Retail and Commerce → Channel setup → POS setup → Button grids**.
2. Open the button grid assigned to the **Transaction screen** for your store (e.g., grid `F2L1`).
3. Click **Designer** (or use the visual designer).
4. Add a new button:
   - **Action:** `Run custom operation`
   - **Custom operation name:** `MarginCalculation`
   - **Operation number:** `5001`
   - **Button text:** `Margin Calc`
5. **Save** and run the distribution schedule: **1090 (Registers)**.
6. In Store Commerce, activate the device to pull the updated button grid.

---

### Step 5 – Test the Feature

1. Open **Store Commerce**.
2. Create or open a sales transaction.
3. **Select a sales line** (tap/click on a line item).
4. Press the **Margin Calc** button.
5. The system calls the CRT → F&O RTS → retrieves `inventTableModule.Price` for the item.
6. The **Margin Calculation** view opens showing:
   - Item ID and description
   - Purchase Price (cost from F&O)
   - Net Amount (revenue from the cart line)
   - Margin Amount (Net Amount − Purchase Price)
   - **Margin %** (color-coded green if positive, red if negative)
7. Press **Close** to return to the transaction screen.

---

## Margin Formula

```
Margin Amount     = Net Amount − Purchase Price
Margin Percentage = (Margin Amount ÷ Net Amount) × 100
```

| Field | Source |
|---|---|
| **Net Amount** (revenue) | POS `CartLine.NetAmount` |
| **Purchase Price** (cost) | `inventTableModule.Price` where `ModuleType = Purch` (D365 F&O) |

---

## Operation ID

| Operation Name | Operation ID |
|---|---|
| `MarginCalculation` | `5001` |

> Ensure operation ID `5001` does not conflict with other custom operations in your environment. Change it in `manifest.json` and `MarginCalculationOperation.ts` if needed.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Button not visible on screen | Button grid not updated | Re-run distribution schedule 1090 |
| "No line selected" message | Operator clicked button without selecting a line | Select a line first |
| RTS call fails | F&O Real-Time Service not deployed or connectivity issue | Check `MarginCalculationRTService.xpp` is built and F&O RTS profile is configured |
| `0` purchase price returned | Item not set up in `inventTableModule` for purchase | Set up the item's purchase price in **Product information management → Released products → Manage costs → Purchase price** |
| CRT extension not found | DLL not registered in `commerceruntime.ext.config` | Follow Step 2 above |