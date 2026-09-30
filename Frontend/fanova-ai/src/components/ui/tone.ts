/**
 * The two surfaces of the redesign (docs/redesign/DECISIONS.md): the indigo main background and
 * the ivory paper areas. Every shared component that picks colors takes one of these, so a section
 * passes the same tone down to its title, rules, cards and markers.
 */
export type Tone = "indigo" | "paper";
