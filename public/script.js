const socket = io();

document.getElementById('login-btn').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log(`Logging in with username: ${username}`);

    if (username === 'admin1' && password === 'admin1ac') {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('educator-container').style.display = 'block';
        startEducator();
    } else if (username === 'student' && password === 'student00') {
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
    console.log('Starting educator...');
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Obtained local stream');

    socket.emit('broadcaster');

    socket.on('watcher', id => {
        peerConnection = new RTCPeerConnection(servers);
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('candidate', id, event.candidate);
            }
        };

        peerConnection.createOffer().then(offer => {
            return peerConnection.setLocalDescription(offer);
        }).then(() => {
            socket.emit('offer', id, peerConnection.localDescription);
        });

        socket.on('answer', (id, description) => {
            peerConnection.setRemoteDescription(description);
        });

        socket.on('candidate', (id, candidate) => {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('stop-btn').style.display = 'block';
    });

    document.getElementById('stop-btn').addEventListener('click', () => {
        localStream.getTracks().forEach(track => track.stop());
        document.getElementById('start-btn').style.display = 'block';
        document.getElementById('stop-btn').style.display = 'none';
        socket.emit('disconnect');
    });
}

async function startListener() {
    console.log('Starting listener...');

    socket.emit('watcher');

    socket.on('offer', (id, description) => {
        peerConnection = new RTCPeerConnection(servers);
        peerConnection.setRemoteDescription(description).then(() => {
            return peerConnection.createAnswer();
        }).then(sdp => {
            return peerConnection.setLocalDescription(sdp);
        }).then(() => {
            socket.emit('answer', id, peerConnection.localDescription);
        });

        peerConnection.ontrack = event => {
            const [remoteStream] = event.streams;
            audioElement.srcObject = remoteStream;
        };

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('candidate', id, event.candidate);
            }
        };
    });

    socket.on('candidate', (id, candidate) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
}
