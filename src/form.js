import React, { Component } from 'react';
import { isInclusivelyAfterDay, SingleDatePicker, DayPickerRangeController } from 'react-dates';
import TimePicker from 'rc-time-picker';
import moment from 'moment';
import Popup from 'react-popup';

export default class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: '', date: null, focused: null};
  }

  showWarning(event) {
    event.preventDefault();
    const payload = {};
    const formTarget = event.target;
    const fields = formTarget.querySelectorAll('[name]');
    Object.keys(fields).forEach(key => {
      let el = fields[key];
      payload[el.name] = el.type == "checkbox" ? el.checked : el.value;
    });

    if (!payload['date']) {
      Popup.alert ('Date is required.');
      return false;
    }

    if (!payload['slots']) {
      Popup.alert ('Must select number of players.');
      return false;
    }

    Popup.create({
        title: null,
        content: <div><p>You are committing to host this game at the specified time. <strong>You will have up to the game day to 
          cancel the game.</strong> If you fail to show, or quit in-game your Steam account will be flagged. </p>

          <p>Get too many flags will label you a <span style={{color:'red'}}><strong>QUITTER</strong></span> and you will be 
          banned from using this service.</p>

          <p>Acceptable reasons for not showing or quitting are... there are none.</p></div>,
        buttons: {
            left: [{
                text: 'Nevermind...',
                className: 'danger',
                action:  () => {
                    Popup.close();
                }
            }],
            right: [{
                text: <span><img src="https://steamcommunity-a.akamaihd.net/public/images/signinthroughsteam/sits_02.png"/></span>,
                className: 'steamLogin',
                action: () => {
                    Popup.close();
                    this.handleSubmit(formTarget, payload);
                }
            }]
        }
    });
  }

  handleSubmit(formTarget, payload) {
    formTarget.querySelector('[type="submit"]').disabled=true;
    formTarget.querySelector('[type="submit"]').value="WAIT";

    payload['day'] = new Date(payload['date'] + ' ' + payload['time']).toISOString();

    fetch('api/create', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST', 
      body: JSON.stringify( payload )
    }).then(response => response.json())
    .then(this.props.callback);
  }

  disabledMinutes() {
    const disabledMin = [];
    for (let x = 0; x<=60; x++) {
      if(x !== 0 && x !== 15 && x != 45 && x !== 30) {
        disabledMin.push(x);
      }
    }

    return disabledMin;
  }

  render() {
  return (
    <form method="post" action="#" onSubmit={this.showWarning.bind(this)}>
      <SingleDatePicker
        date={this.state.date} // momentPropTypes.momentObj or null
        onDateChange={date => this.setState({ date })} // PropTypes.func.isRequired
        focused={this.state.focused} // PropTypes.bool
        onFocusChange={({ focused }) => this.setState({ focused })} // PropTypes.func.isRequired
        numberOfMonths={1}
        placeholder="Game Day"
        isOutsideRange={day =>
          !isInclusivelyAfterDay(day, moment()) ||
          isInclusivelyAfterDay(day, moment().add(1, 'weeks'))
        }
        displayFormat="MMM D"
      />
      <TimePicker placeholder="Game Time" 
        showSecond={false} 
        use12Hours={this.props.format==12} 
        allowEmpty={false} 
        disabledMinutes={this.disabledMinutes}
        defaultValue={moment("2010-10-20 12:00am","YYYY-MM-DD HH:mm")}
        name="time"
        />
      <select name="slots" id="slots">
        <option value="">- Number of Players -</option>
        <option value="10">10</option>
        <option value="9">9</option>
        <option value="8">8</option>
        <option value="7">7</option>
        <option value="6">6</option>
        <option value="5">5</option>
        <option value="4">4</option>
        <option value="3">3</option>
        <option value="2">2</option>
        <option value="1">1</option>
      </select>
      <select name="turn-timer" id="turn-timer">
        <option value="???">- Turn Timer -</option>
        <option value="None">* None</option>
        <option value="Standard">Standard</option>
        <option value="Dynamic">Dynamic</option>
      </select>
      <select name="turn-mode" id="turn-mode">
        <option value="???">- Turn Mode -</option>
        <option value="Simultaneous">* Simultaneous</option>
        <option value="Dynamic">Dynamic</option>
      </select>
      <select name="game-speed" id="game-speed">
        <option value="???">- Game Speed -</option>
        <option value="Online">* Online</option>
        <option value="Quick">Quick</option>
        <option value="Standard">Standard</option>
        <option value="Epic">Epic</option>
        <option value="Marathon">Marathon</option>
      </select>
      <select name="map" id="map">
        <option value="???">- Map -</option>
        <option value="Continents">Continents</option>
        <option value="Fractal">Fractal</option>
        <option value="Inland">Inland Sea</option>
        <option value="Island">Island</option>
        <option value="Pangaea">* Pangaea</option>
        <option value="Shuffle">Shuffle</option>
        <option value="4">4-Leaf Clover</option>
        <option value="6">6-Armed Snowflake</option>
        <option value="Earth">Earth</option>
        <option value="True">True Start</option>
      </select>
      <select name="map-size" id="map-size">
        <option value="???">- Map Size -</option>
        <option value="Duel">Duel</option>
        <option value="Tiny">Tiny</option>
        <option value="Small">* Small</option>
        <option value="Standard">Standard</option>
        <option value="Large">Large</option>
        <option value="Huge">Huge</option>
      </select>
      <select name="resources" id="resources">
        <option value="???">- Resources -</option>
        <option value="Sparse">Sparse</option>
        <option value="Standard">Standard</option>
        <option value="Abundant">* Abundant</option>
        <option value="Random">Random</option>
      </select>
      <select name="world-age" id="world-age">
        <option value="???">- World Age -</option>
        <option value="New">New</option>
        <option value="Standard">* Standard</option>
        <option value="Old">Old</option>
        <option value="Random">Random</option>
      </select>
      <select name="start-position" id="start-position">
        <option value="???">- Start Position -</option>
        <option value="New">* Balanced</option>
        <option value="Standard">Standard</option>
        <option value="Old">Legendary</option>
      </select>
      <select name="temp" id="temp">
        <option value="???">- Temp -</option>
        <option value="Hot">Hot</option>
        <option value="Standard">* Standard</option>
        <option value="Cold">Cold</option>
        <option value="Random">Random</option>
      </select>
      <select name="rainfall" id="rainfall">
        <option value="???">- Rainfall -</option>
        <option value="Arid">Arid</option>
        <option value="Standard">* Standard</option>
        <option value="Wet">Wet</option>
        <option value="Random">Random</option>
      </select>
      <select name="sea-level" id="sea-level">
        <option value="???">- Sea Level -</option>
        <option value="Arid">Low</option>
        <option value="Standard">* Standard</option>
        <option value="Wet">High</option>
        <option value="Random">Random</option>
      </select>
      <div>
        <input type="checkbox" id="barbarians" name="barbarians"/>
        <label htmlFor="barbarians">No Barbarians</label>
        </div>
      <div>
      <input type="checkbox" id="teams" name="teams"/>
      <label htmlFor="teams">No Teams</label>
      </div>
      <div>
      <input type="checkbox" id="villages" name="villages"/>
      <label htmlFor="villages">No Villages</label>
      </div>
      <textarea name="description" id="description" placeholder="Enter your message, this will show on the game page. Include info on banned civs etc." rows="6"></textarea>
      <input type="submit" value="Confirm Settings"/>
    </form>
  );
  }
}

          // <input type="text" name="demo-name" id="demo-name" placeholder="Name"/>
          // <input type="email" name="demo-email" id="demo-email" placeholder="Email"/>
          // <select name="demo-category" id="demo-category">
          //   <option value="???">- Category -</option>
          //   <option value="1">Manufacturing</option>
          //   <option value="1">Shipping</option>
          //   <option value="1">Administration</option>
          //   <option value="1">Human Resources</option>
          // </select>
          // <input type="radio" id="demo-priority-normal" name="demo-priority"/>
          // <label htmlFor="demo-priority-normal">Normal</label>
          // <input type="radio" id="demo-priority-high" name="demo-priority"/>
          // <label htmlFor="demo-priority-high">High</label>
          // <input type="checkbox" id="demo-copy" name="demo-copy"/>
          // <label htmlFor="demo-copy">Email me a copy</label>
          // <textarea name="demo-message" id="demo-message" placeholder="Enter your message" rows="6"></textarea>
