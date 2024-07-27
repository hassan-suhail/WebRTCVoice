const socket = io();

document.getElementById('login-btn').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'AEDHuzaifa' && password === 'ADMIN1AC') {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('educator-container').style.display = 'block';
        startEducator();
    } else if (username === 'student' && password === 'student00') {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('listener-container').style.display = 'block';
        startListener();
    } else if (username === 'AEDHassan' && password === 'Admin2AC') {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('educator-container').style.display = 'block';
            startEducator();
    } else if (username === 'studentad' && password === 'Passstudentad0068') {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('listener-container').style.display = 'block';
        startListener();
    } else {
        alert('Invalid credentials');
    }
});

const audioElement = document.getElementById('audio');

let localStream;
let peerConnection;

const servers = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

async function startEducator() {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);

    socket.on('answer', async (answer) => {
        const remoteDesc = new RTCSessionDescription(answer);
        await peerConnection.setRemoteDescription(remoteDesc);
    });

    socket.on('candidate', async (candidate) => {
        const iceCandidate = new RTCIceCandidate(candidate);
        await peerConnection.addIceCandidate(iceCandidate);
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('stop-btn').style.display = 'block';
    });

    document.getElementById('stop-btn').addEventListener('click', () => {
        localStream.getTracks().forEach(track => track.stop());
        document.getElementById('start-btn').style.display = 'block';
        document.getElementById('stop-btn').style.display = 'none';
    });
}

async function startListener() {
    peerConnection = new RTCPeerConnection(servers);

    peerConnection.ontrack = event => {
        const [remoteStream] = event.streams;
        audioElement.srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    socket.on('offer', async (offer) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer);
    });

    socket.on('candidate', async (candidate) => {
        const iceCandidate = new RTCIceCandidate(candidate);
        await peerConnection.addIceCandidate(iceCandidate);
    });
}
