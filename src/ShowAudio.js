import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { Audio } from 'expo-av';

export default class showAudio extends Component {

    constructor(props) {
        super(props)
    }
    componentDidMount() {
        console.log("Andre say now is playig the audio\n")
        this.playAudio();
    }

   
    render() {

        const { Result } = this.props.route.params;

        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text>Show Drug Info</Text>
                    <Text>{Result}</Text>
                </View>

            </SafeAreaView>

        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
