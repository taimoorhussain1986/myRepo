# D365 Store Commerce – Margin Calculation Extension

> **Scenario:** A custom **"Margin"** button appears on the Sales Order (Cart/Transaction) screen toolbar. When a cashier selects a sales line and clicks the button, the system calls a D365 F&O real-time service to retrieve `InventTableModule.Price` (purchase price), then displays a colour-coded margin card in a new custom view.
>
> **Margin formula:**
> `Margin % = (NetAmount − InventTableModule.Price × Qty) / NetAmount × 100`
> where `NetAmount` = revenue and `InventTableModule.Price` (ModuleType = Purch) = cost.

---

## Repository layout

Files are organised to **drop directly into your existing BT.ScaleUnit solution** — no new projects needed.

```
src/
├── AX/
│   └── RetailTransactionServiceExt/
│       └── ContosoRetailTransactionServiceExt.xpp  ← Add to D365 F&O AOT model
│
├── CommerceRuntime/
│   └── MarginCalculation/                          ← Add to BT.CommerceRuntime project
│       ├── GetMarginCalculationRequest.cs
│       ├── GetMarginCalculationResponse.cs
│       └── MarginCalculationService.cs
│
└── Pos/                                            ← Add to BT.POS project
    ├── manifest.json                               ← Merge additions into BT.POS\manifest.json
    ├── Messages/
    │   ├── GetMarginCalculationRequest.ts
    │   └── GetMarginCalculationResponse.ts
    ├── Operations/
    │   └── MarginCalculationOperation.ts           ← Operation handler (ID: 50001)
    └── Views/
        ├── MarginCalculationView.ts
        └── MarginCalculationView.html
```

---

## Step-by-step deployment guide

> **Your solution:** `BT.ScaleUnit` (SDK 9.55) with projects:
> `BT.CommerceRuntime` · `BT.POS` · `BT.ScaleUnit` · `BT.ScaleUnit.Installer` · `BT.StoreCommerce.Installer`
>
> **You do NOT copy DLLs manually.** The two installer projects do all the packaging automatically when you build.

---

### Step 1 – Add the C# files to BT.CommerceRuntime

The three C# files go **directly inside your existing `BT.CommerceRuntime` project** — no new `.csproj` needed.

1. In **Solution Explorer**, right-click `BT.CommerceRuntime` → **Add → New Folder** → name it `MarginCalculation`
2. Right-click the `MarginCalculation` folder → **Add → Existing Item**
3. Browse to the repo and select all three files:
   - `src/CommerceRuntime/MarginCalculation/GetMarginCalculationRequest.cs`
   - `src/CommerceRuntime/MarginCalculation/GetMarginCalculationResponse.cs`
   - `src/CommerceRuntime/MarginCalculation/MarginCalculationService.cs`
4. Click **Add**
5. Build `BT.CommerceRuntime` (`Ctrl+Shift+B`) — confirm zero errors

> The files use namespace `Beaumont.Commerce.Runtime.MarginCalculation` which matches your existing project naming.

---

### Step 2 – Add the TypeScript files to BT.POS

The TypeScript files go **directly inside your existing `BT.POS` project** — no new tsconfig needed.

1. In **Solution Explorer**, right-click `BT.POS` → **Add → New Folder** → name it `Operations`  
   *(skip if the folder already exists)*
2. Right-click `Operations` → **Add → Existing Item** → select:
   - `src/Pos/Operations/MarginCalculationOperation.ts`
3. Right-click `Views` (existing folder) → **Add → Existing Item** → select:
   - `src/Pos/Views/MarginCalculationView.ts`
   - `src/Pos/Views/MarginCalculationView.html`
4. Right-click `BT.POS` → **Add → New Folder** → name it `Messages`
5. Right-click `Messages` → **Add → Existing Item** → select:
   - `src/Pos/Messages/GetMarginCalculationRequest.ts`
   - `src/Pos/Messages/GetMarginCalculationResponse.ts`

> The `manifest.json` at `src/Pos/manifest.json` contains only the **additions** for the margin feature.
> **Merge** those additions into your existing `BT.POS\manifest.json` as described in the Manifest section below.

---

### Step 3 – Merge the manifest additions

Open your existing `BT.POS\manifest.json` and add the following entries:

**a) Add a new `operations` array inside `components.extend` (NOT inside `requestHandlers`):**

```json
"operations": [
  {
    "operationId": 50001,
    "operationRequestHandlerPath": "Operations/MarginCalculationOperation"
  }
]
```

