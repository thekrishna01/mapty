"use strict";

const form = document.querySelector(".form");
const containerWorkOuts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

//creating a class
class WorkOut {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.duration = duration;
    this.distance = distance;
  }
  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends WorkOut {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //in min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends WorkOut {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //in km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class App {
  //private variable, private property needs to be accessed with this keyword
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();

    //get local storage
    this._getLocalStorage();

    //'submit'-whenever i give enter the details to be popup in map
    form.addEventListener("submit", this._newWorkOut.bind(this));

    //to change in drop-down box
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkOuts.addEventListener("click", this._moveToPopUp.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation)
      //(success,error)
      //this._loadMap is error because regular fnc call this is set to undefined
      // so by using bind we again bind it with the object to create a new fnc
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
  }
  _loadMap(pos) {
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;
    const altitude = pos.coords.altitude;
    //L.map(id)
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 14); //14 is the zoom pos

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //whenever we click at the map
    this.#map.on("click", this._showMap.bind(this));
    this.#workouts.forEach((work) => this._renderWorkOutMarker(work));
  }
  _showMap(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }
  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _newWorkOut(e) {
    e.preventDefault();
    //helper function
    const validInput = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...input) => input.every((inp) => inp > 0);

    //getting data from the form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng; //also known as lat=mapEvent.latlng.lat
    let workout;
    //if workout is running, creating an object running
    if (type === "running") {
      const cadence = +inputCadence.value;
      //check data is valid
      if (
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Input have to be a positive integer");
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if workout is running, creating an object running
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      //check data is valid
      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Input have to be a positive integer");
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to workouts array
    this.#workouts.push(workout);

    //rendering workouts on map as a marker
    this._renderWorkOutMarker(workout);

    //render the workout
    this._renderWorkOut(workout);

    //after giving enter making the field as empty
    this._hideForm();

    //local storage
    this._setLocalStorage();
  }
  _renderWorkOutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkOut(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id=${workout.id}>
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;
    if (workout.type === "running")
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
      </li>
      `;
    if (workout.type === "cycling")
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
      </li>
      `;
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopUp(e) {
    const workOutEl = e.target.closest(".workout");
    //gaurd clause=> to prevent null values
    if (!workOutEl) return;
    const workout = this.#workouts.find(
      (work) => work.id === workOutEl.dataset.id
    );
    //setView(coordinates,zoom-lvl,animation obj)
    this.#map.setView(workout.coords, 14);
  }
  _setLocalStorage() {
    //(key,value)
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    //guard clause
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach((work) => this._renderWorkOut(work));
  }
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
