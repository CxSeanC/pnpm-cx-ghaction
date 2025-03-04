******Checkmarx ONE: Scanning pnpm Projects (Proof of Value)******

This repository serves as a Proof of Value (PoV) demonstration to validate that pnpm-based projects can be successfully scanned by Checkmarx ONE. Since Checkmarx ONE does not natively support pnpm-lock.yaml, this workflow ensures compatibility by converting pnpm-lock.yaml into package-lock.json, allowing dependency analysis.

****📌 Key Features****

Automatically generates pnpm-lock.yaml if it does not exist.
Converts pnpm-lock.yaml to package-lock.json for Checkmarx ONE compatibility.
Commits and pushes pnpm-lock.yaml back to the repository to ensure reproducibility.
Caches npm manifests to optimize pipeline performance.
Executes a Checkmarx ONE scan with secure authentication.

****🛠️ Adapting to Your Environment****

To use this in your environment, you may need to:

Update the GitHub Secrets to match your authentication settings.
Modify the repository branch if you are not using master.
Adjust the base URI for Checkmarx ONE if using a different region or tenant.
Validate that permissions allow GitHub Actions to push changes if using an enterprise GitHub setup.

****🔧 Setup Instructions****

**1️⃣ Configure GitHub Secrets**

A GitHub Personal Access Token (PAT) is required to commit and push pnpm-lock.yaml. Store it securely as a GitHub secret:

Go to your GitHub repository → Settings → Secrets and Variables → Actions.
Click 'New repository secret'.
Set the name to GH_PAT.
Paste your Personal Access Token (PAT) as the value and save.

**2️⃣ Add the GitHub Action**

Ensure your .github/workflows/convert-and-scan.yml file contains the following:

name: Checkmarx ONE: pnpm PoV Scan

on:
  push:
    branches:
      - master
  pull_request:
      branches:
        - master

permissions:
  contents: write
  id-token: write

jobs:
  convert-validate-scan:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository (with credentials for pushing)
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Securely Set Up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install pnpm (Fix Missing Binary)
        run: |
          npm install -g pnpm
          export PATH=$(npm root -g)/pnpm/bin:$PATH
          pnpm --version
        shell: bash

      - name: Ensure pnpm-lock.yaml Exists
        run: |
          if [ ! -f "pnpm-lock.yaml" ]; then
            echo "⚠️ pnpm-lock.yaml not found, generating..."
            pnpm install --lockfile-only
            
            # Configure Git user
            git config --local user.email "first.last@email.com"
            git config --local user.name "first last"

            # Authenticate with GitHub Token
            git remote set-url origin https://x-access-token:${{ secrets.GH_PAT }}@github.com/${{ github.repository }}.git

            # Commit and push changes
            git add pnpm-lock.yaml
            git commit -m "Auto-generate pnpm-lock.yaml"
            git push origin master
          else
            echo "✅ pnpm-lock.yaml already exists."
          fi
        env:
          GH_PAT: ${{ secrets.GH_PAT }}
        shell: bash

      - name: Securely Convert All pnpm-lock.yaml Files to package-lock.json
        run: |
          set -euo pipefail
          mkdir -p build/cache
          find . -type f -name "pnpm-lock.yaml" -print0 | while IFS= read -r -d '' pnpm_lock; do
            dir=$(dirname "$pnpm_lock")

            if [[ "$dir" != ./[^.]* ]]; then
              echo "⚠️ Skipping unsafe directory: $dir"
              continue
            fi

            echo "🔍 Processing $pnpm_lock in $dir..."

            if [ ! -f "$dir/package.json" ]; then
              echo "⚠️ Skipping $dir (no package.json found)"
              continue
            fi

            (cd "$dir" && pnpm import --silent) || { echo "❌ pnpm import failed in $dir"; exit 1; }

            if [ -f "$dir/package-lock.json" ]; then
              mkdir -p "build/cache/$dir"
              cp "$dir/package.json" "$dir/package-lock.json" "build/cache/$dir/"
            else
              echo "❌ Error: package-lock.json was not generated in $dir"
              exit 1
            fi
          done
        shell: bash

      - name: Cache npm manifests for Checkmarx ONE
        uses: actions/cache@v3
        with:
          path: build/cache
          key: npm-manifest-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            npm-manifest-${{ runner.os }}-

      - name: Run Checkmarx ONE Scan (Secure Authentication)
        uses: checkmarx/ast-github-action@main
        with:
          project_name: ${{ github.repository }}
          base_uri: https://us.ast.checkmarx.net
          cx_tenant: ${{ secrets.CX_TENANT }}
          cx_client_id: ${{ secrets.CX_CLIENT_ID }}
          cx_client_secret: ${{ secrets.CX_CLIENT_SECRET }}

**3️⃣ Push Changes and Verify**

Once you've added the workflow, push a new commit to trigger the GitHub Action.

Check the workflow logs under GitHub → Actions to confirm:
pnpm-lock.yaml is generated (if missing).
package-lock.json is created and cached.
Checkmarx ONE scans the project successfully.

****🛡️ Security Considerations****

Do not store personal access tokens in the workflow; always use GitHub Secrets.
Ensure your repo permissions allow GitHub Actions to push changes.
Limit GitHub PAT (GH_PAT) scope to repository actions (repo:public_repo, repo:status, etc.).

****✅ Conclusion****

This repository provides a PoV demonstration for scanning pnpm projects with Checkmarx ONE. It ensures pnpm-lock.yaml is converted into package-lock.json so that Checkmarx ONE can correctly analyze dependencies. Adapt the workflow to fit your specific GitHub and Checkmarx ONE environment.

If you encounter issues, check the GitHub Actions logs or ensure your GitHub Secrets are correctly configured.

🚀 Happy scanning with Checkmarx ONE!
