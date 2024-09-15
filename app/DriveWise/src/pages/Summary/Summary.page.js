import React, { useContext, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import * as Progress from "react-native-progress";
import { AuthenticationContext } from "../../infra/auth.context";
import ConfettiCannon from "react-native-confetti-cannon";
import { addNewTrip } from "../../api/user.api";

// Utility function to convert milliseconds to the desired format
const formatElapsedTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  } else {
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }
};

export const Summary = ({ navigation, route }) => {
  const {
    elapsedTime = 25000,
    accelerationData,
    speedData,
    ida,
  } = route?.params || {};
  let stats = 0;
  const { user } = useContext(AuthenticationContext);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(elapsedTime / 1000 / ida);
  const [totalTrips, setTotalTrips] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [streak, setStreak] = useState(0);

  const addTrip = async () => {
    try {
      let { streak, totalHours, totalTrips } = await addNewTrip(
        {
          duration: elapsedTime / 1000,
          time: Date.now(),
        },
        user
      );

      setStreak(streak);
      setTotalTime(totalHours);
      setTotalTrips(totalTrips);
    } catch (error) {
      console.log(error);
    }
  };

  const runEffect = async () => {
    setIsLoading(true);
    await addTrip();
    setIsLoading(false);
  };

  useEffect(() => {
    runEffect();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : (
          <>
            <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />
            <View style={styles.brainScoreContainer}>
              <AnimatedCircularProgress
                size={150}
                width={15}
                fill={score}
                tintColor="#3b5998"
                backgroundColor="#e0e0e0"
              >
                {(fill) => (
                  <View style={styles.circularTextContainer}>
                    <Text style={styles.circularScore}>{score.toFixed(1)}</Text>
                    <Text style={styles.circularSubtitle}>NOVICE</Text>
                  </View>
                )}
              </AnimatedCircularProgress>
              <Text style={styles.brainScoreTitle}>
                Time Elapsed: {formatElapsedTime(elapsedTime)}
              </Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Streak 🔥</Text>
                <Text style={styles.statValue}>{streak}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Trips 🚘</Text>
                <Text style={styles.statValue}>{totalTrips}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Hours ⏰</Text>
                <Text style={styles.statValue}>{totalTime}</Text>
              </View>
            </View>
          </>
        )}

        {/* <View style={styles.statsContainer}>
          {renderSkill("CONSISTENCY", 0.7, "#4d79ff")}
          {renderSkill("Timeliness", 0.65, "#66cc66")}
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

// Function to render each skill with a progress bar
const renderSkill = (skillName, progress, progressColor) => {
  return (
    <View style={styles.skillCard} key={skillName}>
      <View style={styles.skillRow}>
        <Text style={styles.skillName}>{skillName} :</Text>
        <Text style={styles.skillScore}>200</Text>
      </View>
      <Progress.Bar
        progress={progress}
        width={null}
        color={progressColor}
        unfilledColor="#e0e0e0"
        borderWidth={0}
        height={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // Ensures the entire background is white
  },
  container: {
    flexGrow: 1,

    padding: 20,
    backgroundColor: "#fff", // Ensures the content background is white
    marginTop: 30, // Added to shift content down by 30 units
  },
  brainScoreContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  brainScoreTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  brainScoreSubtitle: {
    fontSize: 14,
    color: "#777",
  },
  circularTextContainer: {
    alignItems: "center",
  },
  circularScore: {
    fontSize: 36,
    fontWeight: "bold",
  },
  circularSubtitle: {
    fontSize: 16,
    color: "#777",
  },
  statsContainer: {
    width: "100%",
    marginBottom: 20, // Add margin at the bottom
  },
  skillCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3, // Add shadow for iOS, elevation for Android
  },
  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  skillName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  skillScore: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#777",
  },
  skillsToImproveContainer: {
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    marginTop: 20,
  },
  skillsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  improvementSkillBox: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2, // For Android shadow
    width: "45%",
  },
  improvementSkillText: {
    fontSize: 16,
    fontWeight: "500",
  },
  footerContainer: {
    marginTop: 40, // Adds space before the footer
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  footerText: {
    fontSize: 14,
    color: "#888", // Grey text for the footer
    textAlign: "center",
  },
  logOut: {
    alignSelf: "flex-end",
  },
  logOutText: {
    fontSize: 18,
  },
  statsContainer: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    marginBottom: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#666",
  },
});
