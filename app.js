const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const translatedTextDiv = document.getElementById('translatedText');
let mediaRecorder = null;
let audioChunks = [];

startButton.onclick = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(handleAudioStream)
        .catch(err => {
            console.error('Error accessing the microphone', err);
        });

    startButton.style.display = 'none';
    stopButton.style.display = 'inline';
};

stopButton.onclick = () => {
    if (mediaRecorder) {
        mediaRecorder.stop();
        console.log("Stopping mediaRecorder, current state: ", mediaRecorder.state);
        stopButton.style.display = 'none';
        startButton.style.display = 'inline';
    }
};

function handleAudioStream(stream) {
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
        } else {
            console.log("Received an empty audio chunk");
        }
    };

    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
            sendAudioToServer(audioBlob, "audio.webm");
        } else {
            console.error("Audio blob is empty");
        }
        stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
}

function sendAudioToServer(blob, filename) {
    const formData = new FormData();
    formData.append('audio', blob, filename);

    fetch('http://s2e-t3xlarge-env.eba-b4yw224w.eu-west-2.elasticbeanstalk.com/translate', {
        method: 'POST',
        body: formData,
        mode: 'cors'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        console.log('Translated text:', data);
        translatedTextDiv.textContent = data;
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
}

