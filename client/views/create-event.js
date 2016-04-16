import React, {
  SegmentedControlIOS,
  Component,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight,
  Image,
  Dimensions,
  Animated,
  PickerIOS
} from 'react-native';

import Picker from './picker';
import {sendEvent, updateLocation} from '../helpers/request-helpers';

const DISTANCE_TO_REFRESH = 0.004;
const deviceWidth         = Dimensions.get('window').width;
const deviceHeight        = Dimensions.get('window').height;
const earlyArrivalTimes   = [{time: '5 minutes', value: '300'},{time: '10 minutes', value: '600'},{time: '15 minutes', value: '900'}, {time: '20 minutes', value: '1200'}, {time: '30 minutes', value: '1800'}, {time: '45 minutes', value: '2700'}, {time: '1 hour', value: '3600'}];

class CreateEvent extends Component {

  constructor(props) {
    super(props);

    this.watchID = null;

    this.state = {
      initialPosition: 'unknown',
      lastPosition: 'unknown',
      eventName: '',
      eventTime: '',
      destination: '',
      earlyArrivalIndex: 0,
      mode: 'Driving',
      values: ['Driving', 'Walking' , 'Bicycling', 'Transit'],
      offSet: new Animated.Value(deviceHeight),
    };
  }

  componentDidMount() {
    navigator.geolocation.getCurrentPosition((position) => {
      var initialPosition = position;
      this.setState({ initialPosition });
    },
    (error) => alert(error.message),
    {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000});
  }

  changeEarlyArrival(earlyArrivalIndex) {
    this.setState({ earlyArrivalIndex });
  }

  clearForm() {
    this.setState({
      eventName: '',
      eventTime: '',
      destination: '',
      earlyArrivalIndex: 0,
  //  mode: 'Driving',  //Until refresh unhighlights previous selected segment
      modal: false,
    });
  }

  buttonClicked() {
    var newEvent  = {
      eventName: this.state.eventName,
      eventTime: this.state.eventTime,
      destination: this.state.destination,
      earlyArrival: earlyArrivalTimes[this.state.earlyArrivalIndex].value,
      mode: this.state.mode,
    };
    this.clearForm();
    var origin   = this.state.initialPosition.coords;

    sendEvent(newEvent);
    updateLocation(origin);

    this.watchID = navigator.geolocation.watchPosition((position) => {
      var lastPosition = position;
      this.setState({ lastPosition });

      var initialPosition   = this.state.initialPosition;
      var initialLatitude   = initialPosition.coords.latitude;
      var initialLongitude  = initialPosition.coords.longitude;
      var lastLatitude      = lastPosition.coords.latitude;
      var lastLongitude     = lastPosition.coords.longitude;

      var distanceTraveled  = Math.sqrt(Math.pow((initialLatitude - lastLatitude), 2) + Math.pow((initialLongitude - lastLongitude), 2));

      var that = this;

      if (distanceTraveled >= DISTANCE_TO_REFRESH) {
        updateLocation(this.state.lastPosition.coords, that);
        this.setState({ initialPosition: lastPosition });
      }
    },
    (error) => alert(error.message),
    {enableHighAccuracy: true, timeout: 20000, maximumAge: 60000});
  }

  _onChange(event){
    this.setState({
      selectedIndex: event.nativeEvent.selectedSegmentIndex,
    });
  }

  _onValueChange(value) {
    this.setState({
      mode: value,
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.inputsContainer}>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.inputFormat, styles.inputStyle]}
              placeholder="Event Name"
              placeholderTextColor="#F5F5F6"
              value={this.state.eventName}
              onChangeText={(eventName) => this.setState({eventName})}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.inputFormat, styles.inputStyle]}
              placeholder="Event Location"
              placeholderTextColor="#F5F5F6"
              value={this.state.destination}
              onChangeText={(destination) => this.setState({destination})}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.inputFormat, styles.inputStyle]}
              placeholder="Event Time"
              placeholderTextColor="#F5F5F6"
              value={this.state.eventTime}
              onChangeText={(eventTime) => this.setState({eventTime})}
            />
          </View>

          <View style={styles.inputContainer}>
            <TouchableHighlight style={styles.inputFormat} underlayColor="transparent" onPress={ () => this.setState({modal: true}) }>
              <Text style={styles.inputStyle}>Early Arrival -- {earlyArrivalTimes[this.state.earlyArrivalIndex].time}</Text>
            </TouchableHighlight>
            { this.state.modal ? <Picker closeModal={() => this.setState({ modal: false })} offSet={this.state.offSet} changeEarlyArrival={this.changeEarlyArrival.bind(this)} earlyArrivalIndex={this.state.earlyArrivalIndex} /> : null }
          </View>

          <View style={this.state.modal ? styles.hidden : styles.segmentedContainer}>
            <TextInput
              style={[styles.inputFormat, styles.inputStyle]}
              placeholder="Mode of Transport"
              placeholderTextColor="#F5F5F6"/>
              <View style={styles.segmentedSpacing}></View>
            <SegmentedControlIOS tintColor="#CCC"
              style={styles.segmented}
              values={this.state.values}
              onChange={this._onChange.bind(this)}
              onValueChange={this._onValueChange.bind(this)}/>
          </View>

        </View>

        <TouchableHighlight
          pointerEvents={this.state.modal ? 'none' : 'auto'}
          style={this.state.modal ? styles.hidden : styles.submitButton}
          onPress={this.buttonClicked.bind(this)}>
          <View>
            <Text style={styles.inputStyle}>Submit!</Text>
          </View>
        </TouchableHighlight>

        <View style={styles.empty}></View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  inputsContainer: {
    marginTop: 25,
    marginBottom: 15,
    paddingTop: 20,
    flex: .75
  },
  segmentedContainer: {
    padding: 10,
    margin: 10,
  },
  inputContainer: {
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderBottomColor: '#CCC',
    borderColor: 'transparent'
  },
  inputFormat: {
    left: 35,
    top: 5,
    right: 0,
    height: 25,
  },
  inputStyle: {
    color: '#F5F5F6',
    fontSize: 16
  },
  submitButton: {
    backgroundColor: '#34778A',
    padding: 20,
    alignItems: 'center',
  },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: .15
  },
  buttonText: {
    color: '#F5F5F6',
    fontSize: 16,
    fontFamily: 'HelveticaNeue-Light',
    textAlign: 'center',
  },
  inputs: {
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderBottomColor: '#F5F5F6',
    borderColor: 'transparent'
  },
  hidden: {
    opacity: 0,
  },
  segmented: {
    height: 40,
    borderWidth: 2,
    borderColor: '#CCC',
  },
  segmentedSpacing: {
    height: 20,
  }
});


export default CreateEvent;
