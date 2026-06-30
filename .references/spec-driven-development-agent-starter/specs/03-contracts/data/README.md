# Data Contracts

Describe persistent data at a system boundary. This is not a dump of ORM classes.

Each data contract must state:
- owning bounded context/system of record;
- logical schema and invariants;
- identifier strategy;
- mutation authority;
- validation and referential rules;
- retention/archive/delete policy;
- access controls and classification;
- migration compatibility;
- indexes/partitioning only when justified by a current access pattern.

Link implementation migrations and schema files from the contract instead of duplicating them.
