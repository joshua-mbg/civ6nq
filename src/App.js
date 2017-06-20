import React, { Component } from 'react';
import Popup from 'react-popup';
import MyForm from './form'

export default class App extends Component {
	constructor() {
		super();

		this.state = {games:[],players:[],active:'Upcoming Games',steamid: window.sessionStorage.getItem('steamid')}
	}

	componentDidMount() {
		fetch('api/games').then(response => response.json()).then(this.setState.bind(this));
		fetch('api/players').then(response => response.json()).then(this.setState.bind(this));

		this.setState({
			hash: window.location.hash.replace('#',''),
			format: 12
		})

    	window.addEventListener("hashchange", () => { this.setState({
			hash: window.location.hash.replace('#','')
		})}, false);

		window.app = this;
	}

	parseGames() {
		let {games} = this.state;
		let html = [];
		const today = new Date();
		const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

		if (this.state.active == 'My Games' && this.state.steamid) {
			const player = this.state.players.filter(player => player.steamid == this.state.steamid).pop();
			if (player) {
				today.setDate(today.getDate() - 3);
				games = games.filter(game => player.games.indexOf(game.id+'') + 1);
			}
		}

		for (let d = 0; d < 7; d++) {
			let day = new Date(today.getTime()+(d*24*60*60*1000));
			html.push(
				<section>
				<strong>{days[day.getDay()]}</strong>
				<ul>
					{games
						.filter(game=> {
							let gameDay = new Date(game.day);
							gameDay = gameDay.getMonth() +''+ gameDay.getDate() +''+ gameDay.getFullYear();

							return game.verified && gameDay == day.getMonth() +''+ day.getDate() +''+ day.getFullYear();
						}).sort((a,b) => {
						  if (new Date(a.day) < new Date(b.day)) return -1;
						  if (new Date(a.day) > new Date(b.day)) return 1;
						  return 0;
						}).map(game=> {
						const players = this.state.players.filter(player => player.games.indexOf(game.id+'') + 1);
						let hours = new Date(game.day).getHours();
						let ampm = '';

						if (this.state.format) {
							ampm = hours < 12 ? "AM":"PM";
							hours = hours > 12 ? hours - this.state.format : hours;
						}
						
						hours = hours < 10 ? "0"+hours : hours;

						let minutes = new Date(game.day).getMinutes();
						minutes = minutes < 10 ? "0"+minutes : minutes;
						return <li><a href={`/#${game.id}`}>{`${hours}:${minutes} ${ampm} : ${players.length}/${game.slots}`}</a></li>;
					})}
				</ul>
				</section>
			);
		}

		return html;
	}

