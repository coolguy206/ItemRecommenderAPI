const moment = require('moment');

function getAdjustedTimestamp(param) {
  let date;
  if (!param) {
    date = new Date();
    let hours = date.getHours();
    let day = date.getDate();

    if (hours < 3) {
      //? Subtract one day safely, handling month/year boundaries
      date.setDate(day - 1);

      //? Set to 10 PM of previous day
      date.setHours(22, 0, 0, 0);

    } else {

      //? Subtract 3 hours from current time
      date.setHours(hours - 3, 0, 0, 0);
      // console.log(`from getAdjustedTimestamp no param: ${date}`);
    }
  } else {

    date = new Date(param);
    // console.log(`from getAdjustedTimestamp with param: ${date}`);
  }

  //? Return Unix timestamp using moment
  return moment(date).unix();
}

module.exports = getAdjustedTimestamp;