# Unit Seeding

- **Families**: length, area, weight, angle, dimensionless (no units)
- **Canonical keys**: ASCII-safe (e.g. "um", "mm2", "deg")
- **Display symbols**: human (e.g. "µm", "mm²", "°")
- **Uses UPSERTs** so re-running is safe.

## Assumptions

- `unitFamily`: `{ id, key, label }`
- `unit`: `{ id, familyId, key, symbol, scale }`
  - where `scale` converts display-unit -> family SI-base.
