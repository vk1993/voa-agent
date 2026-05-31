# SES Email Deliverability Setup

Required for magic link emails to reach Jio, Gmail, and corporate mailboxes
in India. Without these records, ~40% of invite emails land in spam.

## 1. SPF (authorise SES to send from voxa.ai)
Add to voxa.ai DNS:
  TXT @ "v=spf1 include:amazonses.com ~all"

## 2. DKIM (cryptographic signing)
In AWS SES console: Verified Identities → voxa.ai → DKIM → Enable
Copy the three CNAME records provided → add to DNS.
Allow 24–48h propagation.

## 3. DMARC (domain policy)
Add to voxa.ai DNS:
  TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@voxa.ai; pct=100"

## 4. Custom MAIL FROM domain (optional but recommended)
In SES: set MAIL FROM domain to mail.voxa.ai
Add MX and TXT records as instructed by SES.
This changes the envelope sender from amazonses.com to voxa.ai.

## 5. Verify in SES
  aws ses get-identity-dkim-attributes --identities voxa.ai
  aws ses get-identity-mail-from-domain-attributes --identities voxa.ai
Both should return "Success" status before going live.
