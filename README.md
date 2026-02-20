# D365 Store Commerce – Margin Calculation Extension

> **Scenario:** A custom **"Margin"** button appears on the Sales Order (Cart/Transaction) screen toolbar. When a cashier selects a sales line and clicks the button, the system calls a D365 F&O real-time service to retrieve `InventTableModule.Price` (purchase price), then displays a colour-coded margin card in a new custom view.
>
> **Margin formula:**
> `Margin % = (NetAmount − InventTableModule.Price × Qty) / NetAmount × 100`
> where `NetAmount` = revenue and `InventTableModule.Price` (ModuleType = Purch) = cost.

---

## Repository layout

```
src/
├── AX/
│   └── RetailTransactionServiceExt/
│       └── ContosoRetailTransactionServiceExt.xpp      ← D365 F&O X++ real-time service method
│
├── CommerceRuntime/
│   └── Contoso.Commerce.Runtime.MarginCalculation/
│       ├── Contoso.Commerce.Runtime.MarginCalculation.csproj
│       ├── GetMarginCalculationRequest.cs               ← CRT request
│       ├── GetMarginCalculationResponse.cs              ← CRT response (margin figures)
│       ├── MarginCalculationService.cs                  ← CRT handler (calls real-time service)
│       └── MarginCalculationServiceFactory.cs           ← MEF export for DI
│
└── Pos/
    └── MarginCalculationExtension/
        ├── Manifest.json                                ← Extension manifest
        ├── package.json
        ├── tsconfig.json
        ├── Messages/
        │   ├── GetMarginCalculationRequest.ts           ← POS → CRT request proxy
        │   └── GetMarginCalculationResponse.ts          ← Response interface
        ├── Operations/
        │   └── MarginCalculationOperation.ts            ← Button handler (operation 50001)
        └── Views/
            ├── MarginCalculationView.ts                 ← View controller
            └── MarginCalculationView.html               ← Knockout HTML template
```

---

## Step-by-step deployment guide

### Prerequisites

| Requirement | Details |
|---|---|
| D365 Finance & Operations | Version 10.0.20 or later (verify exact minimum with your Commerce SDK release notes) |
| Store Commerce App (sealed) | 10.0.20+ (align with your D365 F&O version) |
| Commerce SDK | Matching version (NuGet) |
| Visual Studio 2019/2022 | For CRT C# build |
| Node.js >= 14 + TypeScript 4.x | For POS TypeScript build |

---

### Step 1 – Deploy the D365 F&O X++ Extension

**File:** `src/AX/RetailTransactionServiceExt/ContosoRetailTransactionServiceExt.xpp`

1. Open **Visual Studio** connected to your D365 F&O development environment.
2. Create (or open) an extension **model** in your development AOT (e.g., `ContosoRetailExtensions`).
3. Add the file `ContosoRetailTransactionServiceExt.xpp` to the model as a new **class** named `ContosoRetailTransactionServiceExt_Extension`.
4. **Build** the model (`Ctrl+Shift+B` or via the Dynamics menu).
5. **Synchronise the database** (Dynamics 365 → Synchronize database).
6. Verify in the AOT that the class is a `[ExtensionOf(classStr(RetailTransactionServiceEx))]` extension.
7. **Deploy** to the target environment (build pipeline, LCS deployable package, etc.).

> **What the X++ method does:**
> `ContosoGetItemPurchasePrice(str _itemId, str _dataAreaId)` issues a
> `select firstonly InventTableModule where ModuleType == Purch` in the given company
> and returns the purchase price as a container `[true, "", price]`.

---

### Step 2 – Build and Deploy the CRT Extension

**Folder:** `src/CommerceRuntime/Contoso.Commerce.Runtime.MarginCalculation/`

#### 2a – Configure NuGet

Add the Commerce SDK NuGet feed to `nuget.config` at the solution root (obtain the URL from LCS / Microsoft documentation for your release version):

```xml
<packageSource key="Dynamics Commerce SDK">
  <add key="Commerce SDK" value="https://pkgs.dev.azure.com/..." />
</packageSource>
```

Set the `CommerceSDKVersion` MSBuild property to match your D365 version, e.g. `9.30.x` for 10.0.20.

#### 2b – Build

```bash
cd src/CommerceRuntime/Contoso.Commerce.Runtime.MarginCalculation
dotnet restore
dotnet build -c Release
```

Output: `bin/Release/net472/Contoso.Commerce.Runtime.MarginCalculation.dll`

#### 2c – Register in CommerceRuntime.ext.config

Open (or create) your `CommerceRuntime.ext.config` and add the assembly reference:

```xml
<?xml version="1.0" encoding="utf-8"?>
<commerceRuntimeExtensions>
  <composition>
    <!-- Existing extensions -->
    <add source="assembly" value="Contoso.Commerce.Runtime.MarginCalculation" />
  </composition>
</commerceRuntimeExtensions>
```

