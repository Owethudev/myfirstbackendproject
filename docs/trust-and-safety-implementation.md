# Privacy, trust, and accessibility implementation notes

**Reviewed:** 2026-11-12

This note explains the requested product and code changes and the assumptions that still require operator review. It is not legal advice and does not certify legal compliance.

## Policies

- [Privacy Policy](policies/privacy-policy.md): documents registration data, hashed passwords, verification/reset flows, public posts and events, browser storage, and the operational details that still need to be supplied.
- [Terms of Service](policies/terms-of-service.md): describes account eligibility, public contributions, acceptable use, moderation, and the current payment status.
- [Refund Policy](policies/refund-policy.md): the current code has no checkout, paid subscription, or in-app payment integration, so no in-app purchases are currently refundable. A paid flow must not launch until pricing, cancellation, refunds, and support are disclosed.
- [Cookie and Browser Storage Policy](policies/cookie-policy.md): the code does not set HTTP, analytics, or advertising cookies. It uses local storage for signed-in session state and the storage-notice acknowledgement.

All policy documents are implementation-grounded drafts. Before publication, the operator must add its legal identity, contact details, jurisdiction, production providers and locations, retention periods, and applicable user-request processes, then obtain jurisdiction-specific legal review.

## Consent and age eligibility

New registrations require unchecked-by-default acknowledgements for the Terms of Service and Privacy Policy and an unchecked-by-default statement that the user is at least 16. The backend validates these values rather than trusting browser-only checks. It records policy versions and timestamps in an optional embedded user subdocument; admin user-list responses omit those fields.

The app does not collect a date of birth. A self-attestation is not age verification or parental consent. Existing accounts are not prompted to reconfirm age or accept the new policy versions by this change. The operator must review the minimum age by jurisdiction and establish a process for underage-account reports and removal.

## Data minimization

Account fields remain limited to the username, email, password, and state required by authentication and verification. Project and event fields correspond to the content the user publishes. Session creation no longer accepts or writes unused IP-address and user-agent values. The session schema change prevents new writes; it does not erase any legacy values already present in stored documents.

The frontend no longer requests fonts from an external font service. Authentication still uses local storage for the user summary, token, and session identifier; clearing these values signs the user out.

## Cookies and dark-pattern review

No optional analytics or advertising cookies are present, so the banner is an informational storage notice with a dismiss action, not an accept/reject choice for non-existent tracking. If optional tracking is added later, it must remain off until a real, accessible opt-in is provided where required.

The signup legal and age checkboxes are not preselected. Guest browsing remains available. The ambiguous “By continuing, you agree” copy was removed, and the current absence of in-app checkout or subscriptions is stated plainly. No payment or purchase flow exists in the inspected code; pricing and any mandatory charges must be shown before a future purchase is confirmed.

## Claims and image alternatives

The README no longer calls authentication “secure” or claims the backend is “scalable” without evidence. Current logo images are decorative and already carry empty `alt` text, while the orbital visual is hidden from assistive technology. A test guards against missing `alt` attributes; meaningful images added later need descriptive alternatives.

## Keyboard navigation

The app now has a skip-to-main-content link; search and profile controls expose expanded state and controlled elements; the profile drawer receives focus on open, traps Tab navigation, closes on Escape, and returns focus to its trigger. The moving community list can be paused with keyboard focus, and duplicated names are hidden from assistive technology.

## Remaining operator work

1. Complete and legally review the policy drafts for every service jurisdiction.
2. Confirm production hosting, database, email, logging, backup, and retention behavior; update disclosures if they differ from the code inventory.
3. Define a reliable data-access and deletion request process, including related content, session records, backups, and provider copies.
4. Confirm the age threshold and safeguarding process; the registration check is a self-attestation only.
5. Reassess the refund policy and checkout disclosures before enabling any paid feature.
