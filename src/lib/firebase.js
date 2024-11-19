const firebase = require('firebase')

/**
 * Configure firebase and return an instance from that.
 */
firebase.initializeApp({
  apiKey: 'AIzaSyBxJKXi0j6ymR9NngdotUIdtUM2knAS-dM',
  authDomain: 'integradores-b2aa6.firebaseapp.com',
  databaseURL: 'https://integradores-b2aa6.firebaseio.com',
  projectId: 'integradores-b2aa6',
  storageBucket: 'integradores-b2aa6.appspot.com',
  messagingSenderId: '191392021732'
})

module.exports = firebase
