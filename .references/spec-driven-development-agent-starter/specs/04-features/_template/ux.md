---
id: F-###-UX
title: <feature UX and state contract>
status: draft
owner: <design/feature owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [F-###]
supersedes: []
---

# UX Contract — F-###

Create this file only for user-visible behaviour.

## User journey

```text
<Entry point> → <state/action> → <result>
```

## Screens / surfaces

| Surface | User goal | Required elements | Forbidden/misleading elements |
| --- | --- | --- | --- |
| `<route/dialog/panel>` | `<goal>` | `<elements>` | `<elements>` |

## UI states

| State | Trigger | Must show | Available actions | Accessibility notes |
| --- | --- | --- | --- | --- |
| Loading | `<trigger>` | `<feedback>` | `<actions>` | `<focus/live region>` |
| Empty | `<trigger>` | `<guidance>` | `<action>` | `<notes>` |
| Error | `<trigger>` | `<safe actionable message>` | `<retry/support>` | `<notes>` |
| Success | `<trigger>` | `<confirmation>` | `<next actions>` | `<notes>` |

## API/state dependencies

| UI state | Required data | API/state source | Failure mapping |
| --- | --- | --- | --- |
| `<state>` | `<data>` | `<contract>` | `<error UX>` |

## Visual/design constraints

- `<design system/component rules>`
- `<responsive requirements>`
