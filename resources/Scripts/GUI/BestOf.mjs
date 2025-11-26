import { showScoreMode } from "./Score/Scores.mjs";

class BestOf {

    #currentBestOf = "5";
    #bestOfEl = document.getElementById("bestOf");
    
    constructor() {

        this.#bestOfEl.addEventListener("click", () => {
            this.#nextBestOf();
        });

    }

    getBo() {
        return this.#currentBestOf;
    }
    setBo(value) {
        this.#changeBestOf(value);
    }

    #nextBestOf() {
        if (this.#currentBestOf == "X") {
            this.setBo(5);
        } else if (this.#currentBestOf == 5) {
            this.setBo("X")
        }
    }

    #changeBestOf(value) {

        if (value == "X") {

            this.#currentBestOf = "X";

            // change the visual text
            this.#bestOfEl.innerHTML = "Numbers";
            this.#bestOfEl.title = "Click to change score input mode to ticks";

            showScoreMode("X");

        } else if (value == 5) {

            this.#currentBestOf = 5;

            this.#bestOfEl.innerHTML = "Ticks";
            this.#bestOfEl.title = "Click to change score input mode to numbers";
  
			// hide the last score tick from the score ticks
            showScoreMode(5);
            
        }

    }

}

export const bestOf = new BestOf;