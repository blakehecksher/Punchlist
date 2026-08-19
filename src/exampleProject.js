/**
 * The example punch list a first-time user lands in.
 *
 * It is a real project record, editable and isolated: importing an outline
 * over it creates a separate personal project instead of writing here. Item
 * state is carried by the descriptions' own markup — one underlined, one bold,
 * one struck — so the conventions still read after a reload.
 *
 * Bump EXAMPLE_VERSION whenever the fixture changes so existing example
 * projects refresh instead of showing a stale copy.
 */

import { DEFAULT_LAYOUT } from "./layout.js";
import { getCurrentDateLabel, makeBlankProjectData } from "./projectData.js";

export const EXAMPLE_VERSION = 3;

export const STARTER_OUTLINE = `- Site Conditions
    - Protect finished flooring through the final walkthrough
    - Maintain dust protection at occupied areas
- General Notes
    - Clean work areas and remove construction debris
    - Match adjacent paint sheen at touch-up locations
- Kitchen 102
    - Adjust cabinet reveal
    - Touch up paint at window return
- Study 410
    - Install door stop
    - Tighten hinge screws
- Living Room 201
    - Caulk baseboard at east wall
    - Touch up paint at built-in
- Primary Bedroom 301
    - Adjust closet door alignment
    - Reinstall towel bar
- Bathroom 302
    - Replace cracked tile at niche
    - Clean grout at shower floor
- Hall 2nd Floor
    - Patch and paint wall at railing
- Exterior
    - Seal around window trim
    - Touch up siding at south corner`;

function makeExampleEntries(prefix, entries) {
  return entries.map((description, index) => ({
    id: `${prefix}-${index + 1}`,
    issueSeq: index + 1,
    description,
    photo: null,
    photoPosition: null,
  }));
}

function makeExampleRoom(id, name, entries) {
  return {
    id,
    name,
    nextItemIssueSeq: entries.length + 1,
    items: makeExampleEntries(id, entries),
  };
}

export const EXAMPLE_PROJECT = {
  ...makeBlankProjectData(),
  nextGeneralIssueSeq: 5,
  siteConditions: [
    "Example condition: final painting touch-ups are in progress",
    "Example condition: flooring protection remains in place in main hall",
    "Example condition: millwork adjustments are ongoing",
    "Example condition: electrical trim-out is still underway",
  ],
  generalNotes: [
    {
      id: "gn1",
      issueSeq: 1,
      description:
        "Example note 01: verify final paint touch-up at all visible corners.",
      photo: null,
      photoPosition: null,
    },
    {
      id: "gn2",
      issueSeq: 2,
      description:
        "Example note 02: confirm hardware finish is consistent throughout.",
      photo: null,
      photoPosition: null,
    },
    {
      id: "gn3",
      issueSeq: 3,
      description:
        "Example note 03: clean glass, mirrors, and adjacent trim before turnover.",
      photo: null,
      photoPosition: null,
    },
    {
      id: "gn4",
      issueSeq: 4,
      description:
        "Example note 04: review all control locations for alignment and labeling.",
      photo: null,
      photoPosition: null,
    },
  ],
  rooms: [
    {
      id: "r101",
      name: "101  Entry Hall",
      nextItemIssueSeq: 3,
      items: [
        {
          id: "r101_1",
          issueSeq: 1,
          description: "Example item: touch up paint at door frame corners.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r101_2",
          issueSeq: 2,
          description:
            "Example item: align cover plates vertically with adjacent trim.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r102",
      name: "102  Kitchen",
      nextItemIssueSeq: 4,
      items: [
        {
          id: "r102_1",
          issueSeq: 1,
          description:
            "Example item: adjust cabinet reveal for consistent gap.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r102_2",
          issueSeq: 2,
          description:
            "Example item: clean stone backsplash and sealant joints.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r102_3",
          issueSeq: 3,
          description:
            "Example item: verify appliance panel alignment after final install.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r103",
      name: "103  Pantry",
      nextItemIssueSeq: 2,
      items: [
        {
          id: "r103_1",
          issueSeq: 1,
          description:
            "Example item: patch and paint shelf support touch-up locations.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r104",
      name: "104  Living Room",
      nextItemIssueSeq: 3,
      items: [
        {
          id: "r104_1",
          issueSeq: 1,
          description:
            "Example item: repair minor wall blemish at window return.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r104_2",
          issueSeq: 2,
          description:
            "Example item: confirm grille finish matches adjacent ceiling paint.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r105",
      name: "105  Bedroom",
      nextItemIssueSeq: 2,
      items: [
        {
          id: "r105_1",
          issueSeq: 1,
          description: "Example item: adjust closet doors for even spacing.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
    {
      id: "r106",
      name: "106  Bath",
      nextItemIssueSeq: 3,
      items: [
        {
          id: "r106_1",
          issueSeq: 1,
          description: "Example item: verify fixture trim is installed level.",
          photo: null,
          photoPosition: null,
        },
        {
          id: "r106_2",
          issueSeq: 2,
          description: "Example item: clean mirror edges and adjacent sealant.",
          photo: null,
          photoPosition: null,
        },
      ],
    },
  ],
  // Keep the historical sample above as a development reference. The final
  // overrides below are the polished practice project shown to first-time
  // users, with enough sections and rooms to demonstrate a real document.
  ...{
    ...makeBlankProjectData(),
    isExample: true,
    exampleVersion: EXAMPLE_VERSION,
    project: "184 Cedar Avenue",
    projectNum: "PL-001",
    firm: "Northline Studio",
    punchlistDate: "August 5, 2026 · 9:00 AM",
    layout: { ...DEFAULT_LAYOUT, showSummary: false },
    siteConditions: [
      "Protect finished flooring through the final walkthrough.",
      "Maintain dust protection at occupied areas.",
      "Coordinate access with the superintendent before 8:00 AM.",
    ],
    nextGeneralIssueSeq: 4,
    generalNotes: makeExampleEntries("example-general", [
      "Clean work areas and remove construction debris before final review.",
      "<b>Match adjacent paint sheen at all touch-up locations.</b>",
      "Verify hardware operation after all adjustments are complete.",
    ]),
    rooms: [
      makeExampleRoom("example-kitchen", "Kitchen 102", [
        "Adjust cabinet reveal for a consistent gap.",
        "Touch up paint at the window return.",
        "Seal the countertop-to-backsplash joint.",
      ]),
      makeExampleRoom("example-study", "Study 410", [
        "<s>Install door stop.</s>",
        "Tighten hinge screws at the entry door.",
      ]),
      makeExampleRoom("example-living", "Living Room 201", [
        "<u>Caulk the baseboard joint at the east wall.</u>",
        "Touch up paint at the built-in shelves.",
      ]),
      makeExampleRoom("example-bedroom", "Primary Bedroom 301", [
        "Adjust closet doors for even alignment.",
        "Reinstall the towel bar at the dressing area.",
      ]),
      makeExampleRoom("example-bathroom", "Bathroom 302", [
        "Replace the cracked tile at the shower niche.",
        "Clean grout haze at the shower floor.",
      ]),
      makeExampleRoom("example-exterior", "Exterior", [
        "Seal around the south window trim.",
        "Touch up siding at the southeast corner.",
      ]),
    ],
  },
};

export function refreshExampleFixture(stored) {
  if (!stored?.isExample || stored.exampleVersion === EXAMPLE_VERSION) {
    return stored;
  }

  return {
    ...EXAMPLE_PROJECT,
    date: getCurrentDateLabel(),
  };
}
