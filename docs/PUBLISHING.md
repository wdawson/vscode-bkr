# Publishing

Releases are published to the [VS Code Marketplace](https://marketplace.visualstudio.com/manage/publishers/wdawson)
automatically by [`.github/workflows/release.yml`](../.github/workflows/release.yml)
when a `v*.*.*` tag is pushed.

Authentication uses **Microsoft Entra ID workload identity federation** — GitHub
mints a short-lived OIDC token on each run and Entra trusts it via a one-time
federated credential. There is **no Personal Access Token and no stored secret**,
so nothing expires. This replaces the old PAT flow (global PATs are retired on
2026-12-01).

Everything below is **free**: public-repo GitHub Actions, a free Entra app
registration, and Marketplace publishing. No paid Azure subscription or managed
identity is required.

## Cutting a release

```bash
npm version patch          # or minor / major — bumps package.json + creates the tag
# update CHANGELOG.md for the new version, then:
git push --follow-tags     # pushing the vX.Y.Z tag triggers the Release workflow
```

The workflow runs the test suite, then `vsce publish --azure-credential`.

## One-time setup

Do this once. It lives in Microsoft's web portals (can't be scripted).

### 1. Create a free Entra app registration

1. Go to the [Microsoft Entra admin center](https://entra.microsoft.com) →
   **Entra ID → App registrations → New registration**.
2. Name it e.g. `vscode-bkr-publisher`, leave defaults, **Register**.
3. From the **Overview** page, copy the **Application (client) ID** and
   **Directory (tenant) ID**.

### 2. Add a federated credential trusting this repo

In the app registration → **Certificates & secrets → Federated credentials →
Add credential**:

- Scenario: **GitHub Actions deploying Azure resources**
- Organization: `wdawson`  •  Repository: `vscode-bkr`
- Entity type: **Environment**  •  Environment name: `marketplace`

(The `marketplace` environment name must match `environment:` in the workflow.)

### 3. Grant the app access to the Marketplace publisher

1. In the [publisher management page](https://marketplace.visualstudio.com/manage/publishers/wdawson),
   open **Members / Security**.
2. Add the app registration's **service principal** as a member with the
   **Contributor** role.

> If the publisher is tied to a personal Microsoft account and can't reference
> the Entra app, see the fallback below to keep shipping while sorting this out.

### 4. Wire up GitHub

- Create an environment named **`marketplace`**
  (repo **Settings → Environments → New environment**).
- Add repository **variables** (repo **Settings → Secrets and variables →
  Actions → Variables**), not secrets — these are non-sensitive IDs:
  - `AZURE_CLIENT_ID` = the Application (client) ID from step 1
  - `AZURE_TENANT_ID` = the Directory (tenant) ID from step 1

That's it — the next `v*.*.*` tag publishes automatically.

## Fallback: manual publish with a PAT

Global PATs still work until **2026-12-01**. To publish manually:

1. Create a token at <https://dev.azure.com/wdawson/_usersSettings/tokens> →
   **New Token**, Organization **All accessible organizations**, Scope
   **Marketplace → Manage**.
2. `vsce publish -p <PAT>` (or `vsce login wdawson`, then `vsce publish`).
