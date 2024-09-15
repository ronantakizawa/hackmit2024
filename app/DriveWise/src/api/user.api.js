import axios from "axios";
const route = "https://drivewise-f0093f7b9daa.herokuapp.com";

export const createUser = async (userId) => {
  try {
    console.log("run", userId);
    const res = await axios.post(`${route}/user/createUser`, {
      userId: userId,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUserData = async (userId) => {
  try {
    const res = await axios.get(`${route}/user/get/${userId}`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const addNewTrip = async (trip, userId) => {
  try {
    console.log("Running addNewTrip req");
    const res = await axios.post(`${route}/user/addTrip`, {
      trip,
      userId,
    });
    console.log(res.data);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const addSkillReq = async (skill, userId) => {
  try {
    const res = await axios.post(`${route}/user/addSkill`, {
      skill,
      userId,
    });
  } catch (error) {
    console.log(error);
  }
};
