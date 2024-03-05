import { useLovelaceCard, type HassCardProps } from "create-react-hass-card";
import { useCallback, useEffect, useMemo, useState } from "react";

import { minimatch } from "minimatch";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ha-card": unknown;
      "ha-icon": unknown;
    }
  }
}
function Card({ hass, openDialog, closeDialog, config }: HassCardProps) {
  // config
  const confDebug = !!config?.debug;
  const confIncludes = config?.includes;
  const confExcludes = config?.excludes;
  const confIncludesAttributes = config?.includes_attributes;
  const confExcludesAttributes = config?.excludes_attributes;
  const confIncludesStateRaw = config?.includes_state;

  const confIcon = !!config?.icon && typeof config?.icon === "string" ? config.icon : undefined;
  const confHideIfEmpty = !!config?.hide_empty;
  const confIconEmpty = !!config?.icon_empty && typeof config?.icon_empty === "string" ? config.icon_empty : undefined;
  const confBadgeIconEmpty = config?.badge_icon_empty ?? "mdi:check";
  const confBadgeColor = config?.badge_color;
  const confBadgeColorEmpty = config?.badge_color_empty;
  const confCardColor = config?.card_color;
  const confCardColorEmpty = config?.card_color_empty;
  const confTextColor = config?.text_color;
  const confTextColorEmpty = config?.text_color_empty;
  const confIconColor = config?.icon_color;
  const confIconColorEmpty = config?.icon_color_empty;
  const confNoCard = config?.no_card;

  const confIncludesState = useMemo(
    () =>
      typeof confIncludesStateRaw === "string" || typeof confIncludesStateRaw === "number"
        ? [confIncludesStateRaw]
        : confIncludesStateRaw,
    [confIncludesStateRaw]
  );
  const confExcludesStateRaw = config?.excludes_state;
  const confExcludesState = useMemo(
    () =>
      typeof confExcludesStateRaw === "string" || typeof confExcludesStateRaw === "number"
        ? [confExcludesStateRaw]
        : confExcludesStateRaw,
    [confExcludesStateRaw]
  );
  const states = hass?.states;

  const labelOn = String(config?.title || "") || "Entities Matching";
  const labelOnPlural = String(config?.title_plural || "") || "Entity Matching";
  const labelOff = String(config?.title_empty || "") || "No Entity Matching";

  const matchingEntities = useMemo(
    () =>
      !states
        ? []
        : Object.keys(states)
            .filter((id) => {
              const entity = states[id];
              if (!entity) return false;

              if (Array.isArray(confIncludes) && !confIncludes.some((pattern) => valueMatch(id, pattern))) return false;
              if (Array.isArray(confExcludes) && confExcludes.some((glob) => valueMatch(id, glob))) return false;

              if (confIncludesState && Array.isArray(confIncludesState) && confIncludesState.length) {
                if (!confIncludesState.some((pattern) => valueMatch(entity.state, pattern))) return false;
              }

              if (confExcludesState && Array.isArray(confExcludesState) && confExcludesState.length) {
                if (confExcludesState.some((pattern) => valueMatch(entity.state, pattern))) return false;
              }

              if (confIncludesAttributes && typeof confIncludesAttributes === "object") {
                for (const attr of Object.keys(confIncludesAttributes)) {
                  const val = entity.attributes[attr];
                  const pattern = confIncludesAttributes[attr as keyof typeof confIncludesAttributes];
                  if (!valueMatch(val, pattern)) return false;
                }
              }

              if (confExcludesAttributes && typeof confExcludesAttributes === "object") {
                for (const attr of Object.keys(confExcludesAttributes)) {
                  const val = entity.attributes[attr];
                  const pattern = confExcludesAttributes[attr as keyof typeof confExcludesAttributes];
                  if (valueMatch(val, pattern)) return false;
                }
              }

              return true;
            })
            .map((id) => states[id])
            .sort((a, b) => (b?.last_changed || "").localeCompare(a?.last_changed || ""))
            .filter(Boolean),
    [
      confExcludes,
      confExcludesAttributes,
      confExcludesState,
      confIncludes,
      confIncludesAttributes,
      confIncludesState,
      states,
    ]
  );
  const matchingEntitiesCount = matchingEntities.length;

  if (confDebug) console.log("=>> CARD DEBUG", { matchingEntitiesCount, matchingEntities, config, hass });

  const title = useMemo(
    () => (!matchingEntitiesCount ? labelOff : matchingEntitiesCount === 1 ? labelOn : labelOnPlural),
    [matchingEntitiesCount, labelOff, labelOn, labelOnPlural]
  );
  const matchingEntitiesNames = useMemo(
    () =>
      matchingEntities
        .slice(0, 10)
        .map((e) => e.attributes.friendly_name || e.entity_id)
        .join(", "),
    [matchingEntities]
  );

  const matchingEntitiesCard = useLovelaceCard("entities", hass, {
    entities: matchingEntities.map((e) => ({
      entity: e?.entity_id,
      secondary_info: "last-changed",
    })),
  });

  const openEntitiesDialog = useCallback(() => {
    openDialog({
      title: title,
      content: matchingEntitiesCard,
    }).then(() => {
      setOpenDetails(false);
    });
  }, [matchingEntitiesCard, openDialog, title]);

  const [openDetails, setOpenDetails] = useState(false);
  const handleOpenEntities = useCallback(
    () => !!matchingEntitiesCount && setOpenDetails(true),
    [matchingEntitiesCount]
  );

  useEffect(() => {
    if (openDetails && matchingEntitiesCount) openEntitiesDialog();
    else closeDialog();
  }, [closeDialog, matchingEntitiesCount, openDetails, openEntitiesDialog]);

  const counter = useMemo(
    () =>
      matchingEntitiesCount || !confBadgeIconEmpty ? (
        <span style={{ lineHeight: 1, padding: 0, margin: 0 }}>{matchingEntitiesCount}</span>
      ) : (
        <ha-icon icon={confBadgeIconEmpty} />
      ),
    [confBadgeIconEmpty, matchingEntitiesCount]
  );

  if (confHideIfEmpty && !matchingEntitiesCount) return null;
  const content = (
    <>
      <div
        className="card-content"
        onClick={handleOpenEntities}
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 15,
          minHeight: 45,
          flexGrow: 2,
          cursor: matchingEntities.length ? "pointer" : "default",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            minWidth: 40,
            textAlign: "center",
            fontSize: 40,
            lineHeight: 1,
            paddingLeft: 5,
            position: "relative",
          }}
        >
          {confIcon && (
            <>
              <div
                className="icon"
                style={{
                  //@ts-expect-error unknown prop
                  "--mdc-icon-size": "40px",
                  "--icon-primary-color": matchingEntitiesCount ? confIconColor : confIconColorEmpty,
                }}
              >
                <ha-icon icon={matchingEntitiesCount ? confIcon : confIconEmpty || confIcon} />
              </div>
              <div
                className="counter"
                style={{
                  position: "absolute",
                  top: "-6px",
                  left: "-3px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: matchingEntitiesCount
                    ? String(confBadgeColor || "") || "var(--error-color, red)"
                    : String(confBadgeColorEmpty || "") || "var(--success-color, green)",
                  color: "white",
                  borderRadius: "14px",
                  width: "21px",
                  height: "21px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  //@ts-expect-error unknown prop
                  "--mdc-icon-size": "15px",
                }}
              >
                {counter}
              </div>
            </>
          )}
          {!confIcon && counter}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, justifyContent: "center" }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{title}</span>
          {!!matchingEntitiesNames && (
            <span
              style={{
                opacity: 0.57,
                fontSize: "93%",
                lineHeight: 1,
                overflow: "hidden",
                WebkitLineClamp: 1,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
              }}
            >
              {matchingEntitiesNames}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (confNoCard) return content;
  return (
    <ha-card
      style={{
        "--ha-card-background": matchingEntitiesCount ? confCardColor : confCardColorEmpty,
        "--primary-text-color": matchingEntitiesCount ? confTextColor : confTextColorEmpty,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {content}
    </ha-card>
  );
}

export default Card;

function valueMatch(value: unknown, pattern: unknown) {
  // blob
  if (typeof pattern === "string") return minimatch(String(value), pattern);

  //operators
  if (Array.isArray(pattern) && pattern.length === 2) {
    const op = pattern[0];
    const val = pattern[1];
    if (op === "gt") return parseFloat(String(value)) > parseFloat(val);
    if (op === "gte") return parseFloat(String(value)) >= parseFloat(val);
    if (op === "lt") return parseFloat(String(value)) < parseFloat(val);
    if (op === "lte") return parseFloat(String(value)) <= parseFloat(val);
    if (op === "ne") return !minimatch(String(value), val);
    if (op === "in" && Array.isArray(val)) return val.some((it) => minimatch(String(value), it));
    if (op === "nin" && Array.isArray(val)) return !val.some((it) => minimatch(String(value), it));
  }

  //strict
  return value === pattern;
}
