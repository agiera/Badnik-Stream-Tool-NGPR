import { fadeIn, fadeInMove } from "../../Utils/Fade In.mjs";
import { fadeOut, fadeOutMove } from "../../Utils/Fade Out.mjs";
import { current } from "../../Utils/Globals.mjs";
import { resizeText } from "../../Utils/Resize Text.mjs";
import { gamemode } from "../Gamemode Change.mjs";
import { fadeInTimeSc, fadeOutTimeSc } from "../ScGlobals.mjs";

const playerSize = 42;
const tagSize = 22;
const playerSizeDubs = 0;
const tagSizeDubs = 0;

export class PlayerName {

    #name = "";
    #tag = "";
    #state = "";

    #nameEl;
    #tagEl;
    #wrapperEl;

    #stateImg;
    #imgSrc;

    #side = false;

    /**
     * Controls the player's name and tags + state
     * @param {HTMLElement} nameEl - Name element
     * @param {HTMLElement} tagEl - Tag element
     * @param {HTMLElement} stateImg - state image element
     * @param {Number} id - Player Slot
     */
    constructor(nameEl, tagEl, stateImg, id) {
        this.#nameEl = nameEl;
        this.#tagEl = tagEl;
        this.#stateImg = stateImg;
        this.#wrapperEl = nameEl.parentElement;
        // this determines the direction of fade movements
        this.#side = !(id % 2 == 0);
    }

    getName() {
        return this.#name;
    }
    #setName(name) {

        // set the displayed text
        this.#nameEl.innerHTML = name;

        // resize it depending on the gamemode
        if (gamemode.getGm() == 1) {
            this.#nameEl.style.fontSize = playerSize + "px";
        } else {
            this.#nameEl.style.fontSize = playerSizeDubs + "px";
        }

    }

    getTag() {
        return this.#tag;
    }
    #setTag(tag) {

        // set the displayed text
        this.#tagEl.innerHTML = tag;

        // resize it depending on the gamemode
        if (gamemode.getGm() == 1) {
            this.#tagEl.style.fontSize = tagSize + "px";
        } else {
            this.#tagEl.style.fontSize = tagSizeDubs + "px";
        }

    }

    getState() {
        return this.#state;
    }

    /**
     * Update player name and tag + state, fading them out and in
     * @param {String} name - Name of the player
     * @param {String} tag - Tag of the player
     * @param {String} state - The player's state
     */
    async update(name, tag, state) {

        // update internal variables
        this.#name = name;
        this.#tag = tag;
        this.#state = state;
                
        // if the image to show changed
        if (this.#imgSrc != `Resources/SVGs/Flags/${state}.svg`) {

            // store for later
            this.#imgSrc = `Resources/SVGs/Flags/${state}.svg`;
        }

        let delayTime = current.delay;

        // if not loading up
        if (!false) {

            // we wont need delay
            delayTime = 0;
            // wait for the fadeout to proceed
            if (gamemode.getGm() == 2) {
                await fadeOut(this.#wrapperEl, fadeOutTimeSc);
            } else {
                await fadeOutMove(this.#wrapperEl, null, this.#side);
            }

        }

        // update them texts
        this.#setName(name);
        this.#setTag(tag);
        this.#stateImg.src = this.#imgSrc;
        resizeText(this.#wrapperEl);

        // and fade everything in!
        if (this.getName() || this.getTag() || this.getState()) { // only if theres content
            if (gamemode.getGm() == 2) {
                fadeIn(this.#wrapperEl, fadeInTimeSc, delayTime);
            } else {
                fadeInMove(this.#wrapperEl, null, this.#side, delayTime);
            }
            
        }

        if (state) {
            this.#stateImg.style.display = "inline";
          } else {
            this.#stateImg.style.display = "none";
          }

    }

    /**
     * Adapts the text elements depending on the gamemode
     * @param {Number} gamemode - Gamemode to change to
     */
    changeGm(gamemode) {

        if (gamemode == 2) { // doubles
            
            // remove and add doubles classes
            this.#wrapperEl.classList.remove("wrappersSingles");
			this.#wrapperEl.classList.add("wrappersDubs");
			// update the text size and resize it if it overflows
			this.#nameEl.style.fontSize = playerSizeDubs + "px";
			this.#tagEl.style.fontSize = tagSizeDubs + "px";
            // and, of course, resize it
			resizeText(this.#wrapperEl);

            // move that text
            if (this.#side == 1) {
                this.#wrapperEl.style.left = "2257px";
            } else {
                this.#wrapperEl.style.right = "2257px";
            }

        } else { // singles
            
            // same as doubles, but for singles
            this.#wrapperEl.classList.add("wrappersSingles");
			this.#wrapperEl.classList.remove("wrappersDubs");
			this.#nameEl.style.fontSize = playerSize + "px";
			this.#tagEl.style.fontSize = tagSize + "px";
			resizeText(this.#wrapperEl);
            if (this.#side) {
                this.#wrapperEl.style.left = "38px";
            } else {
                this.#wrapperEl.style.right = "38px";
            }

        }

    }

    /** Displays the text wrapper, fading it in */
    show() {
        if (gamemode.getGm() == 2) {
            fadeIn(this.#wrapperEl, fadeInTimeSc, current.delay);
        } else {
            fadeInMove(this.#wrapperEl, null, this.#side, current.delay);
        }
    }

}