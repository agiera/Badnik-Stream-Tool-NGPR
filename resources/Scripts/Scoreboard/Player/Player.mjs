import { PlayerCharacter } from "./Player Character.mjs";
import { PlayerName } from "./Player Name.mjs";
import { PlayerInfo } from "./Player Pronouns.mjs";

export class Player {

    #pName;
    #pProns;
    #pChar;

    /**
     * Manages all info related to a player on the Scoreboard
     * @param {HTMLElement} wrapEl - Wrapper containing name and tag + state
     * @param {HTMLElement} pronEl - Element containing player pronouns
     * @param {HTMLElement} charEl - Element containing character image
     * @param {HTMLElement} olEl - Element containing overlay image
     * @param {Number} id - Player slot
     */
    constructor(wrapEl, pronEl, charEl, olEl, id) {

        // player name and tag and state
        const nameEl = wrapEl.getElementsByClassName("names")[0];
        const tagEl = wrapEl.getElementsByClassName("tags")[0];
        const stateImg = wrapEl.getElementsByClassName("states")[0];
        this.#pName = new PlayerName(nameEl, tagEl, stateImg, id);

        // player info
        this.#pProns = new PlayerInfo(pronEl, id);

        // player character
        this.#pChar = new PlayerCharacter(charEl, olEl);

    }

    /**
     * Gets this player's name class
     * @returns {PlayerName}
     */
    name() {
        return this.#pName;
    }

    /**
     * Gets this player's pronouns class
     * @returns {PlayerInfo}
     */
    info() {
        return this.#pProns;
    }

    /**
     * Gets this player's character class
     * @returns {PlayerCharacter}
     */
    char() {
        return this.#pChar;
    }

    /**
     * Update player name and tag + state, fading them out and in
     * @param {String} name - Name of the player
     * @param {String} tag - Tag of the player
     * @param {String} state - State of the player
     */
    updateName(name, tag, state) {

        // if either name or tag do not match
        if (name != this.#pName.getName() || tag != this.#pName.getTag() || state != this.#pName.getState()) {
            this.#pName.update(name, tag, state);
        }

    }

    /**
     * Updates the displayed player info (pronouns, socials)
     * @param {String} pronouns - The player's pronouns
     */
    updatePronouns(pronouns) {

        if (this.#pProns.getPronouns() != pronouns) {
            this.#pProns.update(pronouns);
        }

    }

    /**
     * Updates all player's character elements
     * @param {Object} scData - Data for the Scoreboard
     * @returns {Promise <() => void>} Promise with fade in animation function
     */
    updateChar(scData) {

        return this.#pChar.update(scData);

    }

    /**
     * Adapts player to the selected gamemode
     * @param {Number} gamemode - Gamemode to change to
     */
    changeGm(gamemode) {
        this.#pName.changeGm(gamemode);
        this.#pChar.changeGm(gamemode);
    }

    /** Display elements and animations when user comes back to the browser */
    show() {
        this.#pName.show();
        this.#pChar.show();
    }

}