#### 2d – Package into a deployable package

Copy the DLL and the updated `CommerceRuntime.ext.config` into your **Retail Server / CSU extension** deployable package following the standard Commerce Runtime extension packaging guidelines.

---

### Step 3 – Build and Deploy the Store Commerce (POS) Extension

**Folder:** `src/Pos/MarginCalculationExtension/`

#### 3a – Install dependencies

```bash
cd src/Pos/MarginCalculationExtension
npm install
```

#### 3b – Build TypeScript

```bash
npm run build
```

This compiles `Operations/`, `Views/`, and `Messages/` to AMD modules under `dist/`.

#### 3c – Package the extension

Create a `StoreCommerce.Extension.MarginCalculation` extension package:

1. Create the folder structure:
   ```
   StoreCommerce.Extension.MarginCalculation/
   ├── Manifest.json          (copy from src/Pos/MarginCalculationExtension/)
   ├── Operations/
   │   └── MarginCalculationOperation.js   (from dist/)
   ├── Views/
   │   ├── MarginCalculationView.js        (from dist/)
   │   └── MarginCalculationView.html
   └── Messages/
       ├── GetMarginCalculationRequest.js
       └── GetMarginCalculationResponse.js
   ```
2. Zip the folder and rename the `.zip` to `.scpkg`.

#### 3d – Install the extension package into Store Commerce

