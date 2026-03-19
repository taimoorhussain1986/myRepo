# myRepo

## AX2012: Using SSRS Reporting Instance with Multiple AOS Instances

### Scenario

- **Server:** Dev Box Server2
- **AOS Instance A:** Existing AX2012 AOS instance (fully configured)
- **Reporting Instance R:** SSRS reporting instance configured and working with Instance A
- **AOS Instance B:** Newly installed AX2012 AOS instance on the same server

---

### Can AOS Instance B Share Reporting Instance R?

**Yes — Instance B can use the same SSRS server as Instance A**, but it requires its own separate SSRS report folder (virtual directory) and its own AX2012 reporting configuration. The underlying SQL Server Reporting Services (SSRS) *service* is shared, but each AOS instance must have its own dedicated report folder on that SSRS server.

---

### Why a Separate SSRS Folder Is Required for Instance B

Each AX2012 AOS instance deploys its own set of SSRS reports to a designated folder on the report server. If Instance A and Instance B were to share the same SSRS folder:

- Report deployments from one instance could overwrite or conflict with reports from the other.
- Permissions, data sources, and report parameters may differ between instances (e.g., different databases).
- Upgrading or redeploying reports for one instance would affect the other.

---

### Steps to Configure AOS Instance B with a New SSRS Folder on the Same SSRS Server

#### 1. Create a New Virtual Directory on the SSRS Report Server

1. Open **SQL Server Reporting Services Configuration Manager** on the reporting server.
2. Under **Report Manager URL** or **Web Service URL**, note the existing base URL (e.g., `http://server2/ReportServer`).
3. On the SSRS server, navigate to the **Report Manager** web portal.
4. Create a new top-level folder for Instance B (e.g., `DynamicsAX_InstanceB`). This will serve as the root report folder for Instance B.

#### 2. Configure AOS Instance B to Use the New SSRS Folder

1. On the AX2012 server, open the **Microsoft Dynamics AX 2012 Server Configuration Utility** (`AXCfg.exe`).
2. Select the configuration for **AOS Instance B**.
3. Go to the **Reporting** tab.
4. Set the **Report server URL** to the shared SSRS server (e.g., `http://server2/ReportServer`).
5. Set the **Report manager URL** to (e.g., `http://server2/Reports`).
6. Set the **Report folder** to the folder name (path) you created in Step 1 (e.g., type `DynamicsAX_InstanceB` as the folder name/path).
7. Save the configuration.

#### 3. Configure the AX2012 Reporting Data Source for Instance B

1. Open the **AX2012 client** connected to **Instance B**.
2. Navigate to **System administration > Setup > Business intelligence > Reporting Services > Report servers**.
3. Add or configure the report server entry to match the SSRS URL and new folder name set above.
4. Ensure the **AOS instance** field is mapped to Instance B.

#### 4. Deploy Reports for AOS Instance B

From the AX2012 client connected to Instance B, or via the **AX2012 Management Shell**, deploy the reports:

```powershell
# Using AX2012 Management Shell
Publish-AXReport -ReportName "*" -Server <SSRSServerName> -Instance <SSRSInstanceName>
```

Or from within the AX2012 client:

- Navigate to **System administration > Setup > Business intelligence > Reporting Services > Deploy report**.
- Deploy all or specific reports as required by Instance B.

#### 5. Set Permissions on the New SSRS Folder

1. In **SSRS Report Manager**, open the new folder (e.g., `DynamicsAX_InstanceB`).
2. Assign the **AOS Instance B service account** (the Windows account running the Instance B AOS service) the **Content Manager** role on this folder.
3. Assign end-user or AX user groups the **Browser** role as needed.

---

### Summary

| Component | Instance A | Instance B |
|---|---|---|
| SSRS Service | Reporting Instance R (shared) | Reporting Instance R (shared) |
| SSRS Server URL | `http://server2/ReportServer` | `http://server2/ReportServer` (same) |
| SSRS Report Folder | `DynamicsAX_InstanceA` | `DynamicsAX_InstanceB` (new) |
| AX Database | Instance A database | Instance B database |
| Report Deployment | Instance A reports | Instance B reports |

> **Key Takeaway:** The SSRS *service* (Reporting Instance R) is shared between both AOS instances. However, each AOS instance must have its own dedicated SSRS **report folder** to keep deployments, data sources, and permissions isolated.
