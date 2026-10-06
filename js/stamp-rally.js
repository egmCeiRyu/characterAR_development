import { characters } from "./data/characters.js";

const MAX_STAMPS =
    characters.filter(character => !character.free).length;

let USER_ID = null;
let confettiPlayed = false;

const fromComplete =
    new URLSearchParams(window.location.search)
        .get("from") === "complete";

async function initStampRally() {
    const user = await initAnonymousUser();
    USER_ID = user.id;
    await loadStamps();
}

async function loadStamps() {
    if (!USER_ID) return;

    const { data, error } =
        await supabaseClient
            .from("user_stamps")
            .select("character_id")
            .eq("user_id", USER_ID);

    if (error) throw error;

    document.querySelectorAll(".stamp-card").forEach(card => {
        card.classList.add("locked");
        card.classList.remove("unlocked");

        card.disabled = true;
        card.onclick = null;
    });

    const unlocked = new Set();

    data.forEach(item => {
        const character =
            characters.find(c => !c.free && c.id === Number(item.character_id));

        if (!character) return;

        const card =
            document.querySelector(
                `.stamp-card[data-character-id="${character.id}"]`
            );

        if (!card) return;

        card.classList.remove("locked");
        card.classList.add("unlocked");

        card.disabled = true;
        card.onclick = null;

        unlocked.add(character.id);
    });

    updateStampLevel(unlocked.size);

    if (unlocked.size >= MAX_STAMPS && !fromComplete) {
        launchConfetti();
    }
}

function updateStampLevel(total) {
    const percent =
        Math.min((total / MAX_STAMPS) * 100, 100);

    const progressText =
        document.getElementById("progressText");

    const progressFill =
        document.getElementById("progressFill");

    const rewardBox =
        document.getElementById("rewardBox");

    const completeBox =
        document.getElementById("completeBox");

    if (progressText) {
        progressText.textContent =
            `${total} / ${MAX_STAMPS}`;
    }

    if (progressFill) {
        progressFill.style.width =
            `${percent}%`;
    }

    if (rewardBox && completeBox) {

        if (total >= MAX_STAMPS) {

            rewardBox.classList.add("completed");
            completeBox.style.display = "block";

            rewardBox.style.cursor = "pointer";
            completeBox.style.cursor = "pointer";

            rewardBox.onclick = () => {
                location.href = "complete.html";
            };

            completeBox.onclick = () => {
                location.href = "complete.html";
            };

        } else {

            rewardBox.classList.remove("completed");
            completeBox.style.display = "none";

            rewardBox.style.cursor = "default";
            completeBox.style.cursor = "default";

            rewardBox.onclick = null;
            completeBox.onclick = null;

        }

    }
}

async function resetStamps() {
    if (!USER_ID) return;

    const { error } = await supabaseClient
        .from("user_stamps")
        .delete()
        .eq("user_id", USER_ID);

    if (error) {
        console.error(error);
        alert("リセットに失敗しました。もう一度お試しください。");
        return;
    }
    confettiPlayed = false;

    await loadStamps();
}

function launchConfetti() {
    if (confettiPlayed) return;
    if (typeof confetti !== "function") return;

    confettiPlayed = true;

    confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
    });

    setTimeout(() => {
        confetti({
            particleCount: 80,
            spread: 100,
            origin: { y: 0.7 }
        });
    }, 400);
}

window.resetStamps = resetStamps;

initStampRally().catch(error => { console.error(error); alert("通信エラー。再読み込みしてください。"); });
