(function () {
  const ALL = "\u5168\u90e8";
  const SOURCE_META = {
    bloodline: {
      label: "\u8840\u8109",
      className: "is-bloodline"
    },
    own: {
      label: "\u81ea\u5e26",
      className: "is-own"
    },
    skillStone: {
      label: "\u6280\u80fd\u77f3",
      className: "is-skill-stone"
    }
  };

  const petList = (window.worldPetList && window.worldPetList.length)
    ? window.worldPetList
    : [
      ...petList1, ...petList2, ...petList3, ...petList4, ...petList5,
      ...petList6, ...petList7, ...petList8, ...petList9, ...petList10,
      ...petList11, ...petList12, ...petList13, ...petList14, ...petList15,
      ...petList16, ...petList17, ...petList18, ...petList19, ...petList20
    ];
  const DETAIL_OWNER_STAGE_CODES = new Set(["final", "boss_evolution"]);
  const detailOwnerPetCount = petList.filter(isDetailDisplayPet).length;
  const skillWeaknessTable = window.worldWeaknessTable || (typeof weaknessTable !== "undefined" ? weaknessTable : {});

  const state = {
    filters: {
      keyword: "",
      element: ALL,
      type: ALL,
      power: ALL,
      cost: ALL
    },
    sort: "default",
    expandedSkillName: null
  };

  const refs = {
    keyword: document.getElementById("skillKeyword"),
    elementFilters: document.getElementById("skillElementFilters"),
    typeFilter: document.getElementById("skillTypeFilter"),
    powerFilter: document.getElementById("skillPowerFilter"),
    costFilter: document.getElementById("skillCostFilter"),
    sortBar: document.getElementById("skillSortBar"),
    count: document.getElementById("skillCount"),
    detailPanel: document.getElementById("skillDetailPanel"),
    emptyState: document.getElementById("skillEmptyState"),
    grid: document.getElementById("skillGrid")
  };

  const skillCatalog = buildSkillCatalog(petList);
  const filterOptions = {
    elements: [ALL, ...uniqueStrings(skillCatalog.map(skill => skill.element))],
    types: [ALL, ...uniqueStrings(skillCatalog.map(skill => skill.type))],
    powers: [ALL, ...uniqueNumbers(skillCatalog.map(skill => Number(skill.power) || 0))],
    costs: [ALL, ...uniqueNumbers(skillCatalog.map(skill => Number(skill.cost) || 0))]
  };

  init();

  function init() {
    if (!refs.grid) return;

    renderElementFilters();
    populateSelect(refs.typeFilter, filterOptions.types, "\u5168\u90e8\u7c7b\u578b");
    populateSelect(refs.powerFilter, filterOptions.powers, "\u5168\u90e8\u5a01\u529b");
    populateSelect(refs.costFilter, filterOptions.costs, "\u5168\u90e8\u80fd\u8017");
    renderSortBar();
    bindEvents();
    render();
  }

  function bindEvents() {
    if (refs.keyword) {
      refs.keyword.addEventListener("input", event => {
        state.filters.keyword = event.target.value || "";
        render();
      });
    }

    if (refs.typeFilter) {
      refs.typeFilter.addEventListener("change", event => {
        state.filters.type = event.target.value;
        render();
      });
    }

    if (refs.powerFilter) {
      refs.powerFilter.addEventListener("change", event => {
        state.filters.power = event.target.value;
        render();
      });
    }

    if (refs.costFilter) {
      refs.costFilter.addEventListener("change", event => {
        state.filters.cost = event.target.value;
        render();
      });
    }
  }

  function buildSkillCatalog(pets) {
    const skillMap = new Map();

    pets.forEach((pet, petIndex) => {
      const ownSkills = (pet.ownSkills && pet.ownSkills.length)
        ? pet.ownSkills
        : (pet.skills || []);

      const sources = [
        { skills: pet.bloodlineSkills || [], source: "bloodline" },
        { skills: ownSkills, source: "own" },
        { skills: pet.skillStoneSkills || [], source: "skillStone" }
      ];

      sources.forEach(({ skills, source }) => {
        skills.forEach((skill, skillIndex) => {
          const name = normalizeSkillName(skill.name);
          if (!name) return;

          const signaturePayload = {
            element: skill.element || skill.attr || "-",
            type: skill.type || "-",
            power: Number(skill.power) || 0,
            cost: Number(skill.cost ?? skill.consume) || 0,
            desc: skill.desc || "",
            icon: skill.icon || null
          };
          const signature = JSON.stringify(signaturePayload);

          if (!skillMap.has(name)) {
            skillMap.set(name, {
              name,
              firstSeen: petIndex * 1000 + skillIndex,
              variants: new Map(),
              owners: new Map()
            });
          }

          const entry = skillMap.get(name);
          if (!entry.variants.has(signature)) {
            entry.variants.set(signature, {
              ...signaturePayload,
              count: 0,
              firstSeen: petIndex * 1000 + skillIndex
            });
          }

          entry.variants.get(signature).count += 1;

          const ownerId = getPetIdentifier(pet);
          if (!entry.owners.has(ownerId)) {
            entry.owners.set(ownerId, {
              id: ownerId,
              name: pet.name,
              element: normalizePetElements(pet.element),
              image: pet.image || pet.avatar || getPetFallbackImage(pet),
              no: pet.no || null,
              typeCode: pet.typeCode || "",
              hasBloodline: false,
              hasOwn: false,
              hasSkillStone: false
            });
          }

          const owner = entry.owners.get(ownerId);
          if (source === "bloodline") owner.hasBloodline = true;
          if (source === "own") owner.hasOwn = true;
          if (source === "skillStone") owner.hasSkillStone = true;
        });
      });
    });

    return [...skillMap.values()]
      .map(entry => {
        const variants = [...entry.variants.values()].sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.firstSeen - b.firstSeen;
        });
        const primary = variants[0];
        const owners = [...entry.owners.values()].sort(compareOwners);
        const bloodlineOwnerCount = owners.filter(owner => owner.hasBloodline).length;

        return {
          name: entry.name,
          element: primary.element,
          type: primary.type,
          power: primary.power,
          cost: primary.cost,
          desc: primary.desc,
          icon: primary.icon,
          firstSeen: entry.firstSeen,
          ownerCount: owners.length,
          bloodlineOwnerCount,
          owners,
          variants,
          hasVariants: variants.length > 1,
          isUniversal: owners.length === pets.length,
          effectiveness: getSkillEffectiveness(primary.element)
        };
      })
      .sort((a, b) => a.firstSeen - b.firstSeen);
  }

  function render() {
    const filteredSkills = getFilteredSkills();
    const sortedSkills = sortSkills(filteredSkills);

    if (refs.count) {
      refs.count.textContent = `\u663e\u793a ${sortedSkills.length} / ${skillCatalog.length} \u4e2a\u6280\u80fd`;
    }

    renderSkillGrid(sortedSkills);
    renderDetailPanel(sortedSkills);
  }

  function renderElementFilters() {
    if (!refs.elementFilters) return;

    refs.elementFilters.innerHTML = "";
    filterOptions.elements.forEach(element => {
      const button = document.createElement("button");
      button.className = "filter-btn";
      button.type = "button";

      if (element !== ALL && elementColors[element]) {
        button.innerHTML = `
          <img src="public/icons/${encodeURIComponent(element)}.png" class="filter-icon" alt="${escapeAttr(element)}">
          ${escapeHtml(element)}
        `;
        button.style.backgroundColor = "#fff";
        button.style.color = elementColors[element];
        button.style.border = `2px solid ${elementColors[element]}`;
      } else {
        button.textContent = element;
        button.style.border = "2px solid #ccc";
      }

      if (state.filters.element === element) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        state.filters.element = element;
        renderElementFilters();
        render();
      });

      refs.elementFilters.appendChild(button);
    });
  }

  function populateSelect(select, values, defaultLabel) {
    if (!select) return;

    select.innerHTML = values.map(value => {
      const label = value === ALL ? defaultLabel : String(value);
      return `<option value="${escapeAttr(String(value))}">${escapeHtml(label)}</option>`;
    }).join("");
  }

  function renderSortBar() {
    if (!refs.sortBar) return;

    refs.sortBar.innerHTML = `
      <span class="sort-label">\u6392\u5e8f</span>
      <button class="sort-btn${state.sort === "default" ? " active" : ""}" type="button" data-sort="default">\u9ed8\u8ba4</button>
      <button class="sort-btn${state.sort === "power_desc" ? " active" : ""}" type="button" data-sort="power_desc">\u5a01\u529b\u964d\u5e8f</button>
      <button class="sort-btn${state.sort === "cost_desc" ? " active" : ""}" type="button" data-sort="cost_desc">\u80fd\u8017\u964d\u5e8f</button>
    `;

    refs.sortBar.querySelectorAll(".sort-btn").forEach(button => {
      button.addEventListener("click", () => {
        state.sort = button.dataset.sort || "default";
        renderSortBar();
        render();
      });
    });
  }

  function getFilteredSkills() {
    const keyword = normalizeText(state.filters.keyword);

    return skillCatalog.filter(skill => {
      const descText = normalizeText(skill.desc);
      const nameText = normalizeText(skill.name);
      const matchesKeyword = !keyword || descText.includes(keyword) || nameText.includes(keyword);
      const matchesElement = state.filters.element === ALL || skill.element === state.filters.element;
      const matchesType = state.filters.type === ALL || skill.type === state.filters.type;
      const matchesPower = state.filters.power === ALL || String(skill.power) === state.filters.power;
      const matchesCost = state.filters.cost === ALL || String(skill.cost) === state.filters.cost;

      return matchesKeyword && matchesElement && matchesType && matchesPower && matchesCost;
    });
  }

  function sortSkills(skills) {
    const sorted = [...skills];

    if (state.sort === "power_desc") {
      sorted.sort((a, b) => (b.power - a.power) || (b.cost - a.cost) || (a.firstSeen - b.firstSeen));
      return sorted;
    }

    if (state.sort === "cost_desc") {
      sorted.sort((a, b) => (b.cost - a.cost) || (b.power - a.power) || (a.firstSeen - b.firstSeen));
      return sorted;
    }

    sorted.sort((a, b) => a.firstSeen - b.firstSeen);
    return sorted;
  }

  function renderSkillGrid(skills) {
    if (!refs.grid || !refs.emptyState) return;

    refs.emptyState.hidden = skills.length > 0;
    refs.grid.innerHTML = "";

    if (!skills.length) {
      state.expandedSkillName = null;
      return;
    }

    skills.forEach(skill => {
      const isExpanded = state.expandedSkillName === skill.name;
      const card = document.createElement("article");
      card.className = `skill-card${isExpanded ? " active" : ""}`;
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-expanded", String(isExpanded));

      card.innerHTML = `
        <div class="skill-card-top">
          ${getSkillIconMarkup(skill, "skill-card-icon")}
          <div class="skill-card-title-group">
            <h3>${escapeHtml(skill.name)}</h3>
            <div class="skill-owner-counts">
              <span class="skill-owner-count">\u603b\u62e5\u6709 ${skill.ownerCount}</span>
              <span class="skill-owner-count skill-owner-count-secondary">\u8840\u8109 ${skill.bloodlineOwnerCount}</span>
            </div>
          </div>
        </div>
        <div class="skill-meta-row">
          ${getMetaChip("\u5c5e\u6027", skill.element)}
          ${getMetaChip("\u7c7b\u578b", skill.type)}
          ${getMetaChip("\u5a01\u529b", String(skill.power))}
          ${getMetaChip("\u80fd\u8017", String(skill.cost))}
        </div>
        <p class="skill-card-summary">${escapeHtml(truncateText(skill.desc || "\u6682\u65e0\u63cf\u8ff0", 64))}</p>
      `;

      const toggleSkill = () => {
        state.expandedSkillName = isExpanded ? null : skill.name;
        render();
      };

      card.addEventListener("click", toggleSkill);
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleSkill();
        }
      });

      refs.grid.appendChild(card);
    });
  }

  function renderDetailPanel(skills) {
    if (!refs.detailPanel) return;

    if (!state.expandedSkillName) {
      refs.detailPanel.hidden = true;
      refs.detailPanel.innerHTML = "";
      return;
    }

    const skill = skills.find(item => item.name === state.expandedSkillName);
    if (!skill) {
      state.expandedSkillName = null;
      refs.detailPanel.hidden = true;
      refs.detailPanel.innerHTML = "";
      return;
    }

    refs.detailPanel.hidden = false;
    refs.detailPanel.innerHTML = `
      <div class="skill-detail-head">
        <div class="skill-detail-main">
          ${getSkillIconMarkup(skill, "skill-detail-icon")}
          <div>
            <h2>${escapeHtml(skill.name)}</h2>
            <div class="skill-meta-row">
              ${getMetaChip("\u5c5e\u6027", skill.element)}
              ${getMetaChip("\u7c7b\u578b", skill.type)}
              ${getMetaChip("\u5a01\u529b", String(skill.power))}
              ${getMetaChip("\u80fd\u8017", String(skill.cost))}
              ${getMetaChip("\u603b\u62e5\u6709", String(skill.ownerCount))}
              ${getMetaChip("\u8840\u8109", String(skill.bloodlineOwnerCount))}
            </div>
          </div>
        </div>
        <button class="skill-detail-close" type="button" id="closeSkillDetail">\u6536\u8d77</button>
      </div>
      <p class="skill-detail-description">${escapeHtml(skill.desc || "\u6682\u65e0\u63cf\u8ff0")}</p>
      ${skill.hasVariants ? `
        <div class="skill-variant-note">
          \u540c\u540d\u6280\u80fd\u5728\u90e8\u5206\u7cbe\u7075\u8eab\u4e0a\u5b58\u5728\u6570\u503c\u6216\u7c7b\u578b\u5dee\u5f02\uff0c\u5f53\u524d\u5c55\u793a\u7684\u662f\u51fa\u73b0\u6b21\u6570\u6700\u591a\u7684\u7248\u672c\u3002
        </div>
      ` : ""}
      ${renderEffectivenessSection(skill)}
      ${renderOwnerSection(skill)}
    `;

    const closeButton = document.getElementById("closeSkillDetail");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        state.expandedSkillName = null;
        render();
      });
    }

    refs.detailPanel.querySelectorAll(".skill-owner-card").forEach(card => {
      card.addEventListener("click", () => {
        const petId = card.dataset.petId;
        if (petId) {
          location.href = `detail.html?id=${encodeURIComponent(petId)}`;
        }
      });
    });
  }

  function renderOwnerSection(skill) {
    const displayedOwners = skill.owners.filter(isDetailDisplayPet);

    if (!displayedOwners.length) {
      return `
        <div class="skill-owner-section">
          <div class="skill-owner-header">
            <h3>\u62e5\u6709\u8be5\u6280\u80fd\u7684\u6700\u7ec8\u8fdb\u5316\u7cbe\u7075</h3>
            <span>0 \u53ea</span>
          </div>
          <div class="skill-universal-note">\u6682\u65e0\u6700\u7ec8\u8fdb\u5316\u9636\u6bb5\u7cbe\u7075\u62e5\u6709\u8be5\u6280\u80fd\u3002</div>
        </div>
      `;
    }

    if (displayedOwners.length === detailOwnerPetCount) {
      return `
        <div class="skill-owner-section">
          <div class="skill-owner-header">
            <h3>\u62e5\u6709\u8be5\u6280\u80fd\u7684\u6700\u7ec8\u8fdb\u5316\u7cbe\u7075</h3>
            <span>${displayedOwners.length} \u53ea</span>
          </div>
          <div class="skill-universal-note">
            \u8be5\u6280\u80fd\u4e3a\u5168\u90e8\u6700\u7ec8\u8fdb\u5316\u7cbe\u7075\u53ef\u83b7\u5f97\u6280\u80fd\uff0c\u5df2\u7701\u7565\u5b8c\u6574\u62e5\u6709\u8005\u5217\u8868\u3002
          </div>
        </div>
      `;
    }

    return `
      <div class="skill-owner-section">
        <div class="skill-owner-header">
          <h3>\u62e5\u6709\u8be5\u6280\u80fd\u7684\u6700\u7ec8\u8fdb\u5316\u7cbe\u7075</h3>
          <span>${displayedOwners.length} \u53ea</span>
        </div>
        <div class="skill-owner-grid">
          ${displayedOwners.map(owner => `
            <button class="skill-owner-card" type="button" data-pet-id="${escapeAttr(owner.id)}">
              <div class="avatar-box skill-owner-avatar">
                <img class="avatar skill-owner-image" src="${escapeAttr(owner.image)}" alt="${escapeAttr(owner.name)}">
              </div>
              <div class="skill-owner-name">${escapeHtml(owner.name)}</div>
              <div class="skill-owner-source-row">
                ${getOwnerSourceBadges(owner)}
              </div>
              <div class="skill-owner-elements">
                ${owner.element.map(element => getElementBadgeMarkup(element)).join("")}
              </div>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderEffectivenessSection(skill) {
    const effect = skill.effectiveness;
    if (!effect) return "";

    return `
      <div class="skill-owner-section">
        <div class="skill-owner-header">
          <h3>\u5c5e\u6027\u6548\u679c</h3>
          <span>${escapeHtml(skill.element)}</span>
        </div>
        <div class="skill-effect-grid">
          <div class="skill-effect-card">
            <div class="skill-effect-title">\u6253\u8fd9\u4e9b\u5c5e\u6027\u6548\u679c\u597d</div>
            <div class="skill-effect-elements">
              ${effect.strong.length
                ? effect.strong.map(element => getElementBadgeMarkup(element)).join("")
                : '<span class="skill-effect-empty">\u65e0</span>'}
            </div>
          </div>
          <div class="skill-effect-card">
            <div class="skill-effect-title">\u6253\u8fd9\u4e9b\u5c5e\u6027\u6548\u679c\u5dee</div>
            <div class="skill-effect-elements">
              ${effect.weak.length
                ? effect.weak.map(element => getElementBadgeMarkup(element)).join("")
                : '<span class="skill-effect-empty">\u65e0</span>'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getSkillEffectiveness(element) {
    const table = skillWeaknessTable[element];
    if (!table) return null;

    return {
      strong: table["very-effective"] || [],
      weak: table["not-effective"] || []
    };
  }

  function getSkillIconMarkup(skill, extraClass) {
    const fallbackText = escapeAttr((skill.name || "?").slice(0, 1));
    const iconPath = encodeURI(skill.icon || `public/skills/${skill.element}/${skill.name}.png`);

    return `
      <div class="skill-icon-box ${extraClass}" data-fallback="${fallbackText}">
        <img
          src="${iconPath}"
          class="skill-icon"
          alt="${escapeAttr(skill.name)}"
          onerror="this.parentElement.classList.add('is-fallback'); this.remove();"
        >
      </div>
    `;
  }

  function getMetaChip(label, value) {
    return `<span class="skill-chip"><strong>${escapeHtml(label)}:</strong>${escapeHtml(value)}</span>`;
  }

  function getElementBadgeMarkup(element) {
    const color = elementColors[element] || "#9aa4b2";
    return `
      <span
        class="element skill-owner-element"
        style="background:#f8f8f8;border:2px solid ${color};color:#111;display:inline-flex;align-items:center;gap:4px;"
      >
        <img src="public/icons/${encodeURIComponent(element)}.png" class="element-icon" alt="${escapeAttr(element)}">
        ${escapeHtml(element)}
      </span>
    `;
  }

  function getOwnerSourceBadges(owner) {
    const badges = [];

    if (owner.hasBloodline) {
      badges.push(getSourceBadgeMarkup("bloodline"));
    }
    if (owner.hasOwn) {
      badges.push(getSourceBadgeMarkup("own"));
    }
    if (owner.hasSkillStone) {
      badges.push(getSourceBadgeMarkup("skillStone"));
    }

    return badges.join("");
  }

  function getSourceBadgeMarkup(sourceKey) {
    const source = SOURCE_META[sourceKey];
    if (!source) return "";

    return `
      <span class="skill-source-badge ${source.className}">
        ${escapeHtml(source.label)}
      </span>
    `;
  }

  function getPetIdentifier(pet) {
    return String(pet.id ?? pet.no ?? pet.key ?? pet.name);
  }

  function isDetailDisplayPet(pet) {
    return DETAIL_OWNER_STAGE_CODES.has(pet.typeCode);
  }

  function getPetFallbackImage(pet) {
    if (pet.id == null) return "public/leologo/pet_icon.png";
    return `public/images/${pet.id}.png`;
  }

  function normalizePetElements(element) {
    if (Array.isArray(element)) {
      return element.filter(Boolean);
    }
    return element ? [element] : [];
  }

  function normalizeSkillName(name) {
    return String(name || "").trim();
  }

  function compareOwners(a, b) {
    const left = a.no || String(a.id);
    const right = b.no || String(b.id);
    return String(left).localeCompare(String(right), "zh-CN", { numeric: true });
  }

  function uniqueStrings(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  }

  function uniqueNumbers(values) {
    return [...new Set(values)].sort((a, b) => a - b);
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}…`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
