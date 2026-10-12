# Community submissions and automatic email

The public routes are [`submit.html`](../submit.html) and [`schema.html`](../schema.html). The form creates a real `.xlsx` workbook locally, with **Submission** and **Review guidance** worksheets. It requires contributor name, email, dataset name, primary source URL, release year, license/reuse terms, and consent. Unknown year/license values are accepted explicitly. Additional acquisition, sensor, annotation, vehicle and provenance fields support curator review.

## Current delivery status

**The delivered v1.3 configuration is in email preparation mode. Automatic email is not connected or verified. No test email was sent during implementation.**

Clicking **Prepare Excel & email** downloads the workbook and opens instructions with a pre-addressed email link to **tianzhi.he@ami-lab.com**. The visitor must attach the downloaded file and send the message. The UI explicitly says the submission has not been sent. A `mailto:` link cannot attach local files or guarantee that an email application is configured.

The repository includes a separately deployable Google Apps Script receiver in [`integrations/google-apps-script/`](../integrations/google-apps-script/). Once the owner deploys and verifies it, the form can generate an Excel copy, POST the metadata to the receiver, and show its server-generated receipt. The receiver independently creates a Google Sheet, exports it as XLSX, emails the fixed review recipient, and moves the temporary Sheet to Google Drive Trash. Only successful `MailApp.sendEmail` completion produces the thank-you receipt. This confirms mail-service acceptance, **not inbox delivery or catalog publication**.

## Why a separate service is needed

[GitHub Pages serves static files](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). It cannot keep SMTP credentials or execute a server email handler. Publishing credentials in JavaScript or calling a private GitHub Actions dispatch token from the browser would expose them. This implementation therefore uses [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web) under an account controlled by the lab. A GitHub login alone does not authorize Google Sheets, Drive or email services.

The browser uses a regular HTTPS form POST and navigates to a separate Google receipt page. It does not treat an opaque `fetch(..., {mode:'no-cors'})` response as success, and does not depend on cross-origin iframe cookies, unrestricted `postMessage` or an unsupported Apps Script CORS header.

## Owner setup

