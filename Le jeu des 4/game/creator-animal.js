"use strict";

/* ============================================================
   game/creator-animal.js — Créateur d'animaux
============================================================ */

function getAnimalCreatorAbilityValues(existing, kind) {
    const definition = existing || {};
    const ability = definition[kind === "buff" ? "Buff" : "Debuff"] || {};
    return {
        type: ability.Type || (kind === "buff" ? definition.TypeBuff : definition.TypeDebuff) || "",
        value: ability.Valeur ?? (kind === "buff" ? definition.ValeurBuff : definition.ValeurDebuff) ?? 0,
        turns: ability.Tours ?? definition.Tours ?? 1,
        activation: ability.Activation || definition.TypeActivation || "Sur attaque",
        cooldown: ability.Cooldown ?? definition.CooldownActivation ?? 0,
        chanceActivation: ability.ChanceActivation ?? definition.ChanceActivation ?? 100,
        stackable: ability.Stackable === true || (ability.Stackable === undefined && definition.Stackable === true)
    };
}

function startAnimalCreator(existing) {
    resetDevPanel();
    $("#dev-menu-main").classList.add("hidden");

    const panel = $("#dev-panel");
    panel.classList.remove("hidden");

    const animal = existing || {};
    const buff = getAnimalCreatorAbilityValues(animal, "buff");
    const debuff = getAnimalCreatorAbilityValues(animal, "debuff");
    const selectedAttacks = Array.isArray(animal.Attaques) ? animal.Attaques.slice(0, 4) : [];

    const rarityOptions = ANIMAL_RARITIES.map(r =>
        '<option value="' + escapeHtml(r) + '"' + (animal.Rarete === r ? " selected" : "") + '>' +
        escapeHtml(r) + '</option>'
    ).join("");

    const energyOptions = (state.contenu?.Energies || []).map(energy =>
        '<option value="' + escapeHtml(energy.Nom) + '"' + (animal.TypeEnergie === energy.Nom ? " selected" : "") + '>' + escapeHtml(energy.Nom) + '</option>'
    ).join("");
    const secondEnergyOptions = '<option value="">— Aucune —</option>' + (state.contenu?.Energies || []).map(energy =>
        '<option value="' + escapeHtml(energy.Nom) + '"' + (animal.TypeEnergie2 === energy.Nom ? " selected" : "") + '>' + escapeHtml(energy.Nom) + '</option>'
    ).join("");

    const activationOptions = ANIMAL_ACTIVATIONS.map(value =>
        '<option value="' + escapeHtml(value) + '"' + (buff.activation === value ? " selected" : "") + '>' +
        escapeHtml(value) + '</option>'
    ).join("");

    const debuffActivationOptions = ANIMAL_ACTIVATIONS.map(value =>
        '<option value="' + escapeHtml(value) + '"' + (debuff.activation === value ? " selected" : "") + '>' +
        escapeHtml(value) + '</option>'
    ).join("");

    const effectOptions = ANIMAL_EFFECTS.map(value =>
        '<option value="' + escapeHtml(value) + '"' + (buff.type === value ? " selected" : "") + '>' +
        escapeHtml(value || "Aucun") + '</option>'
    ).join("");

    const debuffOptions = ANIMAL_EFFECTS.map(value =>
        '<option value="' + escapeHtml(value) + '"' + (debuff.type === value ? " selected" : "") + '>' +
        escapeHtml(value || "Aucun") + '</option>'
    ).join("");

    const masters = (state.contenu?.Personnages || []).map(personnage => {
        const stableId = String(personnage.Id || personnage.id || personnage.Nom || "");
        const selected = String(animal.Maitre || "") === stableId || String(animal.Maitre || "") === String(personnage.Nom || "");
        return '<option value="' + escapeHtml(stableId) + '"' + (selected ? " selected" : "") + '>' +
            escapeHtml(personnage.Nom || stableId) + '</option>';
    }).join("");

    panel.innerHTML =
        '<h3 style="margin-bottom:12px;">' + (existing ? "Modifier" : "Nouvel") + ' animal</h3>' +

        '<div class="dev-section-title">Identité</div>' +
        '<div class="input-group"><label for="dev-a-id">ID unique</label><input id="dev-a-id" maxlength="60" value="' + escapeHtml(animal.Id || animalSlug(animal.Nom) || "") + '" placeholder="ex. loup-01"></div>' +
        '<div class="input-group"><label for="dev-a-nom">Nom</label><input id="dev-a-nom" maxlength="60" value="' + escapeHtml(animal.Nom || "") + '"></div>' +
        '<div class="input-group"><label for="dev-a-description">Description</label><textarea id="dev-a-description" rows="3">' + escapeHtml(animal.Description || "") + '</textarea></div>' +

        '<div class="input-group"><label>Image PNG / JPG</label>' +
        '<div class="dev-image-row"><img id="dev-a-image-preview" class="dev-image-preview ' + (animal.Image ? "" : "hidden") + '" src="' + escapeHtml(animal.Image || "") + '" alt="">' +
        '<button type="button" class="secondary-button" id="dev-a-image-btn">Sélectionner une image</button>' +
        '<button type="button" class="small-button" id="dev-a-image-clear">Retirer</button></div>' +
        '<input type="hidden" id="dev-a-image" value="' + escapeHtml(animal.Image || "") + '"></div>' +
        '<label class="dev-check-item"><input type="checkbox" id="dev-a-has-shiny" ' + (animal.AUneImageShiny ? "checked" : "") + '> Cet animal possède une image Shiny</label>' +
        '<div id="dev-a-shiny-config" class="' + (animal.AUneImageShiny ? "" : "hidden") + '">' +
        '<div class="input-group"><label>Image Shiny PNG / JPG</label><div class="dev-image-row"><img id="dev-a-shiny-preview" class="dev-image-preview ' + (animal.ImageShiny ? "" : "hidden") + '" src="' + escapeHtml(animal.ImageShiny || "") + '" alt="">' +
        '<button type="button" class="secondary-button" id="dev-a-shiny-btn">Sélectionner une image</button><button type="button" class="small-button" id="dev-a-shiny-clear">Retirer</button></div>' +
        '<input type="hidden" id="dev-a-image-shiny" value="' + escapeHtml(animal.ImageShiny || "") + '"></div></div>' +
        '<div class="dev-section-title">Statistiques</div>' +
        '<div class="dev-form-row">' +
        '<div class="input-group"><label for="dev-a-vie">Vie</label><input type="number" id="dev-a-vie" min="1" step="1" value="' + (animal.Vie ?? 100) + '"></div>' +
        '<div class="input-group"><label for="dev-a-puissance">Puissance</label><input type="number" id="dev-a-puissance" min="0" step="any" value="' + (animal.Puissance ?? 1) + '"></div>' +
        '</div>' +
        '<div class="dev-form-row">' +
        '<div class="input-group"><label for="dev-a-armure">Armure</label><input type="number" id="dev-a-armure" min="0" step="any" value="' + (animal.Armure ?? 0) + '"></div>' +
        '<div class="input-group"><label for="dev-a-energy-max">Énergie maximale</label><input type="number" id="dev-a-energy-max" min="0" step="1" value="' + (animal.MaxEnergie ?? 100) + '"></div>' +
        '</div>' +
        '<div class="dev-form-row">' +
        '<div class="input-group"><label for="dev-a-energy-type">Énergie 1</label><select id="dev-a-energy-type"><option value="">— Aucune —</option>' + energyOptions + '</select></div>' +
        '<div class="input-group"><label for="dev-a-energy-type2">Énergie 2 (optionnelle)</label><select id="dev-a-energy-type2">' + secondEnergyOptions + '</select></div></div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-min">Min roulette</label><input type="number" id="dev-a-min" min="0" step="1" value="' + (animal.MinRoulette ?? 1) + '"></div>' +
        '</div>' +
        '<div class="input-group"><label for="dev-a-max">Max roulette</label><input type="number" id="dev-a-max" min="0" step="1" value="' + (animal.MaxRoulette ?? 10) + '"></div>' +

        '<div class="dev-section-title">Buff</div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-buff">Type</label><select id="dev-a-buff">' + effectOptions + '</select></div>' +
        '<div class="input-group"><label for="dev-a-buff-value">Valeur</label><input type="number" id="dev-a-buff-value" min="0" step="any" value="' + buff.value + '"></div></div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-buff-turns">Tours</label><input type="number" id="dev-a-buff-turns" min="1" step="1" value="' + buff.turns + '"></div>' +
        '<div class="input-group"><label for="dev-a-buff-cd">Cooldown</label><input type="number" id="dev-a-buff-cd" min="0" step="1" value="' + buff.cooldown + '"></div></div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-buff-activation">Activation</label><select id="dev-a-buff-activation">' + activationOptions + '</select></div>' +
        '<div class="input-group"><label for="dev-a-buff-chance">Chance d’activation (%)</label><input type="number" id="dev-a-buff-chance" min="0" max="100" step="any" value="' + buff.chanceActivation + '"></div></div>' +
        '<label class="dev-check-item"><input type="checkbox" id="dev-a-buff-stack" ' + (buff.stackable ? "checked" : "") + '> Stackable</label>' +

        '<div class="dev-section-title">Debuff</div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-debuff">Type</label><select id="dev-a-debuff">' + debuffOptions + '</select></div>' +
        '<div class="input-group"><label for="dev-a-debuff-value">Valeur</label><input type="number" id="dev-a-debuff-value" min="0" step="any" value="' + debuff.value + '"></div></div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-debuff-turns">Tours</label><input type="number" id="dev-a-debuff-turns" min="1" step="1" value="' + debuff.turns + '"></div>' +
        '<div class="input-group"><label for="dev-a-debuff-cd">Cooldown</label><input type="number" id="dev-a-debuff-cd" min="0" step="1" value="' + debuff.cooldown + '"></div></div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-debuff-activation">Activation</label><select id="dev-a-debuff-activation">' + debuffActivationOptions + '</select></div>' +
        '<div class="input-group"><label for="dev-a-debuff-chance">Chance d’activation (%)</label><input type="number" id="dev-a-debuff-chance" min="0" max="100" step="any" value="' + debuff.chanceActivation + '"></div></div>' +
        '<label class="dev-check-item"><input type="checkbox" id="dev-a-debuff-stack" ' + (debuff.stackable ? "checked" : "") + '> Stackable</label>' +
        '<div class="dev-section-title">Attaques (maximum 4)</div>' +
        '<div id="dev-a-attacks" class="dev-check-list"></div>' +
        '<div class="dev-section-title">Évolution</div>' +
        '<div class="input-group"><label for="dev-a-evolution-enabled">Évolution</label><select id="dev-a-evolution-enabled"><option value="0"' + (animal.Evolution ? "" : " selected") + '>0. Aucune</option><option value="1"' + (animal.Evolution ? " selected" : "") + '>1. Évolution</option></select></div>' +
        '<div id="dev-a-evolution-config" class="' + (animal.Evolution ? "" : "hidden") + '">' +
        '<div class="input-group"><label for="dev-a-evolution-target">Animal cible</label><select id="dev-a-evolution-target"></select></div>' +
        '<div class="input-group"><label for="dev-a-evolution-level">Niveau requis</label><input type="number" id="dev-a-evolution-level" min="1" step="1" value="' + (animal.Evolution?.NiveauRequis || 16) + '"></div></div>' +
        '<div class="dev-section-title">Méga-Évolution</div>' +
        '<div class="input-group"><label for="dev-a-mega-enabled">Méga-Évolution</label><select id="dev-a-mega-enabled"><option value="0"' + (animal.MegaEvolution ? "" : " selected") + '>0. Aucune</option><option value="1"' + (animal.MegaEvolution ? "" : " selected") + '>1. Méga-Évolution configurée</option></select></div>' +
        '<div id="dev-a-mega-config" class="' + (animal.MegaEvolution ? "" : "hidden") + '">' +
        '<div class="input-group"><label for="dev-a-mega-target">Animal Méga cible</label><select id="dev-a-mega-target"></select></div>' +
        '<div class="input-group"><label for="dev-a-mega-item">Item requis</label><select id="dev-a-mega-item"></select></div></div>' +
        '<div class="dev-section-title">Rencontre et rareté</div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-rarity">Rareté</label><select id="dev-a-rarity">' + rarityOptions + '</select></div>' +
        '<div class="input-group"><label for="dev-a-chance">Chance de rencontre (%)</label><input type="number" id="dev-a-chance" min="0" max="100" step="any" value="' + (animal.ChanceRencontre ?? animal.ChanceSelection ?? 0) + '"></div></div>' +

        '<div class="dev-section-title">Maître</div>' +
        '<div class="input-group"><label for="dev-a-master">Personnage maître</label><select id="dev-a-master"><option value="">— Aucun —</option>' + masters + '</select></div>' +
        '<div class="input-group"><label for="dev-a-master-bonus">AugmentationMaitre</label><input type="number" id="dev-a-master-bonus" step="any" value="' + (animal.AugmentationMaitre ?? 0) + '"></div>' +

        '<div class="dev-section-title">Progression</div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-level">Niveau initial</label><input type="number" id="dev-a-level" min="1" step="1" value="' + (animal.NiveauInitial ?? 1) + '"></div>' +
        '<div class="input-group"><label for="dev-a-prog-mode">Mode</label><select id="dev-a-prog-mode"><option value="additive">Addition par niveau</option><option value="multiplicative">Multiplication par niveau</option></select></div></div>' +
        '<div class="dev-form-row"><div class="input-group"><label for="dev-a-prog-value">Valeur par niveau</label><input type="number" id="dev-a-prog-value" step="any" value="' + (animal.Progression?.ValeurParNiveau ?? 0) + '"></div>' +
        '<div class="input-group"><label for="dev-a-prog-mult">Multiplicateur par niveau</label><input type="number" id="dev-a-prog-mult" min="0" step="any" value="' + (animal.Progression?.MultiplicateurParNiveau ?? 1) + '"></div></div>' +

        '<div class="dev-form-actions"><button type="button" id="dev-a-cancel" class="secondary-button">Annuler</button><button type="button" id="dev-a-save" class="primary-button">' + (existing ? "Enregistrer" : "Créer l’animal") + '</button></div>';

    $("#dev-a-prog-mode").value = animal.Progression?.Mode || "additive";

    const attackContainer = $("#dev-a-attacks");
    let attackSelection = selectedAttacks.slice();
    const renderAttackChecklist = () => {
        const types = [$("#dev-a-energy-type").value, $("#dev-a-energy-type2").value].filter(Boolean);
        const compatible = (state.contenu?.Attaques || []).filter(attaque => attaque && attaque.Nom && getAttackEnergyTypes(attaque).some(type => types.includes(type)));
        attackSelection = attackSelection.filter(name => compatible.some(a => a.Nom === name));
        attackContainer.innerHTML = compatible.length ? "" : '<p class="dev-info-note">Aucune attaque compatible avec cette énergie.</p>';
        compatible.forEach(attaque => {
            const label = document.createElement("label");
            label.className = "dev-check-item";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = attackSelection.includes(attaque.Nom);
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    if (attackSelection.length >= 4) { checkbox.checked = false; showToast("Maximum atteint", "Un animal ne peut avoir que 4 attaques."); return; }
                    attackSelection.push(attaque.Nom);
                } else {
                    attackSelection = attackSelection.filter(name => name !== attaque.Nom);
                }
            });
            label.appendChild(checkbox);
            const span = document.createElement("span");
            span.innerHTML = '<strong>' + escapeHtml(attaque.Nom) + '</strong> — ' + escapeHtml(getAttackEnergyTypes(attaque).join(" / ")) + ' · ' + escapeHtml(String(attaque.CoutEnergie)) + ' énergie';
            label.appendChild(span);
            attackContainer.appendChild(label);
        });
    };
    if (attackSelection.length === 0) {
        const initialTypes = [animal.TypeEnergie, animal.TypeEnergie2].filter(Boolean);
        const compatible = (state.contenu?.Attaques || []).filter(attaque => attaque && attaque.Nom && getAttackEnergyTypes(attaque).some(type => initialTypes.includes(type)));
        attackSelection = compatible.slice(0, 4).map(attaque => attaque.Nom);
    }
    renderAttackChecklist();

    $("#dev-a-energy-type").addEventListener("change", renderAttackChecklist);
    $("#dev-a-energy-type2").addEventListener("change", renderAttackChecklist);

    const animalTargets = (state.contenu?.Animaux || []).filter(entry => entry && entry.Nom && (!existing || entry.Nom !== existing.Nom));
    const targetOptions = animalTargets.map(entry => '<option value="' + escapeHtml(entry.Nom) + '">' + escapeHtml(entry.Nom) + '</option>').join("");
    $("#dev-a-evolution-target").innerHTML = '<option value="">— Choisir —</option>' + targetOptions;
    $("#dev-a-mega-target").innerHTML = '<option value="">— Choisir —</option>' + targetOptions;
    if (animal.Evolution?.Cible) $("#dev-a-evolution-target").value = animal.Evolution.Cible;
    if (animal.MegaEvolution?.Cible) $("#dev-a-mega-target").value = animal.MegaEvolution.Cible;

    const megaItems = (state.contenu?.Items || []).filter(item => item && (item.MegaStone || item.Categorie === "Méga Stone" || item.Categorie === "Mega Stone"));
    $("#dev-a-mega-item").innerHTML = '<option value="">— Choisir —</option>' + megaItems.map(item => '<option value="' + escapeHtml(item.Id || "") + '">' + escapeHtml(item.Nom || item.Id || "") + '</option>').join("");
    if (animal.MegaEvolution?.ItemId) $("#dev-a-mega-item").value = animal.MegaEvolution.ItemId;

    $("#dev-a-has-shiny").addEventListener("change", event => $("#dev-a-shiny-config").classList.toggle("hidden", !event.target.checked));
    $("#dev-a-shiny-btn").addEventListener("click", () => openDevImagePicker("#dev-a-image-shiny", "#dev-a-shiny-preview", "animaux", "#dev-a-nom"));
    $("#dev-a-shiny-clear").addEventListener("click", () => { $("#dev-a-image-shiny").value = ""; $("#dev-a-shiny-preview").classList.add("hidden"); });
    $("#dev-a-evolution-enabled").addEventListener("change", event => $("#dev-a-evolution-config").classList.toggle("hidden", event.target.value !== "1"));
    $("#dev-a-mega-enabled").addEventListener("change", event => $("#dev-a-mega-config").classList.toggle("hidden", event.target.value !== "1"));

    $("#dev-a-image-btn").addEventListener("click", () =>
        openDevImagePicker("#dev-a-image", "#dev-a-image-preview", "animaux", "#dev-a-nom")
    );

    $("#dev-a-image-clear").addEventListener("click", () => {
        $("#dev-a-image").value = "";
        $("#dev-a-image-preview").classList.add("hidden");
    });

    $("#dev-a-cancel").addEventListener("click", () => showDevCategoryMenu("Animaux"));
    $("#dev-a-save").addEventListener("click", () => submitAnimalCreator(existing, () => attackSelection));
}