> ⚠️ **VS "property name is not allowed by the schema" warning on `operations`**
>
> This is a **cosmetic VS IntelliSense-only warning** caused by the local
> `devDependencies/schemas/manifestSchema.json` being an older version that
> pre-dates the `operations` key.  
> **The Store Commerce 9.55 runtime fully supports `operations` and reads it
> correctly at runtime.** This warning does NOT affect the build or deployment.  
> You can safely ignore it, or suppress it by removing the `"$schema"` line from
> your manifest (VS IntelliSense will stop validating against the local schema).
>
> **Do NOT put the operation handler in `requestHandlers`** — that category is
> for data-pipeline request overrides (like `GetPickupDateClientRequestHandlerExt`).
> Registering an operation handler there causes Store Commerce to route to the
> built-in `BlankOperationHandler`, resulting in a `runtimeInterceptorFailed /
> string_29838` runtime error.

**b) In `components.create.views` — add:**
```json
{
  "description": "Margin Calculation View",
  "name": "MarginCalculationView",
  "title": "Margin Calculation",
  "pageName": "MarginCalculationView",
  "phonePageName": "MarginCalculationView",
  "viewDirectory": "Views/",
  "viewControllerPath": "Views/MarginCalculationView"
}
```

> The full merged manifest is already in `src/Pos/manifest.json` — you can use it as a reference.

---

### Step 4 – Build the full solution

In Visual Studio, **Build → Rebuild Solution** (`Ctrl+Shift+B`).

The build order is:
1. `BT.CommerceRuntime` → produces `BT.CommerceRuntime.dll`
2. `BT.POS` → compiles TypeScript → produces `BT.POS.dll` and JS files
3. `BT.ScaleUnit` → links both
4. **`BT.ScaleUnit.Installer`** → packages the CSU extension installer
5. **`BT.StoreCommerce.Installer`** → packages the Store Commerce extension installer (`.scpkg`)

Confirm **0 errors** in the Error List before proceeding.

---

### Step 5 – Deploy to Commerce Scale Unit (CSU)

After a successful build, `BT.ScaleUnit.Installer` has produced a self-contained installer.

**Run the CSU installer:**

```
cd J:\CommerceSDK\src\BT.ScaleUnit\BT.ScaleUnit.Installer\bin\Debug\
BT.ScaleUnit.Installer.exe install
```

Or from the **Developer Command Prompt for VS**:

```
msbuild BT.ScaleUnit.Installer\BT.ScaleUnit.Installer.csproj /t:Install
```

This copies `BT.CommerceRuntime.dll` into the CSU extensions folder under:
```
C:\Program Files\Microsoft Dynamics 365\10.0\Commerce Scale Unit\Extensions\
```
and updates the `commerceruntime.ext.config` automatically.

> **Restart the CSU service** after the installer finishes:
> ```
> net stop "Microsoft Dynamics 365 Commerce Scale Unit"
> net start "Microsoft Dynamics 365 Commerce Scale Unit"
> ```
> (Run as Administrator)

---

### Step 6 – Deploy to Store Commerce

**Run the Store Commerce installer:**

```
cd J:\CommerceSDK\src\BT.ScaleUnit\BT.StoreCommerce.Installer\bin\Debug\
BT.StoreCommerce.Installer.exe install
```

This deploys the compiled JS/HTML extension files and updated manifest into:
```
C:\Program Files\Microsoft Dynamics 365\10.0\Store Commerce\Extensions\
```

> **Restart Store Commerce** after the installer finishes:
> - Close the Store Commerce App completely (task tray icon → Exit)
> - Relaunch from the Start Menu

Alternatively, if you prefer **manual copy** (quicker for development iterations):

1. From `BT.POS\bin\Debug\` (or wherever the SDK outputs the compiled extension files), copy:
   - `Extensions\` folder contents into:  
     `C:\Program Files\Microsoft Dynamics 365\10.0\Store Commerce\Extensions\`
2. Restart Store Commerce.

---

### Step 7 – Deploy the D365 F&O X++ Extension

**File:** `src/AX/RetailTransactionServiceExt/ContosoRetailTransactionServiceExt.xpp`

1. Open **Visual Studio** connected to your D365 F&O development environment.
2. Create (or open) an extension **model** in your AOT (e.g., `BeaumontRetailExtensions`).
3. Add the file as a new **class** named `ContosoRetailTransactionServiceExt_Extension`.
4. **Build** the model → **Synchronise the database**.
5. **Deploy** to your target environment via LCS deployable package.

> **What it does:** `ContosoGetItemPurchasePrice(str _itemId, str _dataAreaId)` queries
> `InventTableModule` where `ModuleType == Purch` and returns the purchase price as
> a container `[true, "", price]`.

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