1. Sign in to a lab-controlled Google account with permission to send review emails. Prefer a dedicated account/project because the receiver runs under the deployer's authority.
2. Create a **standalone Apps Script project** at [script.google.com](https://script.google.com/). Copy `integrations/google-apps-script/Code.gs` into `Code.gs`.
3. In project settings, enable **Show appsscript.json manifest file in editor**. Replace its content with the provided `appsscript.json`. The manifest enables Drive v3 and declares explicit scopes. If you use a standard Google Cloud project, enable the **Google Drive API** there as well. See [Advanced Drive service](https://developers.google.com/apps-script/advanced/drive).
4. Verify the fixed recipient in `ATLAS.recipient`. The shipped value is `tianzhi.he@ami-lab.com`. Check `ATLAS.returnUrl` against the actual deployed GitHub Pages URL; the default is `https://ambientintelligence-lab.github.io/Pavement_Atlas/submit.html`.
5. Run `initializeReceiver` once from the editor and authorize its scopes. This initializes a server-only email-hash salt and an `ENABLED=false` property. It does **not** send a message. Do not print, copy to the browser, or commit OAuth tokens or Script Properties.
6. Review the requested scopes: `spreadsheets` creates/formats the temporary workbook; `drive` exports and trashes it; `script.external_request` calls the fixed Drive export API; `script.send_mail` sends the attachment. Drive is a broad scope: keep the project isolated and restrict project editors. No Gmail inbox-reading scope is requested. [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app) supports attachments and a reply-to address.
7. Deploy → **New deployment** → **Web app**. Execute as **Me** (the authorized lab account). For a public form, choose **Anyone** as the access setting if your organization permits it. Domain policy may prohibit anonymous web apps; if so, keep the fallback mode and choose an approved hosted receiver. Visitors should not be asked to grant Drive or mail permissions.
8. Copy the deployment URL ending in `/exec`. Do not use the editor's `/dev` URL. Keep the website endpoint blank during initial setup.
9. In Apps Script **Script Properties**, set `ENABLED=true` when ready for a controlled integration test. This enables a public send endpoint with a fixed recipient; review the limits below before doing so.
10. Set `endpoint` in `src/submission-config.js` to the `/exec` URL in a local/private test copy. The endpoint URL is public configuration, not a secret. The browser accepts only an HTTPS `script.google.com/macros/s/.../exec` URL.
11. Complete the live acceptance checks below with the lab's authorization for a clearly labeled test contribution. Verify receipt in the recipient's inbox and open its attachment. Then publish the endpoint configuration to GitHub Pages. Subsequent server changes require updating the Apps Script deployment to a new version.

Google's [web-app guide](https://developers.google.com/apps-script/guides/web) explains execution identity and deployment options. The workbook export uses the documented [Drive files.export endpoint](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/export), with an XLSX MIME type. The browser workbook is generated without third-party libraries or a CDN.

## Live acceptance checks before enabling the public form

- Submit a clearly labeled test record with a monitored reply-to address. Confirm the receipt page reports mail-service acceptance, the review inbox receives exactly one message, and the XLSX opens with intact Unicode, URLs, line breaks and both worksheets.
- Refresh/re-POST the same record. Confirm the server acknowledges the existing reference without sending a second message. Changed metadata with the same reference must be rejected.
- Check required name/email/source/year/license, invalid URLs, unsupported schema version, missing consent and oversize input. Invalid submissions must not send mail.
- Check cells beginning with `=`, `+`, `-` or `@`: they must be text, with no formulas or links executed by Excel. The receiver does not fetch submitted URLs.
- Temporarily set `ENABLED=false`; confirm that the server shows **Submission not sent** and offers the manual email path. Restore it only when ready.
- Test quota/rate-limit and Drive export failures in a test deployment. No success receipt should appear. A failure during/after the mail call must show **Delivery needs confirmation**, because the send outcome could be uncertain.
- Verify the temporary Google Sheet is moved to Trash after success and failure. Check the Apps Script execution log for cleanup warnings; move any leftover temporary workbooks to Trash manually.
- Inspect the public repository and built files for credentials. Only the public deployment URL belongs in the site.
- Test a signed-out/incognito browser and the deployed GitHub Pages origin. Confirm that the Google account's domain policy allows the intended public access.

## Limits, abuse controls and privacy

The receiver validates a fixed field allowlist, required fields, URLs, enums, maximum lengths and consent on the server. It uses text-only cells and escapes formula-like prefixes. Source URLs are included as metadata and are never fetched by the receiver. The mail recipient is fixed in server code; browser data cannot turn the service into an arbitrary-recipient email relay.

A script lock protects rate counters and duplicate references. The default application cap is **40 attempts/day** and **3 attempts per email/hour**, with server-generated SHA-256 hashes of email addresses and a server-only salt. Failed accepted attempts consume rate budget. These controls bound service usage; they are not bot authentication. A determined attacker can vary an email address, consume the global budget or bypass a honeypot. Apps Script request events do not expose a trustworthy client IP or general request-header API for this design. Public endpoint URLs and claimed origins are not secrets. For higher-volume use, replace or front the receiver with an approved gateway that validates a CAPTCHA and applies durable IP-based rate limits.

The receiver checks the account's remaining mail quota. Google's [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas) vary by account and may change; this application cap does not override account quotas, concurrent execution limits or Drive limits. The implementation serializes requests with [LockService](https://developers.google.com/apps-script/reference/lock/lock-service); concurrent visitors can receive a retry message.

Duplicate references and rate counters retain only timestamps, hashes and send status in Script Properties, with seven-day cleanup on subsequent requests. Raw contributor details are in the emailed XLSX and temporary Sheet, not in these properties. A reference is idempotent within that retention window. If an execution stops after mail is attempted, the saved state prevents automatic repeat sends and asks for manual confirmation. Very rare interruptions before the Sheet ID is captured or during cleanup can leave temporary Drive files; review the dedicated account periodically. Files moved to Trash follow Google's retention policy until permanently deleted. The review inbox retains submitted contact details under the lab's own retention practices; define those practices before public rollout.

No contact information is stored in browser local storage or added to public dataset JSON. The downloaded workbook contains the contributor's contact details; the form discloses this. A visitor's provider handles the manual fallback email. In automatic mode the lab's Google account processes metadata, contact details and the attachment.

## Local verification

From the v1.3 directory:

```sh
node integrations/test-submissions.mjs
```

The test covers client validation, formula-safe OOXML ZIP generation, server validation, fixed-recipient sending, duplicate suppression, error receipts, quota failure and cleanup with mocked Google services. It sends no email and does not prove a live Google deployment works. The final live checks above remain required before enabling the endpoint.

## Remaining owner tasks

- [ ] Create/authorize the lab Google Apps Script project and review its scopes.
- [ ] Decide contact-data retention and who can edit the project/read review mail.
- [ ] Deploy the web app; check organizational access restrictions.
- [ ] Perform the controlled live tests, inspect the actual XLSX attachment and inbox.
- [ ] Add the verified `/exec` URL to `src/submission-config.js` and redeploy GitHub Pages.
- [ ] Add stronger bot protection before expanding beyond this low-volume review workflow.

The metadata field organization was informed by the [OpenConstruction schema guide](https://www.openconstruction.org/schema.html); the page layout, review flow, private contact fields and pavement-specific acquisition fields are independently implemented for this Atlas.
