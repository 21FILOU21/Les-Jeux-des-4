"use strict";

/* ============================================================
   game/creator-images.js — Créateur : sélection d'images PNG
   (ex-game.js : sélecteur de fichiers, data URL sans écriture
   disque, copie vers assets/, export explicite sur le disque)
============================================================ */

let devImagePickerContext = null;

function normalizeCreatorImageFilename(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "personnage";
}

function openDevImagePicker(inputSelector, previewSelector, subfolder, nomInputSelector) {
    devImagePickerContext = {
        inputSelector,
        previewSelector,
        subfolder,
        nomInputSelector
    };

    const input = $("#dev-image-input");

    if (!input) {
        showToast("Sélecteur indisponible", "Impossible d'ouvrir le sélecteur d'image.");

        return;
    }

    input.value = "";

    input.click();
}

async function handleDevImageSelected(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isPng = file.type === "image/png" || lowerName.endsWith(".png");
    const isJpg = file.type === "image/jpeg" || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");

    if (!isPng && !isJpg) {
        showToast("Format non supporté", "Choisis un fichier .png ou .jpg.");

        return;
    }

    const context = devImagePickerContext;

    if (!context) return;

    const nom = ($(context.nomInputSelector)?.value || "").trim();

    if (!nom) {
        showToast("Nom manquant", "Entre d'abord le nom avant de choisir l'image.");

        return;
    }

    let chemin = getDevImageRelativePath(file, context.subfolder);

    if (chemin) {
        showToast("Image référencée", "Le jeu conserve le chemin de l'image sans créer de copie.");
    } else {
        chemin = await fileToDataUrl(file);
        showToast("Image attachée", "Aucun chemin relatif exploitable : l'image reste temporairement en data URL.");
    }

    const input = $(context.inputSelector);

    if (input) input.value = chemin;

    if (typeof vfxHandleImagePicked === "function") {
        vfxHandleImagePicked(chemin);
    }

    const preview = $(context.previewSelector);

    if (preview) {
        preview.src = chemin;

        preview.classList.remove("hidden");
    }
}

function getDevImageRelativePath(file, subfolder) {
    const candidates = [file?.path, file?.webkitRelativePath].filter(Boolean).map(value => String(value).replace(/\\/g, "/"));
    for (const candidate of candidates) {
        const folder = String(subfolder).replace(/[^a-z0-9_-]/gi, "");
        const match = candidate.match(new RegExp("(?:^|/)assets/" + folder + "/(.+)$", "i"));
        if (match && match[1]) return "assets/" + subfolder + "/" + match[1];
        if (/^assets\//i.test(candidate)) return candidate.replace(/^\/+/, "");
    }
    return null;
}

async function copyDevImageToAssets(file, subfolder, nom) {
    if (!saveDirectoryHandle && typeof loadSavedHandles === "function") {
        await loadSavedHandles();
    }
    if (!saveDirectoryHandle) return null;

    const granted = await verifySavedDirectoryPermission();

    if (!granted) return null;

    try {
        const assetsDir = await saveDirectoryHandle.getDirectoryHandle("assets", {
            create: !0
        });

        const targetDir = await assetsDir.getDirectoryHandle(subfolder, {
            create: !0
        });

        const extension = file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name) ? "jpg" : "png";
        const safeName = normalizeCreatorImageFilename(nom);
        const fileHandle = await targetDir.getFileHandle(safeName + "." + extension, {
            create: !0
        });

        const writable = await fileHandle.createWritable();

        try {
            await writable.write(file);
        } finally {
            await writable.close();
        }

        return "assets/" + subfolder + "/" + safeName + "." + extension;
    } catch (error) {
        console.error("Copie de l'image vers assets impossible :", error);

        return null;
    }
}

async function exportCreatorImagesToAssets() {
    if (!saveDirectoryHandle && typeof loadSavedHandles === "function") {
        await loadSavedHandles();
    }

    const created = getCreatorContenu();

    if (!created) return 0;

    let exported = 0;

    const targets = [
        ... (created.Personnages || []).flatMap(p => [{ obj: p, subfolder: "personnages", field: "Image" }, { obj: p, subfolder: "personnages", field: "ImageShiny" }]),
        ... (created.Monstres || []).map(m => ({ obj: m, subfolder: "monstres", field: "Image" })),
        ... (created.Animaux || []).flatMap(a => [{ obj: a, subfolder: "animaux", field: "Image" }, { obj: a, subfolder: "animaux", field: "ImageShiny" }])
    ];

    for (const entry of targets) {
        const image = entry.obj[entry.field];

        if (!image || !String(image).startsWith("data:")) continue;

        try {
            const blob = await (await fetch(image)).blob();

            const chemin = await copyDevImageToAssets(blob, entry.subfolder, entry.obj.Nom);

            if (chemin) {
                entry.obj[entry.field] = chemin;

                exported++;
            }
        } catch (error) {
            console.error("Export d'image impossible :", error);
        }
    }

    return exported;
}

async function exportCreatorContentToDisk() {
    if (!confirm("Écrire Contenu.json + Saves.json et exporter les images vers assets/ sur le disque ?\n\n(Live Server peut recharger la page après l'écriture — c'est normal.)")) return;

    try {
        if (saveDirectoryHandle) {
            const contentHandle = await getContentFileHandle(!0);

            const file = await contentHandle.getFile();

            if (file.size > 0) {
                const text = await file.text();

                if (text.trim()) {
                    const diskContent = normalizeContenuData(JSON.parse(text));

                    /* Fusion : la mémoire (éditions en cours) gagne ;
                       le disque comble uniquement ce qui manque. */
                    ["Personnages", "Monstres", "Attaques", "Effets", "Energies", "Statuts", "Items", "Animaux"].forEach(key => {
                        diskContent[key].forEach(entry => {
                            if (!entry || !entry.Nom) return;

                            if (!contenuMemory[key].some(existing => existing && existing.Nom === entry.Nom)) {
                                contenuMemory[key].push(structuredClone(entry));
                            }
                        });
                    });
                }
            }
        }
    } catch (error) {
        console.warn("Fusion Contenu.json avant export impossible :", error);
    }

    let images = 0;

    try {
        images = await exportCreatorImagesToAssets();

        saveCreatorContenu();

        await ecrireFichierContenu();
    } catch (error) {
        console.error("Export impossible :", error);
    }

    const ok = await syncSaveFileToDisk();

    showToast(ok ? "Écriture terminée" : "Écriture impossible", ok ? `Contenu.json et Saves.json mis à jour${images > 0 ? ` · ${images} image(s) exportée(s) vers assets/` : ""}.` : "Aucun dossier/fichier accessible — utilise le menu Fichiers.");
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result || ""));

        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(file);
    });
}