1. Copy the `.scpkg` file to the Store Commerce **extensions** folder, typically:
   `%ProgramFiles%\Microsoft Dynamics 365\10.0\Store Commerce\Extensions\`
2. Open `extensions.json` in that directory and add the entry:
   ```json
   {
     "extensionPackages": [
       { "baseUrl": "StoreCommerce.Extension.MarginCalculation" }
     ]
   }
   ```
3. Restart the **Store Commerce App** service / process.

---

### Step 4 – Find the correct Screen Layout, then add the Margin button

#### 4a – How to find which Screen Layout your store uses

There are typically many screen layouts in D365 HQ. Use **one of the three methods below** to find the exact layout assigned to your store and registers.

---

**Method 1 – Look it up via the Store (fastest)**

1. Go to **Retail and Commerce → Channels → Stores**
2. Open your store (e.g. *"Houston"* or whichever store you deploy to).
3. On the **General** FastTab, note the value in the **Screen layout** field.  
   That is the layout ID you need to open in Step 4b.

---

**Method 2 – Look it up via the Register**

Some stores assign different layouts per register (e.g. a cashier register vs a manager register).

1. Go to **Retail and Commerce → Channel setup → POS setup → Registers**
2. Open the register you are configuring.
3. On the **General** FastTab, check the **Screen layout** field.  
   - If it is blank the register inherits the layout from its store (use Method 1).
   - If it is populated, use that layout ID.

---

**Method 3 – Check from inside the running POS (quickest verification)**

1. Sign in to Store Commerce.
2. Go to **Settings** (hamburger menu → Settings) → **About**.
3. The **Screen layout ID** (and version) is displayed on the About screen.  
   Cross-reference that ID in HQ to confirm.

---

#### 4b – Which designer to use: "Designer" vs "Button layout designer"

When you open your Screen Layout in HQ you see **two designer buttons** in the Action Pane. Here is what each one does and when to use it:

| Button | What it opens | Use it when… |
|---|---|---|
| **Designer** | The **Screen Layout Designer** — a visual canvas showing the full POS screen: panels, columns, and which button grid sits in each panel. | You want to **see** the overall layout structure and **find the Button Grid ID** assigned to a panel (e.g. the Discount section). |
| **Button layout designer** | A grid editor that lets you directly add/edit/remove **buttons inside a specific button grid**. | You already know the Button Grid you want to edit and want to **add a button** to it. |

**To add the Margin button to the Discount section, use the Button layout designer — but first use Designer to find the right grid ID.** Follow the steps below.

---

#### 4c – Step-by-step: add the Margin button to the Discount section

> **About the blank/empty option in the Action dropdown**
>
> In the Button Layout Designer you will see an Action dropdown with entries like:
> `(blank)`, `Operation`, `Open URL`, `Issue gift card`, etc.
>
> **Yes — select the blank/empty entry.** The blank action is the correct choice for a
> **custom operation** in Retail SDK 7.2.x.  
> When you select it, an **Operation number** field appears — enter **`50001`** there.  
> That is all that is needed; no separate "Custom operation" label exists in this SDK version.
>
> *Alternatively*, if your designer shows an `Operation` entry in the list and you have already
> registered op 50001 in POS operations (Step 0), you can use that instead — both routes work.

---

**Step 0 – (Optional) Register operation 50001 in POS Operations**

> Skip this step if you are using the blank action approach described above.  
> Only required if you want op 50001 to appear by name in the `Operation` picker.

1. Go to **Retail and Commerce → Channel setup → POS setup → POS operations**
2. Click **New**
3. Fill in:
   | Field | Value |
   |---|---|
   | **Operation ID** | `50001` |
   | **Operation name** | `Margin Calculation` |
   | **Enable always** | ✔ Tick |
4. Click **Save**

---

**Step 1 – Find the Discount button grid ID**

1. Go to **Retail and Commerce → Channel setup → POS setup → Screen layouts**
2. Open your layout → click **Designer** (allow the ClickOnce app if prompted)
3. In the canvas, click the **Discount panel** (the area with *"Line discount %"*, *"Total discount %"*, etc.)
4. Its properties show the **Button Grid ID** — note it (e.g. `F1M1DISC`)
5. Close the designer

---

**Step 2 – Add the Margin button**

1. Go to **Retail and Commerce → Channel setup → POS setup → Button grids**
2. Open the Button Grid ID from Step 1
3. Click **Button layout designer**
4. Click an **empty cell** in the grid
5. In the button properties panel, fill in:
   | Field | Value |
   |---|---|
   | **Text on button** | `Margin` |
   | **Action** | **`(blank / empty)`** — select the blank entry at the top of the dropdown |
   | **Operation number** | **`50001`** — type this into the field that appears after selecting blank |
   | **Font size** | *(match surrounding buttons or leave default)* |
   | **Button color** | *(optional)* |
6. Click **OK** / **Save** on the button properties
7. **Save** the Button layout designer

---

**Step 3 – Push to stores**

1. **Retail and Commerce → Retail and Commerce IT → Distribution schedule**
2. Run job **1090 – Registers**
3. Restart Store Commerce (or sync from POS Settings → Database sync)

---

**Step 4 – Verify**

1. Sign in to Store Commerce → open a transaction → add a product → select a line
2. Go to the **Discount** panel → click **Margin**
3. The Margin Calculation view opens showing purchase price, cost, and margin %

---

> **Tip:** If multiple stores use different layouts, repeat Steps 2–3 for each button grid that needs the Margin button.

---

### Step 5 – Verify End-to-End

1. Launch **Store Commerce App** and sign in.
2. Open a **sales order** (or create a new transaction and add a product).
3. **Select** a sales line by clicking on it.
4. Click the **"Margin"** button in the toolbar.
5. Store Commerce will:
   - Send a `GetMarginCalculationRequest` to the CRT.
   - CRT calls the D365 F&O real-time service (`ContosoGetItemPurchasePrice`).
   - D365 F&O returns `InventTableModule.Price` (purchase price, ModuleType = Purch).
   - CRT computes `TotalCost`, `MarginAmount`, and `MarginPercentage` and returns them.
   - The **Margin Calculation View** opens showing:
     - Revenue (Net Amount)
     - Purchase Price (unit, from D365 F&O)
     - Total Cost (Price × Qty)
     - Margin Amount
     - **Margin %** (colour-coded green >= 0 %, red < 0 %)
6. Click **Close** to dismiss the view.

---

## Architecture diagram

```
Store Commerce (POS)
│
│  [User selects line & clicks "Margin" button]
│       │
│  MarginCalculationOperation.ts   (operation 50001)
│       │ GetMarginCalculationRequest (via IRuntime.executeAsync)
│       ▼
│  ─────────────────────────────────────────────────
│  Commerce Runtime (CRT)  [MarginCalculationService.cs]
│       │
│       │ InvokeExtensionMethodRealtimeRequest
│       │ "ContosoGetItemPurchasePrice"
│       ▼
│  ─────────────────────────────────────────────────
│  D365 F&O Real-Time Service
│  [ContosoRetailTransactionServiceExt_Extension]
│       │
│       │ select InventTableModule where ModuleType = Purch
│       ▼
│  InventTableModule.Price  (purchase price)
│       │
│  returns [true, "", purchasePrice]
│
│  CRT computes margin:
│    TotalCost         = purchasePrice x qty
│    MarginAmount      = netAmount - totalCost
│    MarginPercentage  = marginAmount / netAmount x 100
│
│  GetMarginCalculationResponse returned to POS
│
│  MarginCalculationView.ts / .html
│  [Displays KPI cards with colour-coded Margin %]
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Button does not appear | Extension package not loaded | Check `extensions.json` and Store Commerce logs |
| `MARGIN_REALTIME_ERROR` | X++ method not deployed / channel not connected to HQ | Deploy X++ changes; verify real-time service connectivity |
| Purchase price = 0 | No `InventTableModule` row for Purch module | Verify item setup in D365 F&O under `Released products → Purchase → Price` |
| Margin always 0 % | `NetAmount` is 0 (no price on line) | Add a selling price to the product |
| CRT DLL not found | Assembly not in `ext.config` | Add assembly reference and restart CSU / Retail Server |
