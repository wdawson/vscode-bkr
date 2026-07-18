# Publishing

Releases are published to **both** the
[VS Code Marketplace](https://marketplace.visualstudio.com/manage/publishers/wdawson)
and [Open VSX](https://open-vsx.org/namespace/wdawson) (the open registry used by
Cursor, VSCodium, Windsurf, ...) automatically by
[`.github/workflows/release.yml`](../.github/workflows/release.yml) when a
`v*.*.*` tag is pushed. One kickoff, one approval gate, both registries — and the
same `.vsix` is pushed to each.

Each publish is **idempotent**: re-running a tag whose version is already live is
treated as success, so failed/partial runs are safe to retry.

Authentication differs per registry:

- **VS Code Marketplace** uses **Microsoft Entra ID workload identity federation**
  — GitHub mints a short-lived OIDC token per run; **no stored secret, nothing
  expires**. (Replaces the old PAT flow; global PATs retire 2026-12-01.)
- **Open VSX** has no OIDC option, so it uses a stored **access token**, kept as
  an *environment* secret on `marketplace` (only exposed to the gated job).

Everything is **free**: public-repo GitHub Actions, a free Entra app registration,
and both registries. No paid Azure subscription or managed identity required.

## Cutting a release

```bash
npm version patch          # or minor / major — bumps package.json + creates the tag
# update CHANGELOG.md for the new version, then:
git push --follow-tags     # pushing the vX.Y.Z tag triggers the Release workflow
```

The workflow runs the tests, packages one `.vsix`, then publishes it to the VS
Code Marketplace (`vsce publish --azure-credential`) and Open VSX (`ovsx publish`).

## One-time setup

Do this once. It lives in Microsoft's web portals (can't be scripted).

### 1. Create a free Entra app registration

1. Go to the [Microsoft Entra admin center](https://entra.microsoft.com) →
   **Entra ID → App registrations → New registration**.
2. Fill in the form:
   - **Name**: e.g. `vscode-bkr-publisher`
   - **Supported account types**: **Accounts in this organizational directory
     only (Single tenant)** — federated credentials require a tenant-resident
     app; nothing ever signs into it.
   - **Redirect URI**: leave **blank** (don't pick a platform — OIDC federation
     doesn't use one).
3. **Register**, then from the **Overview** page copy the **Application
   (client) ID** and **Directory (tenant) ID**.

### 2. Add a federated credential trusting this repo

In the app registration → **Certificates & secrets → Federated credentials →
Add credential**:

- Scenario: **GitHub Actions deploying Azure resources**
- Organization: `wdawson`  •  Repository: `vscode-bkr`
- Entity type: **Environment**  •  Environment name: `marketplace`
- Name: anything, e.g. `github-vscode-bkr-marketplace`
- Leave **Audience** at its default (`api://AzureADTokenExchange`)

(The `marketplace` environment name must match `environment:` in the workflow.)

### 3. Grant the app access to the Marketplace publisher

1. In the [publisher management page](https://marketplace.visualstudio.com/manage/publishers/wdawson),
   open **Members / Security**.
2. Add the app registration's **service principal** as a member with the
   **Contributor** role.

> If the publisher is tied to a personal Microsoft account and can't reference
> the Entra app, see the fallback below to keep shipping while sorting this out.

### 4. Wire up GitHub

The **`marketplace`** environment is already created, with `wdawson` as a
required reviewer and deployments restricted to `main` + `v*` tags — so every
publish pauses for an approval click. Nothing to do there.

Just add repository **variables** (repo **Settings → Secrets and variables →
Actions → Variables**), not secrets — these are non-sensitive IDs:
  - `AZURE_CLIENT_ID` = the Application (client) ID from step 1
  - `AZURE_TENANT_ID` = the Directory (tenant) ID from step 1

That's it — the next `v*.*.*` tag publishes automatically (after you approve
the environment gate).

### 5. Open VSX (Cursor / VSCodium / Windsurf)

Open VSX has no OIDC, so this leg uses one stored token. If you skip it, the
workflow still publishes to the VS Code Marketplace and just warns.

1. **Sign in** to <https://open-vsx.org> with GitHub.
2. **Sign the publisher agreement**: profile → *Log in with Eclipse* → *Show
   Publisher Agreement* → read and agree. (One-time, required by Eclipse.)
3. **Create an access token**: <https://open-vsx.org/user-settings/tokens> →
   *Generate New Token*. Copy it (shown once).
4. **Create the namespace** (once), locally:
   ```bash
   npx ovsx create-namespace wdawson -p <token>
   ```
5. **Store the token** as an *environment* secret so it's only exposed to the
   gated job — repo **Settings → Environments → marketplace → Add secret**:
   - `OPEN_VSX_TOKEN` = the token from step 3

   (Or: `gh secret set OPEN_VSX_TOKEN --env marketplace --repo wdawson/vscode-bkr`.)

Unlike the Entra side (secretless), this is a stored long-lived token. Ours is set
to **never expire**, so it won't lapse — but if it's ever revoked or you rotate it,
just regenerate and update the `OPEN_VSX_TOKEN` secret. The namespace shows as
*unverified* (⚠️) until the ownership claim
([namespace-access issue](https://github.com/EclipseFdn/open-vsx.org/issues/11916))
is approved, then flips to *verified* (🛡️) automatically.

## Fallback: manual publish with a PAT

Global PATs still work until **2026-12-01**. To publish manually:

1. Create a token at <https://dev.azure.com/wdawson/_usersSettings/tokens> →
   **New Token**, Organization **All accessible organizations**, Scope
   **Marketplace → Manage**.
2. `vsce publish -p <PAT>` (or `vsce login wdawson`, then `vsce publish`).
