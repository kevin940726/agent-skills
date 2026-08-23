---
name: security-review
description: Before merging or shipping a branch, scan the current diff for security vulnerabilities (leaked secrets, injection, broken access control, XSS, insecure dependencies). Load this skill for any PR, commit, or code you are about to merge or review; return a cited findings table with severity and a concrete fix. For CVEs and current guidance, fetch the latest sources first (web-first).
---

# Security review before merge

Load this skill when a branch is about to merge, a PR is open, or you have written code that
handles data, auth, or network calls. The goal is to catch vulnerabilities before they ship,
not to comment on style. A clean diff that still leaks a token or trusts user input is a
breach waiting to happen.

This is a trust gate. Treat every finding as something a real attacker would try first.

## When to run
- Before merging any branch with logic that touches auth, data, or the network.
- When reviewing a PR someone else opened.
- After adding or upgrading a dependency (check it for known CVEs).
- When the code handles secrets, user input, file uploads, or payments.

## What to check
Walk the diff against this list. Each item is a class of bug, not a style nit:

- **Secrets in the tree.** API keys, tokens, private keys, `.env` with real values, bearer strings in source or logs. Flag any credential committed by accident.
- **Injection.** SQL/NoSQL/OS command built by string concatenation or unescaped interpolation of user input. Prefer parameterized queries and allowlists.
- **Broken access control.** A route or resolver that trusts a client-supplied id, role, or tenant without server-side checks. Look for missing authorization next to authentication.
- **XSS and output encoding.** User input rendered into HTML, Markdown, or a template without encoding or a sanitizer.
- **Insecure deserialization or eval.** `eval`, `pickle.load`, `yaml.load` (unsafe), or untrusted input pushed into code paths.
- **Weak crypto.** MD5/SHA1 for passwords, hardcoded IVs, ECB mode, home-grown schemes.
- **Dependency risk.** New or bumped packages with known CVEs, or packages from untrusted sources. For current CVE data, search the web (see below).

## How to report
Always return a compact findings table:

| Severity | Location (file:line) | Issue | Fix | Source |
|----------|----------------------|-------|-----|--------|
| High | `api/users.ts:42` | SQL built by string concat | Parameterize the query | [OWASP SQLi](https://owasp.org) |
| Med | `conf.ts:9` | AWS key committed | Rotate and move to secret store | [OWASP Secrets](https://owasp.org) |

Column rules:
- **Severity:** High (exploitable now, data or secret exposure), Med (needs a condition), Low (hardening).
- **Location:** exact file and line so the fix is one jump away.
- **Fix:** the concrete change, not "improve security".
- **Source:** a real, clickable reference (OWASP, CWE, a CVE page, or a `web-first` search result).

## Use web-first for current truth
For CVEs, dependency risk, and "is this still the right control" questions, search the web
before asserting (load `web-first`). Cite the advisory or release note in the Source column.
Do not rely on training memory for what is exploitable this month.

## Gate the merge
End with a verdict: **safe to merge**, **merge after fixes**, or **block**. State the highest
severity found and the one action that closes it. Keep the report to vulnerabilities only;
style comments belong in `code-review`.
