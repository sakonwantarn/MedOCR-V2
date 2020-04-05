import axios from 'axios';
import { WaveFile } from 'wavefile';
import * as FileSystem from 'expo-file-system';

const uriBase = 'https://api.aiforthai.in.th/vaja';
const apikey = '9CpCn1hFx625KG2VmLoyZjtfTREIbYXJ';

async function createWav(raw) {
    // take specific the json raw data
    var result = raw.output.audio.result;
    var numChannels = raw.output.audio.numChannels;
    var validBits = raw.output.audio.validBits;
    var sizeSample = raw.output.audio.sizeSample;
    var sampleRate = raw.output.audio.sampleRate;
    try {
        // create wav file
        let wav = new WaveFile();
        var tmp = [];
        for (i in result) {
            tmp[i] = parseInt(result[i]);
        }
        wav.fromScratch(parseInt(numChannels), parseInt(sampleRate), validBits, tmp);
        // convert audiofile to base64 data
        var audioFile = wav.toBase64();
    }
    catch (err) {
        console.log("!> Error (createWav): " + err)
    }
    // return base64 audio file
    return audioFile;
}

async function callServer(text) {
    // make sure the input text is string
    text = text.toString();
    // call server with axios
    const res = await axios({
        method: 'get',
        url: uriBase,
        params: {
            text: text,
            mode: 'st'
        },
        headers: {
            Apikey: apikey,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
        },
    })
        .then(function (response) {
            if (response.data.output.audio == undefined) {
                console.log(response.data)
            }
            return response;
        })
        .catch(function (error) {
            console.log("vajaAPI_callServer:" + error);
        });

    if (res.data.output.audio == undefined) {
        console.log("dont give up >> Retrying . . . ");
        return callServer(text);
    } else {
        console.log("yeyh!")
    }
    // return json data
    return res.data;
}

function _reconstruct(text) {
    // Split the text to an array by space (" ")
    var list_texts = text.split(" ");
    
    
    console.log(list_texts);
    // remove unwanted characters on every strings in the array
    for (i in list_texts) {
        list_texts[i] = list_texts[i].replace(/\s/g, '');
        list_texts[i] = list_texts[i].replace(/\r/g, '');
        list_texts[i] = list_texts[i].replace(/\n/g, '');
        list_texts[i] = list_texts[i].replace(/&nbsp/g, '');
        list_texts[i] = list_texts[i].replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    }
    // remove empty values in the array
    list_texts = list_texts.filter(w => w);
    // reconstruct array to closer with 300 characters in every values of array
    var new_list_text = []; var tmp; var idx = 0;
    while (idx < list_texts.length - 1) {
        if (tmp == undefined) {
            tmp = list_texts[idx];
        }
        var total = tmp.length + list_texts[idx + 1].length;
        if (total < 200) {
            tmp = tmp.concat(list_texts[idx + 1])
            if (list_texts[idx + 2] == undefined) {
                new_list_text.push(tmp)
            }
        } else {
            new_list_text.push(tmp)
            tmp = list_texts[idx + 1];
        }
        idx++;
    }
    // return the data
    return new_list_text
}

async function vajaAPI(text) {
    console.log("! vajaAPI Started!");
    // text = 'ยานี้อาจทำให้มีอาการง่วงซึมได้ ควรหลีกเลี่ยงการขับรถหรือการทำงานกับเครื่องจักรกลหลังจากรับประทานยา'
    // text = 'ข้อความที่ต้องการแปลง'
    //

    console.log("> text: " + text);

    // reconstruct the input text
    list_texts = _reconstruct(text);
    // main vajaAPI.js
    var uris = [];
    for (i in list_texts) {
        var num = parseInt(i) + 1
        console.log("#", num, "of", list_texts.length)
        try {
            // get data from vaja server
            console.log("> callServer started")
            console.log(list_texts[i])
            var json = await callServer(list_texts[i]);
            console.log("> callServer ended")
            // wait 5s 
            await new Promise(r => setTimeout(r, 5000));
            // convert vaja json data to audio playable wave file
            console.log("> createWav started")
            var audioBase64 = await createWav(json);
            console.log("> createWav ended")
            //save audio file to the file system
            console.log("> saving audio to the filesystem . . .")
            var uri = FileSystem.documentDirectory + "res_" + num + ".wav";
            await FileSystem.writeAsStringAsync(uri, audioBase64, {
                encoding: FileSystem.EncodingType.Base64,
            });
            uris.push({
                uri: uri
            });
            console.log("> saving completed!")
        } catch (error) {
            console.log("vajaAPI:" + error);
        }
    }
    console.log("! vajaAPI Ended!")
    return uris;
}

export default vajaAPI;