	gameDetails() {
		if(!this.state.hash) return null;

		const game = this.state.games.filter(game => game.id == this.state.hash).pop();

		if(!game) return null;

		const gameDay = new Date(game.day);
		const host = this.state.players.filter(player => player.steamid==game.verified).pop();
		const players = this.state.players.filter(player => player.games.indexOf(this.state.hash) + 1)
			.map(player => <li><a href={player.profileurl} target="_blank"><img src={player.avatar}/>&nbsp;{player.personaname}</a>&nbsp;{player.steamid==game.verified ? "(Host)":""}&nbsp;{new Date() < gameDay ? <small><a href="#" onClick={this.leaveGame.bind(this,game,player)}>&#10008;</a></small> : ''}</li>);

		const open = gameDay >= new Date() ? game.slots-players.length : 0;

		for (let x = 0; x<open; x++) players.push(<li className="open"><a href="#" onClick={this.showWarning.bind(this)}>Open</a></li>);

		const gameYear = gameDay.getFullYear();
		let gameHours = gameDay.getHours();
		const gameMinutes = gameDay.getMinutes() < 10 ? "0"+gameDay.getMinutes() : gameDay.getMinutes();
		let ampm = '';

		if (this.state.format) {
			ampm = gameHours > 12 ? "PM":"AM";
			gameHours = gameHours > 12 ? gameHours - this.state.format : gameHours;
		}
		
		gameHours = gameHours < 10 ? "0"+gameHours : gameHours;
		return (<section>
					<p><strong>{gameDay.toString().replace(new RegExp(gameYear+' .*$'), '')+' '+gameHours+':'+gameMinutes + ' ' +ampm+' '+gameDay.toString().replace(new RegExp('^.*\\('),'(')}</strong></p>
					<p><strong>Players ({`${players.length-open} / ${game.slots}`})</strong>: </p>

					<ul className="playerList">{players}</ul>

					<p><strong>Description</strong>: {game.description}</p>
					<p><strong>Game Speed</strong>: {game["game-speed"]}</p>
					<p><strong>Map Type</strong>: {game.map}</p>
					<p><strong>Map Size</strong>: {game["map-size"]}</p>
					<p><strong>Turn Timer</strong>: {game["turn-timer"]}</p>
					<p><strong>Turn Mode</strong>: {game["turn-mode"]}</p>
					<p><strong>Resources</strong>: {game["resources"]}</p>
					<p><strong>World Age</strong>: {game["world-age"]}</p>
					<p><strong>Start Position</strong>: {game["start-position"]}</p>
					<p><strong>Temperature</strong>: {game["temp"]}</p>
					<p><strong>Rainfall</strong>: {game["rainfall"]}</p>
					<p><strong>Barbs</strong>: {game["barbarians"] ? "No":"Yes"}</p>
					<p><strong>Teams</strong>: {game["teams"] ? "No":"Yes"}</p>
					<p><strong>Villages</strong>: {game["villages"] ? "No":"Yes"}</p>
					<p>&nbsp;</p>
					<p>For questions about this game contact the host on Steam. Profile link at top.</p>
					{ host && host.commentpermission ? 
					<iframe src={`http://steamcommunity.com/profiles/${game.verified}/#commentthread_Profile_${game.verified}_0_form`} style={{width:'100%',height:'650px',maxWidth:'400px'}} /> : '' }
				</section>);
	}

	home() {
		if(/create/.test(window.location.href)) return null;
		if(this.state.hash) return null;

		return (<section>
					<h1>Civ6 No Quitters</h1>
					<p>A free service for scheduling games and penalizing quitters.</p>
					<p>&nbsp;</p>
					<h1>lol wut?</h1>
					<ul>
						<li>Hosts schedule a game and it shows on the calendar</li>
						<li>Players commit to join games</li>
						<li>Quitters are flagged and tied to Steam profiles</li>
					</ul>
					<p>&nbsp;</p>
					<p>&nbsp;</p>
					<p>&nbsp;</p>
					<p><a href="mailto:civ6nq@gmail.com">contact</a></p>
				</section>);
	}

	hourFormat(event) {
  		this.setState({format: parseInt(event.target.value)});
	}

	createGame() {
		if(!/create/.test(window.location.href)) return null;

		return (<MyForm format={this.state.format} callback={this.formReturn}/>);
	}

	formReturn(game) {
		window.location.href = `/api/auth/${game.id}`;
	}

	leaveGame(game, player, event) {
		event.preventDefault();
		const gameDay = new Date(game.day);
		gameDay.setHours(0);
		gameDay.setMinutes(0);
		gameDay.setSeconds(0);

		const msg = new Date() < gameDay ? "You are about to leave this game. Kinda sucks, but you won't be penalized since you're giving enough notice." : <p>You are about to leave this game. Unfortunately, leaving on the game day will result in penalty. Your steam profile will be flagged. Get too many flags will label you a <span style={{color:'red'}}><strong>QUITTER</strong></span> and you will be banned from using this service.</p>;

		Popup.create({
		    title: null,
		    content: <div>{msg}</div>,
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
						window.location.href = `/api/auth/${this.state.hash}/${player.steamid}`;
		            }
		        }]
		    }
		});
	}

	showWarning(event) {
		event.preventDefault();

		Popup.create({
		    title: null,
		    content: <div><p>You are committing to join this game at the specified time. <strong>You will have up to the game day to 
					leave the game.</strong> If you fail to show, or quit in-game your Steam account will be flagged. </p>

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
						window.location.href = `/api/auth/${this.state.hash}`;
		            }
		        }]
		    }
		});
	}

	handleNav(event) {
		event.preventDefault();

		if (event.target.text == 'My Games' && !this.state.steamid) {
			Popup.create({title: "Login through Steam", content: <div><a href="/api/auth"><img src="https://steamcommunity-a.akamaihd.net/public/images/signinthroughsteam/sits_02.png"/></a></div>});
			return null;
		}

		Array.from(document.querySelectorAll('#nav li')).forEach(el => el.classList.toggle('active'));
		this.setState({active: document.querySelector('.active a').text});

	}

	render() {
		return (
		<div>
          <Popup
            className="mm-popup"
            btnClass="mm-popup__btn"
            closeBtn={true}
            closeHtml={null}
            defaultOk="Ok"
            defaultCancel="Cancel"
            wildClasses={false} />
			<div className="left">
				{this.home()}
				{this.gameDetails()}
				{this.createGame()}
			</div>
			<div className="right">
				<div><a href="/create" className="button small" style={{float:'right'}}>Host a Game</a><br/><br/><br/><br/></div>
				<nav id="nav" onClick={this.handleNav.bind(this)}>
					<ul className="links">
						<li className="active"><a href="#">Upcoming Games</a></li>
						<li><a href="#">My Games</a></li>
					</ul>
				</nav>
				<select onChange={this.hourFormat.bind(this)}><option value="12">12 hour</option><option value="0">24 hour</option></select>
				<br/><br/>
				{this.parseGames()}
			</div>
		</div>
		);
	}
}
