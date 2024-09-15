import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MapScreen from "../../pages/Home/Home.page";
import ProfileScreen from "../../pages/Profile/ProfileScreen.page";
import LearnScreen from "../../pages/Learn/LearnScreen.page";
import SkillDetailScreen from "../../pages/SkillDetail/SkillDetailScreen.page"; // Import the new screen for skill details
import { FontAwesome } from "@expo/vector-icons";
import { Summary } from "../../pages/Summary/Summary.page";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Chat } from "../../pages/Chat/Chat.page";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();

// Stack Navigator for Home and Summary Screens
const HomeNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Summary" component={Summary} />
    </Stack.Navigator>
  );
};

// Stack Navigator for Learn Screen and Skill Detail
const LearnStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LearnScreen" component={LearnScreen} />
      <Stack.Screen name="SkillDetail" component={SkillDetailScreen} />
    </Stack.Navigator>
  );
};

// Top Tab Navigator for Learn Stack
const LearnNavigator = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        headerShown: false,
        swipeEnabled: true,
        tabBarActiveTintColor: "white",
        tabBarLabelStyle: {
          textTransform: "capitalize",
          fontSize: RFPercentage(2.5),
        },
        tabBarStyle: {
          backgroundColor: "white",
        },
        tabBarIndicatorStyle: {
          backgroundColor: "#4CAF50",
        },
      }}
    >
      <TopTab.Screen
        name="Chat"
        component={Chat}
        options={{ tabBarLabel: "Chat" }} // Add a custom label for the tab
      />
      <TopTab.Screen
        name="LearnStack"
        component={LearnStack}
        options={{ tabBarLabel: "Learn" }} // Add a custom label for the tab
      />
    </TopTab.Navigator>
  );
};

// Authenticated Navigator (Bottom Tab Navigator)
export const AuthenticatedNavigator = () => {
  const TAB_ICON = {
    Home: "home",
    Learn: "book",
    Profile: "user",
  };

  return (
    <Tab.Navigator
      tabBarHideOnKeyboard={true}
      screenOptions={({ route }) => {
        const iconName = TAB_ICON[route.name];
        return {
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name={iconName} color={color} size={size} />
          ),
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#FFFFFF",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#4CAF50",
            position: "absolute",
            borderTopWidth: 0,
            elevation: 0,
          },
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Learn" component={LearnNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
