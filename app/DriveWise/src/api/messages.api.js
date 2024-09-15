import axios from "axios";
const route = "https://drivewise-f0093f7b9daa.herokuapp.com";

export const sendMessage = async (message, history) => {
  try {
    const res = await axios.post(`${route}/message`, {
      message,
      history,
    });
    return res.data.response;
  } catch (error) {
    console.log(error);
  }
};
