var Firebase = require("firebase");
var myFirebaseRef = new Firebase("https://drch-eef35.firebaseio.com/csi");
 
 
myFirebaseRef.child("status").on("value", function(snapshot){            // probably will need to get the right firbaase child reference for status
//myFirebaseRef.on("status", function(snapshot){
 
    var faucetState = snapshot.val()
 
    /*if (faucetState == "OPEN"){
        console.log('Open!');
    }
    else {  
        console.log("Closed");
    }*/
    console.log(faucetState);
})