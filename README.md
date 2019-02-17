# pi_alarm

PI_Alarm is a Raspberry PI node.js based alarm application utilising the PI_Face Digital 2 interface. It allows for the configuration of 8 wired inputs (preferably PIR sensors), and 8 wired outputs that can be grouped as Buzzers (Sounded when arm or warning events are triggered) or Sirens (Sounded when alarm is trigged)

![PI_Face Digital 2](icon.jpg)

## Installation

Download and unpack this repository on the Raspberry PI device with the PI_Face Digital 2 board installed. This code will be dependant on the libaries installed from the node-pifacedigital package https://www.npmjs.com/package/node-pifacedigital. Make sure to follow the setup instructions listed on the node-pifacedigital readme, and enable the SPI functionality. once the node-pifacedigital libraries a installed you should then be able to use NPM to install the rest of the dependancies.

```bash
$ npm install
```

## Configuration

All config options are located within the [./config/default.json](./config/default.json) file

The following environment variables will need to be set on the Raspberry Pi device.

| Environment variable | Description |
|----------------------|-------------|
| `jwtPrivateKey` | this variable is mandatory and must be used to specify the key needed by the application to create JSON web tokens |
| `pi_alarm_poApiKey` | Pushover API key - for push notification services|
| `pi_alarm_poUserKey` | Pushover User Key - for push notification services |

I recommend adding them to the `.bashrc` file of the account you will be using to run this node.js app. Replace `KeyString, PushoverAPIKey, and PushoverUserKey` with you own values.

```bash
echo export "jwtPrivateKey=KeyString" >> .bashrc
echo export "pi_alarm_poApiKey=PushoverAPIKey" >> .bashrc
echo export "pi_alarm_poUserKey=PushoverUserKey" >> .bashrc
```


## AWS Messaging

pi_alarm uses [AWS IOT Core](https://aws.amazon.com/iot-core/) MQTT/Device Shadows in order to communicate events, and allow for remote control. You will need to create an AWS account and set up an IOT device/thing and copy the certifcates into the [./certificates](.certificates) directory and update the `AWS` object in the [./config/default.json](./config/default.json) file with the certifcate filenames, host, and clientId. Make sure you use the same clientId as the `device/thing` you created.

I recommend using a policy with iot:* and resources * for initial setup, and then locking it down once everything is running correctly.

`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iot:*",
      "Resource": "*"
    }
  ]
}`

There are example messages, a device shadow, and policy within the [./samples/awsIOT]](./samples/awsIOT) directory. The default is configured to use the pi_alarm topic for status events and control. 

Within the AWS IOT Core console, select the "Test" option to open the MQTT client. Then subscribe to the correct topic, the default is `pi_alarm`, you should the be able to see messages sent from the pi_alarm service.

![MQTT Subscribe](./samples/Subscribe.GIF)

To set the alarm via aws copy the "arm" message from [./samples/awsIOT/message.json](./samples/awsIOT/message.json) 

`{
        "host": "alarm control",
        "device": "pi_alarm",
        "type": "command",
        "command": "arm"
 }`
    
![MQTT Arming](./samples/Arm.GIF)

To disarm simply paste the "disarm" packet to the `pi_alarm` topic

`{
        "host": "alarm control",
        "device": "pi_alarm",
        "type": "command",
        "command": "disarm"
 }`
 
 ## Run
 
 I recommend using the nodemon process to run this app, as any changes you make to the files will automatically restart the application while you are setting up and configuring `pi_alarm`
 
 ```bash
 cd pi_alarm
 nodemon index.js
```
