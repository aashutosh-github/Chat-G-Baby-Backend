type Time = {
  hours: number;
  minutes: number;
  seconds: number;
};

const normalizeTime: (time: number) => string = timeInSeconds => {
  let time: Time = {
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  if (timeInSeconds <= 0) {
    time = {
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  if (timeInSeconds < 60) {
    time = {
      hours: 0,
      minutes: 0,
      seconds: timeInSeconds,
    };
  } else if (timeInSeconds >= 60) {
    const timeInMinutes: number = Math.floor(timeInSeconds / 60);
    const remainingSeconds: number = Math.floor(timeInSeconds % 60);

    if (timeInMinutes >= 60) {
      const timeInHours: number = Math.floor(timeInMinutes / 60);
      const remainingMinutes: number = Math.floor(timeInMinutes % 60);
      time = {
        hours: timeInHours,
        minutes: remainingMinutes,
        seconds: remainingSeconds,
      };
    } else {
      time = {
        hours: 0,
        minutes: timeInMinutes,
        seconds: remainingSeconds,
      };
    }
  }

  let finalTime: string = "";

  if (time.hours !== 0) {
    finalTime +=
      time.hours === 1 ? `${time.hours} hour` : `${time.hours} hours`;
  }
  if (time.minutes !== 0) {
    if (finalTime.length !== 0) finalTime += " ";
    finalTime +=
      time.minutes === 1 ? `${time.minutes} minute` : `${time.minutes} minutes`;
  }
  if (time.seconds !== 0) {
    if (finalTime.length !== 0) finalTime += " ";
    finalTime +=
      time.seconds === 1 ? `${time.seconds} second` : `${time.seconds} seconds`;
  }
  return finalTime.trim();
};

export default normalizeTime;
