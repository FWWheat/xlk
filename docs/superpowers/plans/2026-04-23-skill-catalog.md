# Skill Catalog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone skill catalog page to the existing pet encyclopedia, with skill aggregation, filtering, keyword search, sorting, expandable detail panels, and owner links back to pet detail pages.

**Architecture:** Keep the site fully static and reuse the existing `load-pets.js` and pet data files. Build the skill catalog on the client by aggregating all pets' `skills` arrays into a derived skill list keyed by skill name, then render filters, cards, and an expandable detail panel from that derived state.

**Tech Stack:** HTML, CSS, vanilla JavaScript, existing static data files in `pet/data/`

---

## Chunk 1: File Map And Shared Navigation

### Task 1: Map touched files and create the new page entry

**Files:**
- Create: `pet/skills.html`
- Create: `pet/skills.js`
- Modify: `pet/index.html`
- Modify: `pet/detail.html`
- Modify: `pet/weakness.html`

- [ ] **Step 1: Create the standalone page shell**

Add a new `skills.html` page with:
- the shared top navigation
- a search and filter toolbar container
- a skill results grid
- an expandable detail panel container
- the shared footer

- [ ] **Step 2: Add a `技能图鉴` entry to shared navigation**

Update the top menu in:
- `pet/index.html`
- `pet/detail.html`
- `pet/weakness.html`
- `pet/skills.html`

Expected behavior:
- users can move between pet catalog, skill catalog, and weakness page

- [ ] **Step 3: Keep asset paths consistent**

Normalize icon/logo paths on the updated pages so the new page and existing pages resolve assets correctly from the same relative root.

## Chunk 2: Skill Aggregation And Query State

### Task 2: Build aggregated skill data in `pet/skills.js`

**Files:**
- Create: `pet/skills.js`

- [ ] **Step 1: Load all pet records into one array**

Use the existing global arrays:

```js
const petList = [
  ...petList1, ...petList2, ...petList3, ...petList4, ...petList5,
  ...petList6, ...petList7, ...petList8, ...petList9, ...petList10,
  ...petList11, ...petList12, ...petList13, ...petList14, ...petList15,
  ...petList16, ...petList17, ...petList18, ...petList19, ...petList20
];
```

- [ ] **Step 2: Aggregate skills by skill name**

Build a derived list where each item stores:

```js
{
  name,
  element,
  type,
  power,
  cost,
  desc,
  ownerCount,
  owners,
  variants,
  hasVariants,
  isUniversal
}
```

Rules:
- merge by `name`
- choose the most common `(element, type, power, cost, desc)` tuple as the primary display record
- mark `hasVariants` when multiple tuples exist
- mark `isUniversal` when `ownerCount === petList.length`

- [ ] **Step 3: Build filter option sets**

Create unique sorted lists for:
- elements
- types
- power values
- cost values

- [ ] **Step 4: Create query state**

Track:

```js
let currentFilters = {
  keyword: "",
  element: "全部",
  type: "全部",
  power: "全部",
  cost: "全部"
};

let currentSort = "default";
let expandedSkillName = null;
```

## Chunk 3: Skill Catalog UI

### Task 3: Render filters, sorting, cards, and expandable details

**Files:**
- Create: `pet/skills.html`
- Create: `pet/skills.js`
- Modify: `pet/style.css`

- [ ] **Step 1: Render the query controls**

Add:
- keyword search input
- element filter buttons
- type select
- power select
- cost select
- sort buttons for `power_desc` and `cost_desc`

- [ ] **Step 2: Implement filtering logic**

Apply all active conditions as an intersection:

```js
const filtered = skills.filter(skill => {
  const keyword = currentFilters.keyword.trim().toLowerCase();
  const matchesKeyword =
    !keyword ||
    (skill.desc || "").toLowerCase().includes(keyword) ||
    skill.name.toLowerCase().includes(keyword);

  return matchesKeyword &&
    (currentFilters.element === "全部" || skill.element === currentFilters.element) &&
    (currentFilters.type === "全部" || skill.type === currentFilters.type) &&
    (currentFilters.power === "全部" || String(skill.power) === currentFilters.power) &&
    (currentFilters.cost === "全部" || String(skill.cost) === currentFilters.cost);
});
```

- [ ] **Step 3: Implement sorting logic**

Support:
- default order
- power descending
- cost descending

- [ ] **Step 4: Render skill cards**

Each card should show:
- icon
- name
- element
- type
- power
- cost
- short description
- owner count

- [ ] **Step 5: Render an expandable detail panel**

When a card is clicked:
- expand that skill's full details
- show a variant warning if needed
- show either:
  - owner cards linking to `detail.html?id=<id>`
  - or a universal-skill summary instead of the full owner list

- [ ] **Step 6: Render empty states**

If no skills match, show a clear empty message and hide the detail panel.

## Chunk 4: Styling

### Task 4: Extend `pet/style.css` for the new page

**Files:**
- Modify: `pet/style.css`

- [ ] **Step 1: Add search/filter control styles**

Create styles for:
- toolbar wrappers
- search input
- selects
- active states

- [ ] **Step 2: Add skill catalog card styles**

Create styles for:
- skill grid
- skill cards
- summary rows
- owner count badge

- [ ] **Step 3: Add expandable detail styles**

Create styles for:
- detail panel shell
- metadata chips
- variant warning
- owner card grid
- universal summary message
- empty state

- [ ] **Step 4: Add responsive layout rules**

Ensure the page works on mobile:
- stack filter controls vertically when narrow
- switch owner grid and card layout to one column on small screens

## Chunk 5: Verification

### Task 5: Run local checks

**Files:**
- Test: `pet/skills.html`
- Test: `pet/skills.js`
- Test: `pet/style.css`
- Test: `pet/index.html`
- Test: `pet/detail.html`
- Test: `pet/weakness.html`

- [ ] **Step 1: Check HTML references**

Run:

```bash
rg -n "skills.html|skills.js|技能图鉴" pet
```

Expected:
- new page is referenced where expected
- navigation includes the new entry

- [ ] **Step 2: Validate the aggregation logic in Node**

Run a small local script that loads pet data, aggregates skills, and prints counts for:
- total pets
- total aggregated skills
- universal skills
- variant skills

Expected:
- counts are non-zero and internally consistent

- [ ] **Step 3: Sanity-check filtering and sorting functions**

Run a local script that simulates:
- keyword search
- element filter
- type filter
- power sort
- cost sort

Expected:
- results change as expected for each condition

- [ ] **Step 4: Review final git diff**

Run:

```bash
git diff -- pet/index.html pet/detail.html pet/weakness.html pet/skills.html pet/skills.js pet/style.css
```

Expected:
- changes are limited to the intended feature

