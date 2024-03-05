# ha-matching-entities-card

A Home Assistant Lovelace card counting & listing matching entities.

## Purposes

- Having a summary of simple lookup of matching entities: lights being on, open doors, cold rooms...
- Usage example of the [create-react-hass-card](https://www.npmjs.com/package/create-react-hass-card) tool I've created, to help React Developers create Home Assistant Lovelace cards

## Usage Example

```yaml
type: custom:ha-matching-entities
title: Light On
title_plural: Lights On
title_empty: All lights are off
icon: mdi:lightbulb-multiple
icon_color_empty: "#ccc"
badge_color: var(--label-badge-yellow)
includes_state: "on"
excludes_attributes:
  is_hue_group: true
includes:
  - light.*
  - input_boolean.kitchen_hood_light
excludes:
  - light.hue_go_1
  - light.hue_go_2
  - light.hue_play_1
  - light.hue_play_2
  - light.stairs_1
```
