import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import React, { useState, useEffect, useContext, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SongItem from "../components/SongItem";
import { Player } from "../PlayerContext";
import { BottomModal } from "react-native-modals";
import { ModalContent } from "react-native-modals";
import { Audio } from "expo-av";
import { debounce } from "lodash";

const LikedSongsScreen = () => {
  const navigation = useNavigation();
  const { currentTrack, setCurrentTrack } = useContext(Player);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchedTracks,setSearchedTracks] = useState([]);
  const [input, setInput] = useState("");
  const [savedTracks, setSavedTracks] = useState([]);
  const value = useRef(0);
  const [currentSound, setCurrentSound] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  async function getSavedTracks() {
    const accessToken = await AsyncStorage.getItem("token");
    const response = await fetch(
      "https://api.spotify.com/v1/me/tracks?offset=0&limit=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          limit: 50,
        },
      }
    );

    if (!response.ok) {
      throw new Error("failed to fetch tracks");
    }
    const data = await response.json();
    setSavedTracks(data.items);
  }
  useEffect(() => {
    getSavedTracks();
  }, []);

  console.log(savedTracks);
  
  const playTrack = async () => {
    if (savedTracks.length > 0) {
      setCurrentTrack(savedTracks[0]);
    }
    await play(savedTracks[0]);
  };
  const play = async (nextTrack) => {
    console.log(nextTrack);
    const preview_url = nextTrack?.track?.preview_url;
    try {
        if(currentSound){
            await currentSound.stopAsync();
        }
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
      const { sound, status } = await Audio.Sound.createAsync(
        {
          uri: preview_url,
        },
        {
          shouldPlay: true,
          isLooping: false,
        },
        onPlaybackStatusUpdate
      );
      console.log("sound", status);
      onPlaybackStatusUpdate(status);
      setCurrentSound(sound);
      setIsPlaying(status.isLoaded);
      await sound.playAsync();
    } catch (err) {
      console.log(err.message);
    }
  };
  const onPlaybackStatusUpdate = async (status) => {
    console.log(status);
    if (status.isLoaded && status.isPlaying) {
      const progress = status.positionMillis / status.durationMillis;
      console.log("progresss", progress);
      setProgress(progress);
      setCurrentTime(status.positionMillis);
      setTotalDuration(status.durationMillis);
    }

    if (status.didJustFinish) {
      setCurrentSound(null);
      playNextTrack();
    }
  };

  const circleSize = 12;
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handlePlayPause = async () => {
    if (currentSound) {
      if (isPlaying) {
        await currentSound.pauseAsync();
      } else {
        await currentSound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if(savedTracks.length > 0){
      handleSearch(input)
    }
  },[savedTracks])


  const playNextTrack = async () => {
    if (currentSound) {
      await currentSound.stopAsync();
      setCurrentSound(null);
    }
    value.current += 1;
    if (value.current < savedTracks.length) {
      const nextTrack = savedTracks[value.current];
      setCurrentTrack(nextTrack);

      await play(nextTrack);
    } else {
      console.log("end of playlist");
    }
  };

  const playPreviousTrack = async () => {
    if (currentSound) {
      await currentSound.stopAsync();
      setCurrentSound(null);
    }
    value.current -= 1;
    if (value.current < savedTracks.length) {
      const nextTrack = savedTracks[value.current];
      setCurrentTrack(nextTrack);

      await play(nextTrack);
    } else {
      console.log("end of playlist");
    }
  };

  const debouncedSearch = debounce(handleSearch, 800);
  function handleSearch(text) {
    const filteredTracks = savedTracks.filter((item) =>
      item.track.name.toLowerCase().includes(text.toLowerCase())
    );
    setSearchedTracks(filteredTracks);
  }
  const handleInputChange = (text) => {
    setInput(text);
    debouncedSearch(text);
  };
  return (
    <>
      <LinearGradient colors={["#3E3076", "#121212"]} style={{ flex: 1 }}>
        <ScrollView
          style={{
            flex: 1,
            marginTop: 50,
          }}
        >
        
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ marginHorizontal: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          <Pressable
            style={{
              marginHorizontal: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 9,
            }}
          >
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 9,
                backgroundColor: "#482864",
                flex: 1,
                borderRadius: 3,
                height: 38,
              }}
            >
              <AntDesign name="search1" size={20} color="white" />
              <TextInput
                value={input}
                onChangeText={(text) => handleInputChange(text)}
                placeholder="Find in liked songs"
                placeholderTextColor={"white"}
                style={{ fontWeight: "500", color:"white" }}
              />
            </Pressable>

            <Pressable
              style={{
                marginHorizontal: 10,
                backgroundColor: "#482864",
                padding: 10,
                borderRadius: 3,
                height: 38,
              }}
            >
              <Text style={{ color: "white" }}>Sort</Text>
            </Pressable>
          </Pressable>

          <View style={{ height: 50 }} />

          <View style={{ marginHorizontal: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
              Liked Songs
            </Text>
            <Text style={{ color: "white", fontSize: 13, marginTop: 5 }}>
              403 Songs
            </Text>
          </View>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginHorizontal: 10,
            }}
          >
            <Pressable
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#8771E1",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AntDesign name="arrowdown" size={20} color="white" />
            </Pressable>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Ionicons name="shuffle" size={30} color="#8771E1" />
              <Pressable
                onPress={playTrack}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#8771E1",
                }}
              >
                <Entypo name="controller-play" size={35} color="white" />
              </Pressable>
            </View>
          </Pressable>

          {searchedTracks.length === 0 ? (
            <ActivityIndicator size="large" color="gray" /> 
          ) : (
            <FlatList
              showsVerticalScrollIndicator={false}
              data={searchedTracks}
              renderItem={({ item }) => (
                <SongItem
                  item={item}
                  onPress={play}
                  isPlaying={item === currentTrack}
                />
              )}
            />
          )}
        
        </ScrollView>
      </LinearGradient>

      {currentTrack && (
        <Pressable
          onPress={() => setModalVisible(!modalVisible)}
          style={{
            backgroundColor: "#3E3076",
            width: "90%",
            padding: 10,
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: 15,
            position: "absolute",
            borderRadius: 6,
            left: 20,
            bottom: 10,
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              style={{ width: 40, height: 40 }}
              source={{ uri: currentTrack?.track?.album?.images[0].url }}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                width: 220,
                color: "white",
                fontWeight: "bold",
              }}
            >
              {currentTrack?.track?.name} •{" "}
              {currentTrack?.track?.artists[0].name}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AntDesign name="heart" size={24} color="#8771E1" />
            <Pressable onPress={handlePlayPause}>
            {isPlaying ? (
                    <Ionicons name="pause-circle" size={30} color="white" />
                  ) : (
                    <Pressable onPress={handlePlayPause}>
                      <Ionicons name="play-circle" size={30} color="white" />
                    </Pressable>
                  )}
                </Pressable>

          </View>
        </Pressable>
      )}

      <BottomModal
        visible={modalVisible}
        onHardwareBackPress={() => setModalVisible(false)}
        swipeDirection={["up", "down"]}
        swipeThreshold={200}
      >
        
        <ModalContent
          style={{ height: "100%", width: "100%", backgroundColor: "#3E3076" }}
        >
          <View style={{ height: "100%", width: "100%", marginTop: 40 }}>
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <AntDesign
                onPress={() => setModalVisible(!modalVisible)}
                name="down"
                size={24}
                color="white"
              />

              <Text
                style={{ fontSize: 13, fontWeight: "bold", color: "white" }}
              >
                {currentTrack?.track?.name}
              </Text>

              <Entypo name="dots-three-vertical" size={24} color="white" />
            </Pressable>

            <View style={{ height: 70 }} />

            <View style={{ padding: 10 }}>
              <Image
                style={{ width: 350, height: 350, borderRadius: 1000, alignSelf:"center" }}
                source={{ uri: currentTrack?.track?.album?.images[0].url }}
              />
              <View
                style={{
                  marginTop: 20,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text
                    style={{ fontSize: 18, fontWeight: "bold", color: "white" }}
                  >
                    {currentTrack?.track?.name}
                  </Text>
                  <Text style={{ color: "#D3D3D3", marginTop: 4 }}>
                    {currentTrack?.track?.artists[0].name}
                  </Text>
                </View>
                <AntDesign name="heart" size={24} color="#8771E1" />
              </View>

              <View style={{ marginTop: 10 }}>
                <View
                  style={{
                    width: "100%",
                    marginTop: 10,
                    height: 3,
                    backgroundColor: "gray",
                    borderRadius: 5,
                  }}
                >
                  <View
                    style={[
                      styles.progressbar,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      {
                        position: "absolute",
                        top: -5,
                        width: circleSize,
                        height: circleSize,
                        borderRadius: circleSize / 2,
                        backgroundColor: "white",
                      },
                      {
                        left: `${progress * 100}%`,
                        marginLeft: -circleSize / 2,
                      },
                    ]}
                  />
                </View>

                <View
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 15, color: "#D3D3D3" }}
                  >
                    {formatTime(currentTime)}
                  </Text>

                  <Text
                    style={{ color: "white", fontSize: 15, color: "#D3D3D3" }}
                  >
                    {formatTime(totalDuration)}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 17,
                }}
              >
                <Pressable>
                  <Ionicons name="shuffle" size={30} color="white" />
                </Pressable>
                <Pressable onPress={playPreviousTrack}>
                  <Ionicons name="play-skip-back" size={30} color="white" />
                </Pressable>
                <Pressable onPress={handlePlayPause}>
                  {isPlaying ? (
                    <Ionicons name="pause-circle" size={60} color="white" />
                  ) : (
                    <Pressable onPress={handlePlayPause}>
                      <Ionicons name="play-circle" size={60} color="white" />
                    </Pressable>
                  )}
                </Pressable>
                <Pressable onPress={playNextTrack}>
                  <Ionicons name="play-skip-forward" size={30} color="white" />
                </Pressable>
                <Pressable>
                  <Ionicons name="repeat" size={30} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        </ModalContent>
      </BottomModal>
    </>
  );
};

export default LikedSongsScreen;

const styles = StyleSheet.create({
  progressbar: {
    height: "100%",
    backgroundColor: "white",
  },
});
