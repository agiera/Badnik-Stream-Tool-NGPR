/**
 * TODO:
 * Setup API to do the following:
 * Find current Event by Event ID (this is the only thing it should require entry for)
 * Get all entrants for event. Generate a list of Entrants for later use. Auto update pronouns (if not blank)
 * Get all characters. Cross check our current characters to ensure values didn't change.
 * For getting fast setup, have a dropdown that lets us select a player (or just select one as if you are starting the next set) and have it grab the current set for that player (along with their opponent).
 * During the set, save all set information (game 1 game 2 etc, characters)
 * After set is finished (need multiple ways to trigger this, such as: from automation, when update is clicked and player has boX wins, button click to send data)
 * Clear current data. Move onto next set.
 */


import { clear } from "../GUI/Clear.mjs"
import { getCharacterList, getJson, saveJson, getPresetList} from "../GUI/File System.mjs";
import { inside, current, stPath, realPath } from "../GUI/Globals.mjs";
import { displayNotif } from "../GUI/Notifications.mjs";
import { players, clearPlayers, bracketPlayers } from "../GUI/Player/Players.mjs";
import { clearScores, scores } from "../GUI/Score/Scores.mjs";
import { clearTeams } from "../GUI/Team/Teams.mjs";
import { guiSection } from "./EasyGUISection.mjs";
import { tournament } from "../GUI/Tournament.mjs";
import { round } from "../GUI/Round.mjs";
import { updateBracket, bracketData } from "../GUI/Bracket.mjs";
import { bestOf } from "../GUI/BestOf.mjs";


const updateDiv = document.getElementById('updateRegion');

const newToggles = [{
    id: "startGGEventId",
    title: "You can use one of two values:\n1. Pass in the URL of the tournament like this: 'https://www.start.gg/tournament/undertow-2024/event/project-singles'\n2. Event ID. This can be found by viewing a bracket from an admin view, then looking at the URL for a number.",
    innerText: "Event (URL or ID)",
    type: "text",
    disabled: false,
    className: "textInput"
},
{
    id: "startGGGetParticipants", //We call it participants, cuz the main focus is the entrants. The additional information isn't as important.
    title: "Gets event information.",
    innerText: "Get Event Information",
    type: "button",
    disabled: false,
    className: "settingsButton"
},
{
    id: "startGGPopulateTournamentName",
    title: "Sets the Tournament Name to name of the tournament.",
    innerText: "Populate Tournament Name",
    type: "button",
    disabled: false,
    className: "settingsButton"
},
{
    id: "startGGSetGame",
    title: "Sets the Game to game used in the event.",
    innerText: "Populate Game from Event",
    type: "button",
    disabled: false,
    className: "settingsButton"
},
{
    id: "startGGGetTop8",
    title: "Gets the top 8 set information and fill the bracket. Only works if the top 8 bracket is entirely in the last phase.",
    innerText: "Populate top 8 bracket",
    type: "button",
    disabled: false,
    className: "settingsButton"
},
{
    id: "startGGPlayerSelect",
    title: "Select a player",
    innerText: "Select a player",
    type: "select",
    disabled: false,
    className: "textInput",
	settingsBoxOverride: "settingsBoxBlockOverride", //adds another class
    options: []
},
{
	id: "startGGPrioritizeStartGGData",
	title: "If checked, the Player Profile will be set with StartGG data (sponsor/pronouns/socials).",
	innerText: "Prioritize StartGG Data",
	type: "checkbox",
	disabled: false,
	className: "settingsCheck"
},
{
	id: "startGGPrioritizeNonEmptyData",
	title: "If checked, the Player Profile will fill in Empty spots from StartGG/Playerinfo.json if a value exists.\nExample: Pronouns are set on StartGG but not on player profile, it will use the StartGG Pronouns even if you have Prioritize StartGG Data unchecked.",
	innerText: "Prioritize Non Empty Values",
	type: "checkbox",
	disabled: false,
	className: "settingsCheck"
},
{
	id: "startGGPopulateRoundName",
	title: "If checked, the round name will populate based upon the name provided in StartGG",
	innerText: "Populate Round Name",
	type: "checkbox",
	disabled: false,
	className: "settingsCheck"
},
// {
// 	id: "startGGPopulateTournamentName",
// 	title: "If checked, the tournament name will populate based upon the name provided in StartGG.",
// 	innerText: "Populate Tournament Name",
// 	type: "checkbox",
// 	disabled: false,
// 	className: "settingsCheck"
// },
// {
// 	id: "startGGSetGame",
// 	title: "If checked, the game will be set to the same one used for the event (requires the folder system to be setup with that game being available).",
// 	innerText: "Set Game Based on Event",
// 	type: "checkbox",
// 	disabled: false,
// 	className: "settingsCheck"
// },
{
    id: "startGGGetSetData",
    title: "Gets the set information based upon player. Will populate both players, along with their profiles.",
    innerText: "Populate current match info from Player",
    type: "button",
    disabled: false,
    className: "settingsButton"
},
{
    id: "startGGAutoUpdateSetData",
    title: "When enabled, all score changes are applied to StartGG set if applicable. If disabled, you will need to press 'Update StartGG Set' button to apply changes.",
    innerText: "Auto Report on Score change",
    type: "checkbox",
    disabled: false,
    className: "settingsCheck"
},
{
    id: "startGGUpdateSetData",
    title: "Reports the set information based upon the current match information.",
    innerText: "Update StartGG Set",
    type: "button",
    disabled: false,
    className: "settingsButton"
},
{
    id: "startGGApiKey",
    title: "Your Start.gg API key. Get one at https://start.gg/admin/profile/developer",
    innerText: "API Key",
    type: "password",
    disabled: false,
    className: "textInput"
}
]

