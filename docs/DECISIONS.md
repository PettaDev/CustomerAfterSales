# Architecture decisions
ADR-001: Local Node.js Support Bridge instead of direct browser ADB. Cloud cannot access customer's USB.
ADR-002: Customer Case and Capture Session are separate entities.
ADR-003: One case may contain multiple capture sessions.
ADR-004: Preserve source React/TypeScript/Vite organization and guides; use Node.js Express for server.
ADR-005: Platform selects logger; brand only selects presentation.
ADR-006: Preserve manual YLog confirmations until real commands are validated.
ADR-007: Private object upload is independent from collection; never lose local evidence on transfer failure.
ADR-008: PostgreSQL + S3-compatible production interfaces; SQLite/disk restricted to local development.
ADR-009: Initial staff auth is a configured account with scrypt and expiring server session; no hardcoded credentials. Multi-user enterprise auth is future work.
ADR-010: Native scrcpy window replaces WPF embedding; consumer interface uses plain-language mirror labels.
ADR-011: New portal ships PT-BR initially; original guide retains seven languages. No automatic attribution to other developers or tools.
