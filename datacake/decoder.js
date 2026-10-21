// Datacake MQTT decoder for the ESPHome calorifier logger.
// Subscribe the integration to: calorifier-logger/sensor/+/state
//
// ESPHome publishes one message per sensor, payload is the bare value, e.g.
//   topic   calorifier-logger/sensor/dhw_flow/state
//   payload 17.875
// Field IDs keep the old Tasmota format (ID_ + middle 12 hex digits of the
// DS18B20 ROM address) so existing Datacake fields and history carry over.

function Decoder(topic, payload) {
    var deviceName = "wwft_boilers";
    var fieldPrefix = 'ID_';

    // ESPHome sensor object_id -> DS18B20 serial
    var sensorIds = {
        "dhw_flow":      "3CE1E3811998",
        "dhw_return":    "3CE1E381F2DF",
        "boiler_flow":   "3CE1E381702F",
        "boiler_return": "3CE1E3816559",
        "mcw_in":        "3CE1E3812F35"
    };

    // topic: calorifier-logger/sensor/<object_id>/state
    var objectId = topic.split('/')[2];
    var sensorId = sensorIds[objectId];
    if (!sensorId) {
        return []; // wifi_signal, uptime, ip_address etc. - not mapped
    }

    var currentTempValue = parseFloat(payload);
    if (isNaN(currentTempValue)) {
        return []; // ESPHome publishes "nan" when a probe fails to read
    }

    var currentFieldId = fieldPrefix + sensorId;
    var resultsArray = [{
        device: deviceName,
        field: currentFieldId,
        value: currentTempValue
    }];

    // Each message carries a single sensor, so only update TARGETREACHED when
    // this message is the target sensor - otherwise every other sensor's
    // message would reset it to 0.
    var datacakeUUID = deviceSerialToId[deviceName];
    var config = configurationValues[datacakeUUID] || {};
    var targetTempValue = config["TARGETTEMP"];
    var targetSensorId = config["TARGETSENSOR"] || sensorIds["dhw_flow"];

    if (targetSensorId && currentFieldId === fieldPrefix + targetSensorId
            && targetTempValue !== undefined && targetTempValue !== null) {
        resultsArray.push({
            device: deviceName,
            field: "TARGETREACHED",
            value: (currentTempValue >= targetTempValue) ? 1 : 0
        });
    }

    return resultsArray;
}
