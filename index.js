document.getElementById("1").style.display="none";
notify("Record Screen Update Added : 9/4/2020 2:33pm")
    const PRE = "MAGNITUDO"
    const SUF = "MEET"
    var room_id;
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    var local_stream;
    var screenStream;
    var peer = null;
    var currentPeer = null
    var screenSharing = false
    function createRoom() {
        document.getElementById("1").style.display="block";
        console.log("Creating Room")
        room_id = prompt("What is the Meeting Id?");
        peer = new Peer(room_id)
        peer.on('open', (id) => {
            console.log("Peer Connected with ID: ", id)
            //hideModal()
            document.getElementById("1").style.display="block";
            getUserMedia({ video: true, audio: true }, (stream) => {
                local_stream = stream;
                setLocalStream(local_stream)
            }, (err) => {
                console.log(err)
            })
            notify("Waiting for peer to join.")
        })
        peer.on('call', (call) => {
            call.answer(local_stream);
            call.on('stream', (stream) => {
                setRemoteStream(stream)
            })
            currentPeer = call;
        })
    }
    
    function setLocalStream(stream) {
    
        let video = document.getElementById("local-video");
        video.srcObject = stream;
        video.muted = true;
        video.play();
    }
    function setRemoteStream(stream) {
    
        let video = document.getElementById("remote-video");
        video.srcObject = stream;
        video.play();
    }
    
    function hideModal() {
        document.getElementById("entry-modal").hidden = true
    }
    
    function notify(msg) {
        let notification = document.getElementById("notification")
        notification.innerHTML = msg
        notification.hidden = false
        setTimeout(() => {
            notification.hidden = true;
        }, 3000)
    }
    
    function joinRoom() {
        document.getElementById("1").style.display="block";
        console.log("Joining Room")
        let room = prompt("What is the Meeting-Id?");
        if (room == " " || room == "") {
            alert("Invalid Id");
            return;
        }
        room_id =room;
        //hideModal()
        peer = new Peer()
        peer.on('open', (id) => {
            console.log("Connected with Id: " + id)

            getUserMedia({ video: true, audio: true }, (stream) => {
                local_stream = stream;
                setLocalStream(local_stream)
                notify("Joining peer...")
                let call = peer.call(room_id, stream)
                call.on('stream', (stream) => {
                    setRemoteStream(stream);
                })
                currentPeer = call;
            }, (err) => {
                console.log(err)
            })
    
        })
    }
    
    function startScreenShare() {
        if (screenSharing) {
            stopScreenSharing()
        }
        navigator.mediaDevices.getDisplayMedia({ video: true ,audio:true }).then((stream) => {
            screenStream = stream;
            let videoTrack = screenStream.getVideoTracks()[0];
            videoTrack.onended = () => {
                stopScreenSharing()
            }
            if (peer) {
                let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                    return s.track.kind == videoTrack.kind;
                })
                sender.replaceTrack(videoTrack)
                screenSharing = true
            }
            console.log(screenStream)
        })
    }
    
    function stopScreenSharing() {
        if (!screenSharing) return;
        let videoTrack = local_stream.getVideoTracks()[0];
        if (peer) {
            let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            })
            sender.replaceTrack(videoTrack)
        }
        screenStream.getTracks().forEach(function (track) {
            track.stop();
        });
        screenSharing = false
    }
let start = document.getElementById('start'),
    stop  = document.getElementById('stop'),
    mediaRecorder;

start.addEventListener('click', async function(){
    let stream = await recordScreen();
    let mimeType = 'video/webm';
    mediaRecorder = createRecorder(stream, mimeType);
  let node = document.createElement("p");
    node.textContent = "Started recording";
    document.body.appendChild(node);
})



async function recordScreen() {
    return await navigator.mediaDevices.getDisplayMedia({
        audio: true, 
        video: { mediaSource: "screen"}
    });
}

function createRecorder (stream, mimeType) {
  // the stream data is stored in this array
  let recordedChunks = []; 

  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }  
  };
  mediaRecorder.onstop = function () {
     saveFile(recordedChunks);
     recordedChunks = [];
  };
  mediaRecorder.start(200); // For every 200ms the stream data will be stored in a separate chunk.
  return mediaRecorder;
}

function saveFile(recordedChunks){

   const blob = new Blob(recordedChunks, {
      type: 'video/webm'
    });
    let filename = window.prompt('Enter file name'),
        downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${filename}.webm`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    URL.revokeObjectURL(blob); // clear from memory
    document.body.removeChild(downloadLink);
}
