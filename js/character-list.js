import { characters } from "./data/characters.js";

const characterGrid = document.getElementById("characterGrid");

let USER_ID = null;
let collectedCharacterIds = new Set();

async function initCharacterList() {
    await loginUser();
    await loadCollectedCharacters();
    renderCharacterGrid();
}

async function loginUser() {
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session?.user) {
        USER_ID = session.user.id;
        return;
    }

    const { data, error } =
        await supabaseClient.auth.signInAnonymously();

    if (error) {
        console.error(error);
        return;
    }

    USER_ID = data.user.id;
}

async function loadCollectedCharacters() {
    if (!USER_ID) return;

    const { data, error } =
        await supabaseClient
            .from("user_stamps")
            .select("character_id")
            .eq("user_id", USER_ID);

    if (error) {
        console.error(error);
        return;
    }

    collectedCharacterIds = new Set(
        data.map(item => item.character_id)
    );
}

function renderCharacterGrid() {
    if (!characterGrid) return;

    characterGrid.innerHTML = "";

    characters.forEach(character => {
        const isCollected =
            collectedCharacterIds.has(character.id);

        const card = document.createElement("article");

        card.className = isCollected
            ? "character-card collected"
            : "character-card";

        card.dataset.characterId = character.id;

        card.innerHTML = `
            <div class="character-image-wrap">
                <img src="${character.portrait}" alt="${character.name}">
                ${isCollected ? `<div class="collected-badge">GET</div>` : ""}
            </div>

            <div class="character-name">
                ${character.name}
            </div>

            <div class="character-status">
                ${isCollected ? "獲得済み" : "未獲得"}
            </div>

            ${isCollected ? `
                <div class="character-actions">
                    <button
                        class="character-action-button ar-button"
                        type="button">
                        ARで見る
                    </button>

                    <button
                        class="character-action-button voice-button"
                        type="button">
                        音声を聞く
                    </button>
                </div>
            ` : ""}
        `;

        if (isCollected) {
            const arButton =
                card.querySelector(".ar-button");

            arButton.addEventListener("click", () => {
                location.href =
                    `character-ar.html?id=${character.id}`;
            });

            const voiceButton =
                card.querySelector(".voice-button");

            voiceButton.addEventListener("click", () => {
                location.href =
                    `character-card.html?id=${character.id}&from=character-list`;
            });
        }

        characterGrid.appendChild(card);
    });
}

initCharacterList();
