import React, { Component, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Text, TouchableHighlight, Modal, Alert } from 'react-native';

import vision from '@react-native-firebase/ml-vision';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { Audio } from 'expo-av';
import { activateKeepAwake } from 'expo-keep-awake';

import Scraper from './src/Search';
import vajaAPI from './src/vajaAPI';



export default class App extends Component {
  state = {
    modalVisible: false
  };

  constructor(props) {
    super(props);

    this.takePicture = this.takePicture.bind(this);
  }

  componentDidMount() {
    activateKeepAwake();
  }

  setModalVisible(visible) {
    this.setState({ modalVisible: visible })
  };

  ////////  
  takePicture = async () => {
    console.log("takePicture start")
    if (this.camera) {
      console.log("got the camera");
      let picture = await this.camera.takePictureAsync({ quality: 0.5, base64: true })
      console.log(picture.uri);
      this.processPictureManipulateBlock(picture.uri);
      console.log("Props ", this.props)
    }
  };

  processPictureManipulateBlock = async (pictPath) => {
    const manipResult = await ImageManipulator.manipulateAsync(pictPath);
    const processPictureManipulateBlock = await vision().textRecognizerProcessImage(manipResult.uri); //change path to latest image in library
    console.log("this is from Manipulate block\n", "===========");

    // console.log(manipResult) 
    console.log("text:", processPictureManipulateBlock.text);

    var string = "";
    string = processPictureManipulateBlock.text;
    console.log("typeof string var: " + typeof string);
    string = string.split(/\s|\n/g);

    console.log("typeof string var: " + typeof string);

    this.searchYa(string);
  }

  searchYa = async (stringArray) => {
    for (var i in stringArray) {
      stringArray[i] = stringArray[i].replace(/\W|[_]|\d|mg/g, '')
      stringArray[i] = stringArray[i].replace(/\s/g, '%20')
     

      if (stringArray[i] == '')
        console.log("text unavailable")
      else {
        var result = await Scraper(stringArray[i])
        console.log(stringArray[i] + "with the result: " + result)
        if (result != undefined || result != null)
          console.log("available text")
        console.log("\ndrug name", stringArray[i])
        // console.log("Result",result)
        console.log("First drug name", stringArray[0])
          if(result!=0)
            var result = "ชื่อยา" + " " + " " + stringArray[0] + " " + " " + result;
            console.log("Info before Vaja", result);
            this.playAudio(result);

      }

    }


  };
  




  playAudio = async (result) => {

    console.log("feed to vaja", result);


    var audioData = await vajaAPI(result);
    console.log("audio result", audioData);

    var soundObj = new Audio.Sound();
    var currentIndex = 0;

    var _status = await soundObj.getStatusAsync();
    var totIdx = audioData.length - 1;
    // firstly look at below here the logic to start the audio.. so if u wanna stop it.. you might change some code below.. :) i recommend u using state :)


    while (this.state.modalVisible) {
      // get status of sound object
      var _status = await soundObj.getStatusAsync();
      var totIdx = audioData.length - 1;
      console.log('currentIndex: ' + currentIndex + ' of ' + totIdx);
      console.log(_status);
      // stopper if the sound index is more than the audio so stop it
      if (currentIndex >= audioData.length || this.state.modalVisible == false) { // here is to exit the while 
        if (_status.isPlaying) soundObj.stopAsync();
        return;
      }
      // to load the audio files, if audio is not loaded load it 
      if (_status.isLoaded != true) {
        try {
          await soundObj.loadAsync({ uri: audioData[currentIndex].uri }) // load the audio by the index..
        } catch (error) {
          console.error(error);
        }
      } else
        if (_status.isLoaded == true && _status.isPlaying == false) { // to undload the audio, if the audio is loaded but the audio is already played so we need to unload first before load the new one..
          if (_status.durationMillis == _status.positionMillis) { // i think you have to
            try {
              await soundObj.unloadAsync();
              currentIndex = currentIndex + 1; //change to the next index
            } catch (error) {
              console.log(error);
            }
          }
          // play audio here.. 
          try {
            await soundObj.playAsync();
          } catch (error) {
            console.log(error);
          }
        }
    }



  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Camera
          ref={ref => {
            this.camera = ref
          }}
          style={{ flex: 3 }}
          type={Camera.Constants.Type.back}
          autoFocus={Camera.Constants.AutoFocus.on}
        />
        <View style="{{ flex: 1; backgroundColor: 'white'; }}">

          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.modalVisible}
            onRequestClose={() => {
              Alert.alert("Modal has been closed.");
            }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Wait
                กรุณารอสักครู่</Text>

                <TouchableHighlight
                  style={{ ...styles.openButton, backgroundColor: "#2196F3" }}
                  onPress={() => {
                    this.setModalVisible(!this.state.modalVisible);
                  }}
                >
                  <Text style={styles.textStyle}>Exit</Text>
                </TouchableHighlight>
              </View>
            </View>
          </Modal>
          <TouchableOpacity
            onPress={() => {
              this.takePicture();
              this.setModalVisible(true);
              console.log("clicked button succed");
            }}
            style={{ alignItems: 'center' }}
          >
            <Ionicons name="ios-radio-button-on" size={64} color="black" />
            <Text style={{ color: '#ffffff', fontSize: 6 }}>  take a photo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }



}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',

  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  openButton: {
    backgroundColor: "#F194FF",
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  }
});