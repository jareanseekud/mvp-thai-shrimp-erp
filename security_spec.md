# Security Specification for Thai Shrimp ERP MVP

## 1. Data Invariants
1. A WaterLog, FeedingLog, or Treatment cannot exist without a valid pondId and farmId.
2. A pond can have only one active CultureCycle at a time.
3. HarvestLot (HV-) can only be created if the withdrawal period has passed or withdrawalPassed is explicitly verified.
4. Public users can only read specific non-sensitive traceability data consented by the farm owner.
5. Audit logs are append-only.
6. A closed CultureCycle cannot be altered except by the farm owner with an audit log record.

## 2. Dirty Dozen Threat Vectors
1. Spoofed Role: A technician user attempts to grant themselves 'admin' or 'owner' role.
2. Orphaned Water Log: Creating a water quality entry without farmId or pondId.
3. Unverified Harvest: Creating an HV- lot while withdrawal days are still active.
4. Illegal Status Jump: Changing a cycle status from 'closed' back to 'active' without owner credentials.
5. Feed Denial-of-Wallet: Injecting an oversized 500KB text payload into feeding logs.
6. Processing Spoof: Creating a PR- lot with non-existent HV- lot reference.
7. Public Data Leak: Public unauthenticated actor reading internal cost, financial, or treatment records.
8. Altering Historic Water Quality: Modifying past water logs without audit trail.
9. Ghost Field Injection: Writing unrecognized admin keys into farm settings.
10. Member Impersonation: Injecting foreign userId into audit_logs.
11. Extreme Numeric Injection: Writing negative DO or pH > 14 to corrupt calculations.
12. Cross-Farm Access: Technician from Farm A modifying ponds of Farm B.

## 3. Mitigations
- Rules use role checks, path variable validations, and explicit schema constraints.
- Pre-harvest gate verified at both frontend and rule/contract level.
