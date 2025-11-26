import { fadeInMove, charaFadeIn, fadeIn } from "../../Utils/Fade In.mjs";
import { fadeOutMove, charaFadeOut, fadeOut } from "../../Utils/Fade Out.mjs";
import { current } from "../../Utils/Globals.mjs";
import { fadeInTimeSc, fadeOutTimeSc, introDelaySc } from "../ScGlobals.mjs";

export class PlayerCharacter {

    #charSrc = "";
    #olSrc = "";

    #charEl;
    #olEl;

    /**
     * Controls the player's character, trail and overlay
     * @param {HTMLElement} charEl - Element containing character image
     * @param {HTMLElement} olEl - Element containing overlay image
     */
    constructor(charEl, olEl) {

        this.#charEl = charEl;
        this.#olEl = olEl;

    }

     /**
     * Updates the player's character element
     * @param {Object} data - Data for the VS Screen
     * @returns {Promise <() => void>} Promise with fade in animation function
     */
    
    update(data) {

        // update that overlay
        this.#updateBg(data.olImg);

        // update that character
        return this.#updateChar(data);

    }
    
    /**
     * Updates the player's character element
     * @param {Object} data - Data for the VS Screen
     * @returns {Promise <() => void>} Promise with fade in animation function
     */
    
    async #updateChar(data) {

        // if that character image is not the same as the local one
        if (this.#charSrc != data.charImg) {

            // calculate delay for the final fade in
            const fadeInDelay = current.startup ? current.delay + .15 : 0;

            // remember the change
            this.#charSrc = data.charImg;
            
            // dont do this if loading
            if (!current.startup) {
                await fadeOutMove(this.#charEl, true, true);
            }

            // update that image
            this.#charEl.src = data.charImg;

            // position the character
            const pos = data.charPos;
			pos[0] += 5; //horizontal
			pos[1] += 7; //vertical
            this.#charEl.style.transform = `translate(${pos[0]}px, ${pos[1]}px) scale(${pos[2]})`;

            // this will make the thing wait till the image is fully loaded
            await this.#charEl.decode();

            // return the fade in animation, to be used when rest of players load
            return () => this.fadeInChar(fadeInDelay);
            
        }

    }
    
    /** Fade that character in, will activate from the outside */
    fadeInChar(delay) {
        fadeInMove(this.#charEl, true, false, delay);
    }
    /**
     * Updates the character's background video
     * @param {String} olSrc - Background source path
     */
    async #updateBg(olSrc) {

        // if the path isnt the same
        if (this.#olSrc != olSrc) {

            // update it
            this.#olEl.src = olSrc;

            // remember, remember
            this.#olSrc = olSrc;

        }

    }

    
    /**
     * Adapts the character image to singles or doubles
     * @param {Number} gamemode - New gamemode
     */
    changeGm(gamemode) {

        if (gamemode == 2) { // doubles
            this.#charEl.parentElement.parentElement.classList.add("charTop");
        } else { // singles
            this.#charEl.parentElement.parentElement.classList.remove("charTop");
        }

    }
    
    /** Hides the character's images */
    hide() {
        this.#olEl.style.display = "none";
        this.#olEl.style.animation = "";
    }
    
    /** Displays hidden image, fading it in */
    show() {
        this.fadeInChar(current.delay+.15);
    }

}
