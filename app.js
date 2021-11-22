import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.5.0/firebase-app.js';
import { getDatabase, ref, set, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.5.0/firebase-database.js';

(function() {
	// create uuid
	const localId = uuidv4();

	// Your web app's Firebase configuration
	const firebaseConfig = {
		apiKey: 'AIzaSyASPIvMidTJdHJHNLHpQ_pfLzjf9EYI5oE',
		authDomain: 'webrtc-video-chat-23b71.firebaseapp.com',
		projectId: 'webrtc-video-chat-23b71',
		storageBucket: 'webrtc-video-chat-23b71.appspot.com',
		databaseURL: 'https://webrtc-video-chat-23b71-default-rtdb.europe-west1.firebasedatabase.app/',
		messagingSenderId: '662563879894',
		appId: '1:662563879894:web:412c4377c2bd8084b70277'
	};

	// Initialize Firebase
	const app = initializeApp(firebaseConfig);
	const db = getDatabase(app);
	const senderRef = ref(db, 'sender');
	const messageRef = ref(db, 'message');

	function sendData(type, data) {
		set(ref(db, type), { [localId]: data });
	}

	async function readSDPData(snapshot) {
		const { key: incomingId } = snapshot;

		if (incomingId !== localId) {
			const { sdp: incomingSdp, type: incomingType } = snapshot.val();
			// if offer - setup answer
			// if answer - add answer to pc
			if (incomingType === 'offer') {
				const remoteOfferDescription = new RTCSessionDescription(snapshot.val());
				const t = await pc.setRemoteDescription(remoteOfferDescription);

				const localAnswerDescription = await pc.createAnswer();
				pc.setLocalDescription(localAnswerDescription);
				const { sdp, type } = localAnswerDescription;
				sendData('sdp', { sdp, type });
			} else if (incomingType == 'answer') {
				const remoteAnswerDescription = new RTCSessionDescription(snapshot.val());
				pc.setRemoteDescription(remoteAnswerDescription);
			}
		}
	}
	onChildAdded(ref(db, 'sdp'), readSDPData);

	function readCandidateData(snapshot) {
		const data = snapshot.toJSON();
		pc.addIceCandidate(new RTCIceCandidate(data));
	}
	onChildAdded(ref(db, 'candidate'), readCandidateData);

	// setup my PC
	// add STUN servers
	const configs = {
		iceServers: [
			{
				urls: [
					'stun:stun2.l.google.com:19302',
					'stun:stun3.l.google.com:19302',
					'stun:stun4.l.google.com:19302',
					'stun:stunserver.org:3478'
				]
			}
		]
	};
	const pc = new RTCPeerConnection(configs);

	const localVideo = document.getElementById('local');
	const remoteVideo = document.getElementById('remote');
	const btnStart = document.getElementById('btn-start');
	const btnCall = document.getElementById('btn-call');

	// btnStart.addEventListener('click', );
	async function setupLocalStream() {
		// setup my video
		// add stream to PC
		const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
		localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
		localVideo.srcObject = localStream;
		const remoteStream = new MediaStream();
		remoteVideo.srcObject = remoteStream;

		pc.ontrack = (e) => {
			e.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
		};
	}
	
	setupLocalStream();

	btnCall.addEventListener('click', async function() {
		pc.onicecandidate = (e) => {
			e.candidate && sendData('candidate', e.candidate.toJSON());
		};

		const localOfferDescription = await pc.createOffer();
		pc.setLocalDescription(localOfferDescription);
		const { sdp, type } = localOfferDescription;
		sendData('sdp', { sdp, type });
	});

	// create an offer
	// add offer (setLocal) to PC
	// sent to db
	// setup ICE listener - send to db when receive
	//
	// addICE when
})();
