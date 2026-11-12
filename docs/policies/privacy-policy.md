# Privacy policy

**Status:** implementation-grounded draft; not ready for publication
**Version:** 1.0
**Last reviewed:** 2026-11-12

> The service operator must complete the highlighted operational details and obtain jurisdiction-specific legal review before presenting this as a final policy. This document describes the current codebase; it is not legal advice.

## Who operates the service

The legal name, business address, privacy contact, applicable jurisdiction, and any required data protection officer are not identified in this repository. The operator must add those details before publication.

## Information the service uses

When an account is registered, the service receives a username, email address, and password. Passwords are hashed with bcrypt before being saved. The service also stores account status and timestamps, and temporary email-verification and password-reset tokens needed to complete those flows.

The service creates an authentication session containing the account ID, a session identifier, expiry, and revocation state. It does not currently populate or store IP-address or user-agent values in new session records.

If you publish a project or event, the service stores the fields you submit: project name, description, and portfolio URL; or event name, location, theme, and time. Public feeds are available to visitors who are not signed in, so treat published content as public.

The browser uses local storage for the signed-in user summary, access token, session identifier, session messages, and the acknowledgement of the storage notice. These values remain on the device until cleared by the service, the user, or the browser. Clearing them signs the user out locally.

The application has audit logging for selected operations. The operator must confirm the production log fields, access controls, retention period, and deletion process before publication.

## Why information is used

The application uses account information to create accounts, verify email addresses, authenticate users, maintain sessions, and send password-reset messages. User-submitted projects and events power the public community feeds. Selected operational records support account security, moderation, and administration.

The current application code does not include advertising or analytics integrations, a marketing opt-in, or a payment/checkout flow.

## Service providers and disclosures

The application is configured to use MongoDB, an email delivery service, and a hosting provider. The specific production providers, their locations, applicable contracts, and any international transfers depend on deployment configuration and must be listed by the operator before publication. Do not put credentials or connection strings in this policy.

The application code contains no advertising or analytics sharing. This statement does not describe independent logs that a hosting, database, or email provider may keep under its own terms.

## Retention and deletion

Email-verification tokens expire after 24 hours; password-reset tokens are intended to expire after 15 minutes; session expiry is configuration-dependent. The service does not define a complete retention schedule for accounts, published content, audit records, backups, or provider logs. The operator must set and document those periods.

There is no self-service account-deletion flow. The current administrator deletion endpoint removes the account record but does not provide a complete cascade for related content and session records. The operator must establish a contact and a reliable request-handling and deletion process before promising erasure.

## Your choices and rights

Depending on applicable law, you may have rights to access, correct, delete, restrict, or receive information about personal data. The operator must add a working contact method and explain how to make a request, how identity is verified, and how requests are handled within applicable deadlines.

Users can sign out to clear local authentication data. Browser storage can also be cleared in browser settings; doing so ends the local signed-in state.

## Children and age eligibility

The planned product rule is that accounts are for people aged 16 or older. The application does not request a date of birth. A self-attestation is not independent age verification and is not a parental-consent process. The operator must review the age threshold and safeguards for each jurisdiction and provide an underage-account reporting and removal process before launch.

## Security

The code hashes account passwords and uses expiring authentication and recovery tokens. No online service can guarantee absolute security. The operator must document production access controls, backups, incident response, and provider safeguards separately.

## Changes and contact

The operator should publish a new version and record when material changes take effect. Add the operator's legal identity, privacy email or address, applicable jurisdiction, production service providers, retention schedule, and request process before treating this draft as final.
