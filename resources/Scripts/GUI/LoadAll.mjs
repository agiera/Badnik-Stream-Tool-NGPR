import { startGG } from "../GUI Plugins/startGGIntegration.mjs";
import { displayNotif } from "./Notifications.mjs";

const loadAllButton = document.getElementById('loadAllRegion');

loadAllButton.addEventListener('click', async () => {
    const eventIdInput = document.getElementById('startGGEventId');
    if (eventIdInput && eventIdInput.value) {
        await startGG.getEntrantsForEvent(eventIdInput.value);
        // document.getElementById('startGGPopulateTournamentName').click();
        await startGG.getTop8(eventIdInput.value);
        startGG.getNextStreamSet();
    } else {
        displayNotif('No event URL/ID set in StartGG settings');
        console.log('No event URL/ID set in StartGG settings');
    }
});