function readAnimalCreatorAbility(kind) {
    const prefix = kind === "buff" ? "buff" : "debuff";
    return {
        Type: $("#" + "dev-a-" + prefix).value,
        Valeur: Number($("#" + "dev-a-" + prefix + "-value").value),
        Tours: Math.floor(Number($("#" + "dev-a-" + prefix + "-turns").value)),
        Activation: $("#" + "dev-a-" + prefix + "-activation").value,
        Cooldown: Math.floor(Number($("#" + "dev-a-" + prefix + "-cd").value)),
        ChanceActivation: Number($("#" + "dev-a-" + prefix + "-chance").value),
        Stackable: $("#" + "dev-a-" + prefix + "-stack").checked
    };
}

function submitAnimalCreator(existing, getSelectedAttacks = () => []) {
    const attackSelection = Array.from(new Set(getSelectedAttacks().map(value => String(value || "").trim()).filter(Boolean))).slice(0, 4);
    const nom = $("#dev-a-nom").value.trim();
    if (!nom) return showToast("Animal invalide", "Le nom est obligatoire.");

    if (existing && existing.Nom !== nom) {
        showToast("Renommage impossible", "Modifie les propriétés de l’animal sans changer son nom.");
        return;
    }

    if ((!existing || existing.Nom !== nom) && creatorNameExists("Animaux", nom)) {
        return showToast("Nom déjà utilisé", "Un animal portant ce nom existe déjà.");
    }

    const rawId = $("#dev-a-id").value.trim();
    const id = rawId.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!id) return showToast("ID invalide", "L'ID doit contenir des lettres, chiffres, tirets ou underscores.");

    const duplicateId = (state.contenu?.Animaux || []).some(animal =>
        animal && String(animal.Id || "") === id && (!existing || animal.Nom !== existing.Nom)
    );
    if (duplicateId) return showToast("ID déjà utilisé", "Cet identifiant Animal existe déjà.");

    const vie = Number($("#dev-a-vie").value);
    const puissance = Number($("#dev-a-puissance").value);
    const armure = Number($("#dev-a-armure").value);
    const maxEnergie = Number($("#dev-a-energy-max").value);
    const minRoulette = Number($("#dev-a-min").value);
    const maxRoulette = Number($("#dev-a-max").value);
    const chance = Number($("#dev-a-chance").value);
    const level = Number($("#dev-a-level").value);
    const master = $("#dev-a-master").value.trim();
    const masterDefinition = master
        ? (state.contenu?.Personnages || []).find(personnage => String(personnage.Id || personnage.id || personnage.Nom || "") === master)
        : null;

    if (!Number.isFinite(vie) || vie < 1) return showToast("Vie invalide", "La vie doit être supérieure ou égale à 1.");
    if (!Number.isFinite(puissance) || puissance < 0) return showToast("Puissance invalide", "La puissance ne peut pas être négative.");
    if (!Number.isFinite(armure) || armure < 0) return showToast("Armure invalide", "L'armure ne peut pas être négative.");
    if (!Number.isFinite(maxEnergie) || maxEnergie < 0) return showToast("Énergie invalide", "L'énergie maximale ne peut pas être négative.");
    if (!Number.isFinite(minRoulette) || !Number.isFinite(maxRoulette) || minRoulette < 0 || maxRoulette < minRoulette) return showToast("Roulette invalide", "Le maximum doit être supérieur ou égal au minimum.");
    if (!Number.isFinite(chance) || chance < 0 || chance > 100) return showToast("Chance invalide", "La chance de rencontre doit être comprise entre 0 et 100 %.");
    if (!Number.isInteger(level) || level < 1) return showToast("Niveau invalide", "Le niveau initial doit être supérieur ou égal à 1.");

    const energyType = $("#dev-a-energy-type").value.trim();
    if (energyType && !(state.contenu?.Energies || []).some(energy => energy && energy.Nom === energyType)) {
        return showToast("Énergie invalide", "Le type d'énergie sélectionné n'existe plus.");
    }

    const buff = readAnimalCreatorAbility("buff");
    const debuff = readAnimalCreatorAbility("debuff");
    const validateAbility = (ability, label, isDebuff) => {
        if (!ANIMAL_EFFECTS.includes(ability.Type)) return label + " : type invalide.";
        if (!isDebuff && ["Brûlure", "Paralysie", "Sommeil", "Shocked"].includes(ability.Type)) return label + " : ce statut est réservé au debuff.";
        if (!Number.isFinite(ability.Valeur) || ability.Valeur < 0) return label + " : valeur invalide.";
        if ((ability.Type === "Dégâts") && isDebuff && ability.Valeur > 1) return label + " : un debuff de dégâts doit avoir une valeur comprise entre 0 et 1.";
        if (!Number.isInteger(ability.Tours) || ability.Tours < 1) return label + " : durée invalide.";
        if (!Number.isInteger(ability.Cooldown) || ability.Cooldown < 0) return label + " : cooldown invalide.";
        if (!Number.isFinite(ability.ChanceActivation) || ability.ChanceActivation < 0 || ability.ChanceActivation > 100) return label + " : chance d'activation invalide.";
        if (!ANIMAL_ACTIVATIONS.includes(ability.Activation)) return label + " : activation invalide.";
        return null;
    };
    const buffError = validateAbility(buff, "Buff", false);
    const debuffError = validateAbility(debuff, "Debuff", true);
    if (buffError) return showToast("Buff invalide", buffError);
    if (debuffError) return showToast("Debuff invalide", debuffError);

    const image = String($("#dev-a-image").value || "").trim();
    const hasShiny = $("#dev-a-has-shiny").checked;
    const imageShiny = String($("#dev-a-image-shiny").value || "").trim();
    if (hasShiny && !imageShiny) return showToast("Image Shiny manquante", "Coche l'option Shiny uniquement avec une image Shiny configurée.");
    if (!hasShiny && imageShiny) return showToast("Image Shiny incohérente", "L'image Shiny doit être retirée si l'option Shiny est désactivée.");
    for (const shinyPath of [imageShiny]) {
        if (shinyPath && !/^data:image\/(png|jpeg|jpg);/i.test(shinyPath) && !/\.(png|jpe?g)(?:$|\?)/i.test(shinyPath)) return showToast("Image invalide", "L'image Shiny doit être un PNG ou JPG.");
    }
    const energyType2 = $("#dev-a-energy-type2").value.trim();
    if (energyType2 && energyType2 === energyType) return showToast("Énergies identiques", "Les deux types d'énergie doivent être différents.");
    if (attackSelection.length > 4) return showToast("Attaques invalides", "Un animal ne peut avoir que 4 attaques.");
    const validAttackNames = new Set((state.contenu?.Attaques || []).filter(Boolean).map(a => a.Nom));
    if (attackSelection.some(name => !validAttackNames.has(name))) return showToast("Attaque invalide", "Une attaque sélectionnée n'existe plus.");
    const compatibleNames = new Set((state.contenu?.Attaques || []).filter(a => a && getAttackEnergyTypes(a).some(type => [energyType, energyType2].filter(Boolean).includes(type))).map(a => a.Nom));
    if (attackSelection.some(name => !compatibleNames.has(name))) return showToast("Attaque incompatible", "Toutes les attaques doivent être compatibles avec l'énergie de l'animal.");
    if (image && !/^data:image\/(png|jpeg|jpg);/i.test(image) && !/\.(png|jpe?g)(?:$|\?)/i.test(image)) {
        return showToast("Image invalide", "L'image doit être un PNG ou JPG.");
    }

    let evolution = null;
    if ($("#dev-a-evolution-enabled").value === "1") {
        const cible = $("#dev-a-evolution-target").value.trim();
        const niveau = Math.max(1, Math.floor(Number($("#dev-a-evolution-level").value) || 16));
        if (!cible || cible === nom) return showToast("Évolution invalide", "Choisis un animal cible différent de l'animal actuel.");
        if (!(state.contenu?.Animaux || []).some(entry => entry && entry.Nom === cible)) return showToast("Évolution invalide", "L'animal cible n'existe pas.");
        evolution = { Cible: cible, NiveauRequis: niveau };
    }
    let megaEvolution = null;
    if ($("#dev-a-mega-enabled").value === "1") {
        const cible = $("#dev-a-mega-target").value.trim();
        const itemId = $("#dev-a-mega-item").value.trim();
        if (!cible || cible === nom) return showToast("Méga-Évolution invalide", "Choisis une cible différente.");
        if (!(state.contenu?.Animaux || []).some(entry => entry && entry.Nom === cible)) return showToast("Méga-Évolution invalide", "La forme Méga cible n'existe pas.");
        const item = typeof getItemDefinition === "function" ? getItemDefinition(itemId) : null;
        if (!item || !isMegaStoneItem(item)) return showToast("Item invalide", "Choisis un item Méga Stone existant.");
        megaEvolution = { Cible: cible, ItemId: item.Id };
    }

    const masterValue = masterDefinition
        ? String(masterDefinition.Id || masterDefinition.id || masterDefinition.Nom || "")
        : master;

    const item = normalizeAnimalDefinition({
        Id: id,
        Nom: nom,
        Description: $("#dev-a-description").value.trim(),
        Image: image,
        AUneImageShiny: $("#dev-a-has-shiny").checked,
        ImageShiny: String($("#dev-a-image-shiny").value || "").trim(),
        Attaques: attackSelection.slice(0, 4),
        Vie: Math.floor(vie),
        Puissance: puissance,
        Armure: armure,
        MaxEnergie: Math.floor(maxEnergie),
        TypeEnergie: energyType,
        TypeEnergie2: $("#dev-a-energy-type2").value.trim(),
        MinRoulette: Math.floor(minRoulette),
        MaxRoulette: Math.floor(maxRoulette),
        Rarete: $("#dev-a-rarity").value,
        ChanceRencontre: chance,
        Maitre: masterValue,
        AugmentationMaitre: Number($("#dev-a-master-bonus").value) || 0,
        NiveauInitial: level,
        Buff: buff,
        Debuff: debuff,
        Evolution: evolution,
        MegaEvolution: megaEvolution,
        Progression: {
            Mode: $("#dev-a-prog-mode").value === "multiplicative" ? "multiplicative" : "additive",
            ValeurParNiveau: Number($("#dev-a-prog-value").value) || 0,
            MultiplicateurParNiveau: Number($("#dev-a-prog-mult").value) || 1
        }
    });

    if (existing) {
        persistCreatorObject("Animaux", item);
        syncCreatorObjectRuntime("Animaux", item);
    } else {
        getCreatorContenu().Animaux.push(item);
        syncCreatorObjectRuntime("Animaux", item);
    }

    saveCreatorContenu();
    showToast(existing ? "Animal modifié" : "Animal créé", "« " + nom + " » est disponible.");
    showDevCategoryMenu("Animaux");
}