const divs = guiSection.genGuiSection('StartGG', 'top', newToggles, 1, false);

class StartGG {
    #apiKeyInput = document.getElementById('startGGApiKey');
    #eventIdInput = document.getElementById('startGGEventId');
    #participantsBtn = document.getElementById('startGGGetParticipants');
    #startGGPlayerSelect = document.getElementById('startGGPlayerSelect');
    #startGGPrioritizeStartGGDataCheck = document.getElementById('startGGPrioritizeStartGGData');
	#startGGPrioritizeNonEmptyDataCheck = document.getElementById('startGGPrioritizeNonEmptyData');
	#startGGPopulateRoundNameCheck = document.getElementById('startGGPopulateRoundName');
	#useCustomRoundCheck = document.getElementById('customRound');
	// #startGGPopulateTournamentNameCheck = document.getElementById('startGGPopulateTournamentName');
	// #startGGSetGameCheck = document.getElementById('startGGSetGame');


	#startGGGetSetDataBtn = document.getElementById('startGGGetSetData');
	#startGGAutoUpdateSetDataCheck = document.getElementById('startGGAutoUpdateSetData');
	#startGGUpdateSetDataBtn = document.getElementById('startGGUpdateSetData');
	#startGGGetTop8Btn = document.getElementById('startGGGetTop8');
	#startGGPopulateTournamentNameBtn = document.getElementById('startGGPopulateTournamentName');
	#startGGSetGameBtn = document.getElementById('startGGSetGame');

	#lastElement = divs.prevDiv;

    #players = [];
	#playerPresets = [];
    #currentSetInfo = {};
	#top8Sets = [];
	#top8PhaseId = '';

	#previousScores = [0, 0];

	#gameForEvent = "";
	#eventId = "";
	#tournamentName = "";

	#characterList = [];

	#reportSetProcessing = false;

