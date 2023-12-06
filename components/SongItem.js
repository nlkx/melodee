import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import React, {useContext} from "react";
import { Entypo } from "@expo/vector-icons";
import { Player } from "../PlayerContext";


const SongItem = ({ item, onPress, isPlaying }) => {
    const { currentTrack, setCurrentTrack } = useContext(Player);
    const handlePress = () => {
        setCurrentTrack(item);
        onPress(item)

    }
  return (
    <Pressable
    onPress={handlePress}
      style={{ flexDirection: "row", alignItems: "center", padding: 10 }}
    >
      <Image
        style={{ width: 50, height: 50, marginRight: 10 }}
        source={{ uri: item?.track?.album?.images[0].url }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={
            isPlaying
              ? {
                  fontWeight: "bold",
                  fontSize: 14,
                  color: "#3FFF00",
                }
              : { fontWeight: "bold", fontSize: 14, color: "white" }
          }
        >
          {item?.track?.name}
        </Text>
        <Text style={{ marginTop: 4, color: "#989898" }}>
          {item?.track?.artists[0].name}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 10,
        }}
      >
        <Entypo name="dots-three-vertical" size={24} color="white" />
      </View>
    </Pressable>
  );
};

export default SongItem;

const styles = StyleSheet.create({});
