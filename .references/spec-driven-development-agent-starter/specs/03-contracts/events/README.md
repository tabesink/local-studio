# Event and Message Contracts

Store event schemas and delivery semantics here.

Each event document must define:
- event name and version;
- producer and known consumers;
- trigger/business meaning;
- schema and required fields;
- partition/order expectation;
- delivery guarantee;
- deduplication/idempotency key;
- retry, dead-letter, or failure treatment;
- privacy/classification;
- retention and replay policy.

Do not use an event merely to hide an undocumented synchronous dependency.