	#top8RoundNamesMatrix = [ //these are top 6, to find top 8 we have to get the farthest in losers round.
		{'ggName':'Grand Final Reset', 'stName': 'True Finals'},
		{'ggName':'Grand Final', 'stName': 'Grand Finals'},
		{'ggName':'Winners Final', 'stName': 'Winners Finals'},
		{'ggName':'Winners Semi-Final', 'stName': 'Winners Semis'},
		{'ggName':'Losers Final', 'stName': 'Losers Finals'},
		{'ggName':'Losers Semi-Final', 'stName': 'Losers Semis'},
		{'ggName':'Losers Quarter-Final', 'stName': 'Losers Quarters'}
	];

    constructor() {
		this.setPlayerPresets();
        this.#participantsBtn.addEventListener("click", () => this.getEntrantsForEvent(this.#eventIdInput.value));
        this.#startGGGetSetDataBtn.addEventListener("click", () =>  this.getPlayerSetInfo(this.#startGGPlayerSelect.value,this.#eventId));
		// this.#startGGAutoUpdateSetDataCheck.addEventListener("click", () => this.toggleAutoReporting());
		this.#startGGUpdateSetDataBtn.addEventListener("click", () => this.reportSet());
		this.#startGGGetTop8Btn.addEventListener("click", () => this.getTop8(this.#eventId, this.#top8PhaseId));

		this.#startGGPopulateRoundNameCheck.addEventListener('click', () => this.populateRoundClicked());
		this.#useCustomRoundCheck.addEventListener('click', () => this.customRoundClicked());
		this.#startGGPopulateTournamentNameBtn.addEventListener('click', () => this.setTournamentName());
		this.#startGGSetGameBtn.addEventListener('click', ()=> this.setGame());

		// Save API key when it changes
		this.#apiKeyInput.addEventListener('blur', () => this.saveApiKey(this.#apiKeyInput.value));

		updateDiv.addEventListener('click', ()=> (this.isAutoReportSetEnabled()) ? this.updateAndReport() : this.updateSetInfo() );
		this.toggleElems(false);

		// Load saved API key and event URL
		this.loadApiKey().then(savedKey => {
			if (savedKey) {
				this.#apiKeyInput.value = savedKey;
			} else {
				return;
			}
			this.loadEventUrl().then(savedUrl => {
				if (savedUrl) {
					this.#eventIdInput.value = savedUrl;
				} else {
					return;
				}
				this.getEntrantsForEvent(savedUrl).then(() => {
					this.#startGGPopulateTournamentNameBtn.click();
				});
			});
		});

    }

	toggleElems (showElems) {
		for (let i = 2; i < divs.toggleDivs.length - 1; i++) { //skip first 2 (Event ID, Get Event button) and last 1 (API key)
			if (divs.toggleDivs[i].classList.contains('hidden') ) {
				if (showElems) {
					divs.toggleDivs[i].classList.remove('hidden');
				}
			} else {
				if (!showElems) {
					divs.toggleDivs[i].classList.add('hidden');
				}
			}
		}
	}

	async updateAndReport() {
		if(await this.updateSetInfo()) {
			await this.reportSet();
		}
	}

    /**
     * states:
     * - 1 - Not Started
     * - 2 - In Progress
     * - 3 - Complete
     * - 6 - Check-in
     * 
     * Currently, this only gets items that are In Progress. So first, set your people to play and put their set to In Progress. It will then find that set and pull the data automatically for it into the tool.
     * Since this is based upon a player and event, it should only ever return 1 game.
     * NOTE: Round Robin may cause issues
     */

	isAutoReportSetEnabled() {
		return this.#startGGAutoUpdateSetDataCheck.checked;
	}

	async loadApiKey() {
		const guiSettings = await getJson(`${stPath.text}/GUI Settings`);
		return guiSettings.startGGApiKey || '';
	}

	async saveApiKey(apiKey) {
		const guiSettings = await getJson(`${stPath.text}/GUI Settings`);
		guiSettings.startGGApiKey = apiKey;
		await saveJson(`/GUI Settings`, guiSettings);
	}

	async loadEventUrl() {
		const guiSettings = await getJson(`${stPath.text}/GUI Settings`);
		return guiSettings.startGGEventUrl || '';
	}

	async saveEventUrl(url) {
		const guiSettings = await getJson(`${stPath.text}/GUI Settings`);
		guiSettings.startGGEventUrl = url;
		await saveJson(`/GUI Settings`, guiSettings);
	}

	customRoundClicked() {
		if (!this.#useCustomRoundCheck.checked) {
			this.#startGGPopulateRoundNameCheck.checked = false
		}
	}

	populateRoundClicked() {
		if (this.#startGGPopulateRoundNameCheck.checked) {
			if (!this.#useCustomRoundCheck.checked) {
				this.#useCustomRoundCheck.click();
			}
		}
	}

	validEventId() {
		if (this.#eventId) {
			return true;
		}
		displayNotif('Missing event information.');
		return false;
	}

	setTournamentName() {
		if (this.validEventId()) {
			tournament.setText(this.#tournamentName);
		}
	}

	async setGame() {
		if (this.validEventId()) {
			this.#gameForEvent = { name: "Project+" };
		}
	}

	async getTop8(eventId, top8PhaseId) {
		if (!this.validEventId()) {
			return;
		}
		if (!top8PhaseId) {
			displayNotif('Unable to find top 8 information.'); //This should never hit. Only hits if there are no phases (which means the event wasn't setup)
			return;
		}
		let query = `
		query EventSets($eventId: ID!, $page: Int!, $perPage: Int!) {
			event(id: $eventId) {
			  id
			  name
			  sets(
				page: $page
				perPage: $perPage
				sortType: STANDARD,
				filters: {
					phaseIds: ${top8PhaseId}
				}
			  ) {
				pageInfo {
					total
					totalPages
				}

				nodes {
				  round
				  fullRoundText
				  id
				  slots {
					prereqId
					standing {
					  entrant {
						id
						name
					  }
					  stats {
						score {
						  value
						}
					  }
					}
				  }
				}
			  }
			}
		  }
		`;

		let variables = {
			"eventId": eventId,
			"page": 1,
			"perPage": 25
		}

		displayNotif('Retreiving top 8 bracket information...');
		let json = await this.generalApiCall(query, variables, 'data.event.sets');
		this.#top8Sets = this.getTop8SetsData(json);

		this.saveToBracket();
	}

	async saveToBracket() {
		let setsCounts = {};
		let bracketRoundSelect = document.getElementById('bracketRoundSelect');
		let newBracketData = JSON.parse(JSON.stringify(bracketData));

		for (let i in this.#top8Sets) {
			let stRoundName = "";
			try {
				stRoundName = this.getStRoundName(this.#top8Sets[i].fullRoundText).replaceAll(' ', '');
			} catch (e) {
				stRoundName = 'LosersTop8';
			}

			let curSetNum = 0;

			for (let p in this.#top8Sets[i].slots) { //Player 1 and 2 slots
				if (!setsCounts[stRoundName] && setsCounts[stRoundName] != 0) {//each index count is the player, since its done by an array of players.
					setsCounts[stRoundName] = 0;
				} else {
					setsCounts[stRoundName] += 1;
				}

				curSetNum = setsCounts[stRoundName];


				const slot = this.#top8Sets[i].slots[p];

				let setScore = '-';
				let playerInfo = {
					name: '-',
					tag: '',
					character: "None",
					skin: "-",
					iconSrc: ""
				}

				let defaultSkin = {
					character: "None",
					skin: "-",
					iconSrc: ""
				}

				/*TODO:
					eventually, get character information (if possible)
					clear character data when populating a blank set (to ensure if something changed we dont represent the wrong characters)


					code used to update char/skin on bracket.mjs
					    await bracketPlayers[num+i].charChange(players[i].char, true);
						bracketPlayers[num+i].skinChange(players[i].skin);

					Defaults:
						character: "None",
						skin: "-",
						iconSrc: "",

					Bare minimum: Add checkbox to prevent overwriting character data when set doesn't have new player data (ie, player names didn't change)
				*/

				if (slot.standing) {
					setScore = slot.standing.stats.score.value;
					const entrant = slot.standing.entrant.id;
					playerInfo = JSON.parse(JSON.stringify(this.getCombinedPlayerDataFromEntrantId(entrant)));
				}
				if (bracketRoundSelect.value == stRoundName) {
					let newPlayer = (bracketPlayers[curSetNum].nameInp.value != playerInfo.name);

					//Updates the GUI version because... reasons.
					bracketPlayers[curSetNum].setName(playerInfo.name);
					bracketPlayers[curSetNum].setTag(playerInfo.tag);
					bracketPlayers[curSetNum].setScore(setScore);

					if (newPlayer) { //reset skins
						await bracketPlayers[curSetNum].charChange(defaultSkin.character, true);
						bracketPlayers[curSetNum].skinChange(defaultSkin.skin);
					}
				} else {
					let newPlayer = (newBracketData[stRoundName][curSetNum].name != playerInfo.name);

					//This updates the bracket data itself.
					newBracketData[stRoundName][curSetNum].name = playerInfo.name;
					newBracketData[stRoundName][curSetNum].tag = playerInfo.tag;
					newBracketData[stRoundName][curSetNum].score = setScore;
					if (newPlayer) {
						newBracketData[stRoundName][curSetNum].character = defaultSkin.character;
						newBracketData[stRoundName][curSetNum].skin = defaultSkin.skin;
						newBracketData[stRoundName][curSetNum].iconSrc= defaultSkin.iconSrc;
						// newBracketData[stRoundName][curSetNum].character = playerInfo.character;
						// newBracketData[stRoundName][curSetNum].skin = playerInfo.skin;
						// newBracketData[stRoundName][curSetNum].iconSrc= playerInfo.iconSrc;
					}
				}
			}
		}

		for (let i in newBracketData) {
			if (i == 'id' || i == 'message') {
				continue;
			}
			for (let j in newBracketData[i]) {
				bracketData[i][j] = newBracketData[i][j]
			}
		}

		await updateBracket();
	}

	getTop8SetsData (json) {
		let prereqIds = [];
		let top8Only = [];
		for (let i in json.data.event.sets.nodes) {
			let set = json.data.event.sets.nodes[i];
			set.id = "" + set.id; //Convert to string for items that are not int.
			if (this.getStRoundName(set.fullRoundText)) {
				top8Only.push(JSON.parse(JSON.stringify(set)));
				if(set.fullRoundText == 'Losers Quarter-Final') {
					prereqIds.push("" + set.slots[0].prereqId);
					prereqIds.push("" + set.slots[1].prereqId);
				}
			}
		}

		top8Only = top8Only.concat(this.getLosersTop8SetsData(json, prereqIds));
		return top8Only;
	}

	getLosersTop8SetsData (json, prereqIds) {
		let top8Only = [];
		for (let i in json.data.event.sets.nodes) {
			let set = json.data.event.sets.nodes[i];
			set.id = "" + set.id; //Convert to string for items that are not int.
			if (prereqIds.includes(set.id) && set.fullRoundText.indexOf('Winners') == -1) { //ensures we only grab losers sets.
				top8Only.push(JSON.parse(JSON.stringify(set)));
			}
		}
		return top8Only;
	}

	getStRoundName(roundName) {
		for (let i in this.#top8RoundNamesMatrix) {
			if (this.#top8RoundNamesMatrix[i].ggName == roundName) {
				return this.#top8RoundNamesMatrix[i].stName;
			}
		}
		return false;
	}

	resetPreviousScore() {
		this.#previousScores = [0,0];
	}

	/**
	 * Gets the next set marked for stream that hasn't been completed yet.
	 * Falls back to returning a set with both entrants if no stream sets are pending.
	 * @returns {Object|null} The set data or null if no suitable set found
	 */
	async getNextStreamSet() {
		try {
			if (!this.validEventId()) {
				return null;
			}

			let query = `
			query EventSets($eventId: ID!, $page: Int!, $perPage: Int!) {
				event(id: $eventId) {
				  id
				  name
				  sets(
					page: $page
					perPage: $perPage
					sortType: STANDARD
					filters: {
						state: [1, 2]
					}
				  ) {
					pageInfo {
						total
						totalPages
					}
					nodes {
					  id
					  state
					  fullRoundText
					  completedAt
					  stream {
						id
						streamName
					  }
					  slots {
						id
						entrant {
						  id
						}
						prereqType
						prereqId
					  }
					}
				  }
				}
			  }
			`;

			let variables = {
				"eventId": this.#eventId,
				"page": 1,
				"perPage": 100
			}

			displayNotif('Looking for next stream set...');
			const json = await this.generalApiCall(query, variables, 'data.event.sets');

			if (!json.data || !json.data.event || !json.data.event.sets) {
				displayNotif('Failed to retrieve sets from event');
				return null;
			}

			const sets = json.data.event.sets.nodes;

			// First priority: find earliest set marked for stream that's not completed
			const streamSets = sets.filter(set =>
				set.stream !== null &&
				set.completedAt === null &&
				set.slots[0].entrant !== null &&
				set.slots[1].entrant !== null
			);

			if (streamSets.length > 0) {
				displayNotif('Found stream set');
				await this.updateCurrentSet(streamSets[0]);
				return streamSets[0]; // Return the first (earliest) stream set
			}

			// Second priority: find sets with both entrants populated
			const readySets = sets.filter(set =>
				set.completedAt === null &&
				set.slots[0].entrant !== null &&
				set.slots[1].entrant !== null
			);

			if (readySets.length === 1) {
				displayNotif('Found single ready set');
				await this.updateCurrentSet(readySets[0]);
				return readySets[0];
			}

			// No suitable set found
			displayNotif('No pending stream sets found');
			return null;

		} catch (e) {
			console.error('Error getting next stream set:', e);
			console.error(e.stack);
			displayNotif('Error retrieving stream set');
			return null;
		}
	}

    async getPlayerSetInfo(playerName, eventId) {
		try {
			if (!this.validEventId()) {
				return;
			}

			if (!playerName) {
				displayNotif('Must select a valid player');
				return;
			}

			let playerId = "";

			let player = JSON.parse(this.getPlayerFromPlayerList("tag", playerName));

			if (player.playerId) {
				playerId = player.playerId;
			}

			if (!playerId) {
			  displayNotif('Must select a valid player');
			  return;
			}


			let query = `
			query EventSets($eventId: ID!) {
				event(id: $eventId) {
				  id
				  name
				  sets(filters: {
					playerIds: ${playerId}
					state: 2
				  }) {
					nodes {
					  state
					  id
					  fullRoundText
					  slots {
						id
						entrant{
						  id
						  participants {
							id
							player {
							  id
							}
						  }
						}
					  }
					}
				  }
				}
			  }
			`;

			let variables = {
				"eventId": eventId
			}

			let json = await this.generalApiCall(query, variables);

			if (json.data.event.sets.nodes.length != 1) {
				displayNotif('No active sets for selected player. StartGG may be a little slow...');
				return;
			}

			await this.updateCurrentSet(json.data.event.sets.nodes[0]);

		} catch (e) {
			console.log(e);
		}
	}

	async updateCurrentSet(setJson) {
		clearTeams();
		clearPlayers();
		clearScores();
		this.resetPreviousScore();

		this.#currentSetInfo = {};
		this.#currentSetInfo.useDetailedReportType = true;
		this.#currentSetInfo.setDataSimple = {};
		this.#currentSetInfo.setDataDetailed = {};

		// State of 2 means in progress.
		// We only want this cuz a player should only be in one active set per event at a time.
		// https://smashgg-schema.netlify.app/reference/activitystate.doc
		if (setJson.state == 3) {
			displayNotif('No active sets for selected player. StartGG may be a little slow...');
			return;
		}
		this.#currentSetInfo = setJson;
		this.#currentSetInfo.useDetailedReportType = true;
		this.#currentSetInfo.setDataSimple = {};
		this.#currentSetInfo.setDataDetailed = {};

		await this.setPlayersInTool();
	}

	async setPlayersInTool () {
		if (!this.#currentSetInfo || this.#currentSetInfo.slots.length <= 0) {
			displayNotif('No match in progress for selected player');
			return;
		}

		for (let i = 0; i < 2; i++) {
			const entrantId = this.#currentSetInfo.slots[i].entrant.id;
			let playerCombinedJson = this.getCombinedPlayerDataFromEntrantId(entrantId);
			// Update or create player preset file with playerId

			console.log('playerCombinedJson:', JSON.stringify(playerCombinedJson, null, 2));
			// Set player
			await players[i].updateFromPreset(playerCombinedJson);
			await players[i].saveProfileInfo();
			// Set initial scores to zero
			scores[i].setScore(0);
		}
		if (this.#startGGPopulateRoundNameCheck.checked) {
			round.setText(this.getCorrectedRoundName(this.#currentSetInfo.fullRoundText));
		}

		displayNotif('Successfully populated match information.')
	}

	getCombinedPlayerDataFromEntrantId(entrantId) {
		console.log('[StartGG] getCombinedPlayerDataFromEntrantId - entrantId:', entrantId);
		if (!entrantId) {
			console.warn('[StartGG] No entrantId provided');
			return;
		}
		const useStartGGData = this.#startGGPrioritizeStartGGDataCheck.checked;
		const useNonEmptyData = this.#startGGPrioritizeNonEmptyDataCheck.checked;
		console.log('[StartGG] Settings - useStartGGData:', useStartGGData, 'useNonEmptyData:', useNonEmptyData);

		let playerData = (JSON.parse(this.getPlayerFromPlayerList('entrantId', entrantId)));
		console.log('[StartGG] Player data from list:', JSON.stringify(playerData, null, 2));

		let playerReturnObj = {
			name: playerData.tag,
			tag: playerData.sponsor,
			pronouns: (playerData.user && playerData.user.genderPronoun) ? playerData.user.genderPronoun : '',
			socials: (playerData.user && playerData.user.authorizations) ? this.getSocialsInCorrectFormat(playerData.user.authorizations) : '',
			characters: []
		}
		console.log('[StartGG] Initial return object:', JSON.stringify(playerReturnObj, null, 2));

		this.setPlayerPresets();
		for (let p in this.#playerPresets) {
			const preset = this.#playerPresets[p];

			if (preset.playerId == playerData.playerId || preset.name == playerReturnObj.name) {
				console.log('[StartGG] Found matching preset:', preset.name);
				console.log('[StartGG] Preset data:', JSON.stringify(preset, null, 2));
				playerReturnObj.tag = this.getPlayerFieldValue(playerReturnObj.tag, preset.tag, useStartGGData, useNonEmptyData);
				playerReturnObj.playerId = this.getPlayerFieldValue(playerReturnObj.playerId, preset.playerId, useStartGGData, useNonEmptyData);
				playerReturnObj.pronouns = this.getPlayerFieldValue(playerReturnObj.pronouns, preset.pronouns, useStartGGData, useNonEmptyData);
				playerReturnObj.socials = this.getPlayerFieldValue(playerReturnObj.socials, preset.socials, useStartGGData, useNonEmptyData);
				playerReturnObj.characters = this.getPlayerFieldValue(playerReturnObj.characters, preset.characters, useStartGGData, useNonEmptyData);
				console.log('[StartGG] After merging with preset:', JSON.stringify(playerReturnObj, null, 2));
				break;
			}
		}

		console.log('[StartGG] Final combined data:', JSON.stringify(playerReturnObj, null, 2));
		return JSON.parse(JSON.stringify(playerReturnObj));

	}

	getPlayerFieldValue(startGGValue, presetValue, useStartGGValues, prioritizeNonEmpty) {
		let value;

		if (useStartGGValues && !prioritizeNonEmpty) {
			return startGGValue;
		}
		if (!useStartGGValues && !prioritizeNonEmpty) {
			return presetValue;
		}

		if (startGGValue === undefined || startGGValue === null || startGGValue === '') {
			return presetValue;
		}
		if (presetValue === undefined || presetValue === null || presetValue === '') {
			return startGGValue;
		}

		if (typeof startGGValue == 'object' && Array.isArray(startGGValue)
			&& typeof presetValue == 'object' && Array.isArray(presetValue)
		) {
			value = [];
			const maxLen = Math.max(startGGValue.length, presetValue.length);
			for (let i = 0; i < maxLen; i++) {
				value[i] = this.getPlayerFieldValue(startGGValue[i], presetValue[i], useStartGGValues, prioritizeNonEmpty);
			}
		} else if (typeof startGGValue == 'object' && typeof presetValue == 'object'
			&& !startGGValue instanceof String && !presetValue instanceof String
		) { // non-string objects
			value = {};
			for (let key in (startGGValue.keys + presetValue.keys)) {
				value[i] = this.getPlayerFieldValue(startGGValue[key], presetValue[key], useStartGGValues, prioritizeNonEmpty);
			}
		} else { //Simple
			if (useStartGGValues) {
				if (prioritizeNonEmpty) {
					value = startGGValue ? startGGValue : presetValue;
				} else {
					value = startGGValue;
				}
			} else {
				if (prioritizeNonEmpty) {
					value = presetValue ? presetValue : startGGValue;
				} else {
					value = presetValue;
				}
			}
		}
		return value;
	}

	getCorrectedRoundName (roundName) {
		if (roundName.indexOf('-Final') != -1) { //Convert Quarter-Final and Semi-Final to look like Quarters and Semis.
			roundName = roundName.replace('-Final', 's');
		}

		if (roundName.indexOf(' Final') != -1) { //Convert Losers/Winners/Grand Final to Finals
			roundName = roundName.replace(' Final', ' Finals');
		}
		return roundName;
	}

	getSocialsInCorrectFormat(startGGAuthorizationJson) {
		let socialJson = {};

		for (let i in startGGAuthorizationJson) {
			const type = startGGAuthorizationJson[i].type.toLowerCase();
			switch (type) {
				case "twitter":
					socialJson.twitter = startGGAuthorizationJson[i].externalUsername;
					break;
				case "twitch":
					socialJson.twitch = startGGAuthorizationJson[i].externalUsername;
					break;
				case "discord":
					//Currently not supported.
					break;
				default:
					break;
			}
		}

		return socialJson;
	}

	getGameStats(previousScores, curScores) {
		let winnerNum = null;
		if (previousScores[0] < curScores[0] && previousScores[1] == curScores[1]) {
			winnerNum = 0;
		} else if (previousScores[1] < curScores[1] && previousScores[0] == curScores[0]) {
			winnerNum = 1;
		} else {
			return '';
		}

		let loserNum = (winnerNum == 0) ? 1 : 0;

		let gameStatObj = {
			winnerId: this.getEntrantIdFromPlayerName(players[winnerNum].nameInp.value),
			winnnerChar: this.getCharacterIdFromCharacterName(players[winnerNum].char),
			loserId: this.getEntrantIdFromPlayerName(players[loserNum].nameInp.value),
			loserChar: this.getCharacterIdFromCharacterName(players[loserNum].char)
		}

		return gameStatObj;
	}

	getCharacterIdFromCharacterName(charName) {
		let charId = 0;
		if (!charName) {
			return charId
		}
		for (let i in this.#gameForEvent.characters) {
			let char =  this.#gameForEvent.characters[i];
			if (char.name.indexOf(charName) != -1 || charName.indexOf(char.name) != -1) {
				charId = char.id;
				break;
			}
		}
		return charId;
	}

	getSetWinner(curScores) {
		let playerNum = null;

		if (curScores[0] > curScores[1]) {
			playerNum = 0;
		} else {
			playerNum = 1;
		}

		if ((bestOf.getBo() == 5 && curScores[playerNum] == 3) || (bestOf.getBo() == 3 && curScores[playerNum] == 2)) {
			return this.getEntrantIdFromPlayerName(players[playerNum].nameInp.value);
		} else if (bestOf.getBo() == 'X') {
			displayNotif("Can't determine winner in BoX");
			return '';
		} else {
			return '';
		}
	}

	getEntrantIdFromPlayerName(playerName) {
		for (let i in this.#players) {
			if (this.#players[i].tag == playerName) {
				return this.#players[i].entrantId;
			}
		}

		return '';
	}

	async updateSetInfo() {
		if (!this.#currentSetInfo.id) {
			return;
		}

		const curScores = [scores[0].getScore(), scores[1].getScore()];

		let setWinner = this.getSetWinner(curScores);


		this.#currentSetInfo.setDataSimple = { //NOTE: Simple sucks. It doesn't let us choose set count, just the winner.
			setId: this.#currentSetInfo.id,
			winnerId: setWinner
		};

		this.#currentSetInfo.setDataDetailed.setId = this.#currentSetInfo.id;
		this.#currentSetInfo.setDataDetailed.winnerId = setWinner;
		if (!this.#currentSetInfo.setDataDetailed.gameData) {
			this.#currentSetInfo.setDataDetailed.gameData = [];
		}

		if (!this.#currentSetInfo.useDetailedReportType ) {
			return (this.#currentSetInfo.winnerId);
		}

		let gameInfo = {};
		let gameNum = 0;
		let gameStats = {};

		if (this.#previousScores[0] != curScores[0] || this.#previousScores[1] != curScores[1]) { //Score has updated.
			gameNum = curScores[0] + curScores[1];
			gameStats = this.getGameStats(this.#previousScores, curScores);
			if (gameStats) {
				/**
				 * TODO: FIx the game stats not properly being set. Gotta find a solution to this.
				 * 
				 * 
				 */
				gameInfo = {
					"winnerId": gameStats.winnerId,
					"gameNum": gameNum,
					// "entrant1Score": 0, //Stock counts
					// "entrant2Score": 0, //Stock counts
					// "stageId": 3,
					"selections": [{
						/**
						 * It does not care which order it is in. It does a cross-check on entrantID and associates correctly on their end.
						 */
							"entrantId": gameStats.winnerId,
							"characterId": gameStats.winnnerChar
						},
						{
							"entrantId": gameStats.loserId,
							"characterId": gameStats.loserChar
						}
					]
				};
			} else {
				//value increase by more than 1, which messes up our data.
				//use simple score reporting
				this.#currentSetInfo.useDetailedReportType = false;
				return;
			}
		} else {
			return;
		}

		this.#previousScores = JSON.parse(JSON.stringify(curScores));

		if (gameNum == 0) {
			return;
		}

		this.#currentSetInfo.setDataDetailed.gameData[gameNum-1] = gameInfo;
		return true;
	}

	async reportSet() {
		if (!this.#currentSetInfo.id) {
			displayNotif('Need to pull Match Info from StartGG first.');
			return;
		}

		let query = `
		mutation reportSet($setId: ID!, $winnerId: ID!, $gameData: [BracketSetGameDataInput]) {
			reportBracketSet(setId: $setId, winnerId: $winnerId, gameData: $gameData) {
			  id
			  state
			}
		}`;

		let variables = {};

		if (this.#currentSetInfo.useDetailedReportType) {
			variables = this.#currentSetInfo.setDataDetailed;
			if (variables.gameData.length <=0 ) {
				return; //No games have been played yet.
			}
		} else {
			variables = this.#currentSetInfo.setDataSimple;
			if (!variables.winnerId) {
				return; //No winner yet. Fine on multiple game sets.
			}
		}

		if (!variables.setId) {
			displayNotif('Must have set data to report');
			return;
		}

		let json = await this.generalApiCall(query, variables, '');
	}

	async updatePlayerProfiles() {

	}

	getPlayerFromPlayerList(field, value) {
		let player = {
			playerId: null
		};
		for (let i in this.#players) {
			if (this.#players[i][field] == value) {
				player = this.#players[i];
				break;
			}
		}
		return JSON.stringify(player);
	}

	async getEntrantsForEvent(eventLookupKey) {
		if (!eventLookupKey) {
			displayNotif('Must provide a valid event (either eventID or URL).');
			this.toggleElems(false);
			return;
		}

		await this.saveEventUrl(eventLookupKey);

		console.log('Original event ID: ' + eventLookupKey);

		let eventInputType = 'ID';
		let eventInputType2 = eventInputType.toLocaleLowerCase();

		if (eventLookupKey.indexOf('/event/') != -1) {
			eventInputType = 'String';
			eventInputType2 = 'slug';
		}

		if (eventLookupKey.indexOf('http') == 0) {

			console.log('Original event URL: ' + eventLookupKey);

            // Try to resolve url redirects
            try {
                const response = await fetch(eventLookupKey, {
                    method: 'GET',
                    redirect: 'follow'
                });

                console.log('Response URL:', response.url);
                console.log('Was redirected:', response.redirected);

                // Use the final URL regardless of redirect status
                eventLookupKey = response.url;
                console.log('Using URL: ' + eventLookupKey);

            } catch (e) {
                console.error('Redirect error:', e);
                displayNotif('Failed to resolve event URL: ' + e.message);
                this.toggleElems(false);
                return;
            }

            console.log('Parsing event URL: ' + eventLookupKey);

            if (eventLookupKey.indexOf('tournament/') != -1) {
				const urlParts = eventLookupKey.split('tournament/')[1].split('/event/');
				const tournamentSlug = urlParts[0];
				const eventNameSlug = urlParts[1].split('/')[0];
				eventLookupKey = 'tournament/' + tournamentSlug + '/event/' + eventNameSlug;
			} else {
				displayNotif('Invalid Event URL');
				this.toggleElems(false);
				return;
			}
		}

		console.log('Using event identifier type: ' + eventInputType);
		console.log('Using event identifier type 2: ' + eventInputType2);
		console.log('Event identifier: ' + eventLookupKey);

		let query = `
        query EventEntrants($eventId: ${eventInputType}!, $page: Int!, $perPage: Int!) {
            event(${eventInputType2}: $eventId) {
              id
              name
			  phases {
				id
				name
				numSeeds
				phaseOrder
			  }
			  videogame {
				name
				id
			  }
			  tournament {
				name
			  }
              entrants(query: {
                page: $page
                perPage: $perPage
              }) {
                pageInfo {
                  total
                  totalPages
                }
                nodes {
                  id
                  participants {
                    id
                    gamerTag
                    player {
                      id
					  prefix
                      user {
                        id
                        genderPronoun
                        authorizations {
                          externalUsername
                          type
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `;

		let variables = {
			"eventId": eventLookupKey,
			"page": 1,
			"perPage": 100
		}

		try {
			displayNotif('Loading event information...');
			const data = await this.generalApiCall(query, variables, 'data.event.entrants');
			if (data.data.event == null) {
				this.#eventIdInput.value = '';
				displayNotif('Invalid Event ID');
				this.toggleElems(false);
			} else {
				this.#gameForEvent = data.data.event.videogame;
				this.#eventId = data.data.event.id;
				this.#tournamentName = data.data.event.tournament.name;
				let prevPhaseOrder = 0;
				for (let i in data.data.event.phases) {
					let curPhaseOrder = data.data.event.phases[i].phaseOrder
					if (curPhaseOrder > prevPhaseOrder) {
						this.#top8PhaseId = data.data.event.phases[i].id;
					}

					prevPhaseOrder = curPhaseOrder;
				}


				this.#players = [];

				for (let e in data.data.event.entrants.nodes) {
					let node = data.data.event.entrants.nodes[e];
					let playerObj = {
						entrantId: node.id,
						tag: node.participants[0].gamerTag,
						sponsor: node.participants[0].player.prefix,
						participantId: node.participants[0].id,
						playerId: node.participants[0].player.id,
						user: node.participants[0].player.user
					}

					this.#players.push(playerObj);
				}

				this.#players.sort(this.dynamicSort('tag'));

				this.#startGGPlayerSelect.innerHTML = '';
				for (let i = 0; i < this.#players.length; i++) {
					const option = document.createElement('option');
					const player = this.#players[i];
					option.value = player.tag;
					option.innerHTML = player.tag;

					option.style.backgroundColor = "var(--bg5)";
					this.#startGGPlayerSelect.appendChild(option);
				}


				displayNotif('Event found');
				this.toggleElems(true);

				await this.getVideogameInfo(this.#gameForEvent.id);

				// Save the event URL for next launch
				await this.saveApiKey(this.#apiKeyInput.value);
			}
		} catch (e) {
			displayNotif(e);
			displayNotif(e.stack);
			console.log(e);
			console.log(e.stack);
		}
	}

	dynamicSort(property) {
		var sortOrder = 1;
		if (property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function (a, b) {
			/* next line works with strings and numbers,
			 * and you may want to customize it to your needs
			 */
			var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
			return result * sortOrder;
		}
	}
	async setPlayerPresets() {
		this.#playerPresets = await getPresetList("Player Info");
	}

	async getVideogameInfo(id) {
		let query = `
        query VideogameQuery {
            videogames(query: { filter: { id: "${id}" }, perPage: 2 }) {
                nodes {
                    id
                    name
                    displayName
                    characters {
                        id
                        name
                    }
					stages {
						id
						name
					}
                }
            }
        }
        `;

		let json = await this.generalApiCall(query, {});

		this.#gameForEvent = JSON.parse(JSON.stringify(json.data.videogames.nodes[0]));
	}

	async generalApiCall(query, variables, pagination) {
		const apiKey = this.#apiKeyInput.value;
		if (!apiKey) {
			displayNotif('Please enter your Start.gg API key');
			throw new Error('API key is required');
		}

		const response = await fetch('https://api.start.gg/gql/alpha', {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "appplication/json",
				"Authorization": "Bearer " + apiKey
			},
			body: JSON.stringify({
				"query": query,
				"variables": variables
			})
		});
		const json = await response.json();
		try {
			if (json.errors) {
				throw json.errors;
			}
		} catch (e) {
			throw e;
		}

		// print json for debugging
		console.log(JSON.stringify(json, null, 2));

		if (JSON.stringify(json).includes("Invalid authentication token")) {
			console.log(apiKey);
			displayNotif('Invalid Start.gg API key');
			throw new Error('Invalid Start.gg API key');
		}

		if (pagination && variables.page) {
			let originalPage = false;
			if (variables.page == 1) {
				originalPage = true;
			}

			const paginationObj = getPaginationObjFromJson(json, pagination);
			if (variables.page < paginationObj.pageInfo.totalPages) {
				variables.page += 1;
				paginationObj.nodes = paginationObj.nodes.concat(await this.generalApiCall(query, variables, pagination));
			}

			if (originalPage) {
				//do nothing.
			} else {
				return paginationObj.nodes;//always return the Nodes of a paginated object.
			}
		}

		return json;

		function getPaginationObjFromJson (json, pagination) {
			if (pagination.indexOf('.') != -1) {
				let paginationArr = pagination.split('.');
				let firstEl = paginationArr.shift();
				let newPagination = paginationArr.toString().replaceAll(',', '.');
				return getPaginationObjFromJson(json[firstEl], newPagination);
			} else {
				return json[pagination];
			}
		}
	}

}
export const startGG = new StartGG;

