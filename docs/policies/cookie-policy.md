# Cookie and browser storage policy

**Status:** implementation-grounded draft; review on deployment
**Version:** 1.0
**Last reviewed:** 2026-11-12

> This describes the current application code. The operator must check hosting, API, and provider behavior in production and obtain jurisdiction-specific legal review before publication.

## Cookies

The application code does not set HTTP cookies and does not include advertising or analytics cookies. It therefore does not present accept/reject controls for optional cookies that the service does not currently use.

## Essential browser storage

When a user signs in, the browser stores a user summary, authentication token, and session identifier in local storage so the application can maintain the signed-in state. The application also stores session messages and whether the user has dismissed the storage notice. These values are not cookies, but they are information stored on the device.

Authentication storage is needed for signed-in features. Clearing it in browser settings signs the user out locally. The app does not currently provide a control to sign in while refusing this required storage.

## Third-party and deployment behavior

The frontend no longer requests fonts from an external font service. Hosting, API, email, or other deployment providers may have their own storage and logging behavior; the operator must verify and disclose that behavior and any provider cookies before launch.

## Changes

If optional analytics, advertising, or other non-essential device storage is introduced, the operator must update this policy and add a real, accessible opt-in choice before enabling it where required by law. Do not label an informational dismissal as consent to optional tracking.
