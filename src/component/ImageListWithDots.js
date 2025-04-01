import React, { useState } from "react";
import { View, Image, FlatList, StyleSheet, Dimensions } from "react-native";

const imagesData = [
  { id: "1", source: require("../image/placeholder.png") },
  { id: "2", source: require("../image/placeholder.png") },
  { id: "3", source: require("../image/placeholder.png") },
  { id: "4", source: require("../image/placeholder.png") },
  { id: "5", source: require("../image/placeholder.png") },
];

const { width, height } = Dimensions.get("window");

const ImageListWithDots = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Danh sách ảnh */}
      <FlatList
        data={imagesData}
        horizontal
        pagingEnabled
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        renderItem={({ item }) => (
          <Image source={item.source} style={styles.image} />
        )}
      />

      {/* Thanh tiến trình dạng chấm */}
      <View style={styles.progressContainer}>
        {imagesData.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  image: {
    width: width * 0.9, // 90% chiều rộng màn hình
    height: height * 0.25, // 25% chiều cao màn hình
    borderRadius: 10,
    resizeMode: "cover",
  },
  progressContainer: {
    position: "absolute",
    top: "90%", // Đặt vị trí lên khoảng 9/10 chiều cao ảnh
    left: "50%",
    transform: [{ translateX: -width * 0.1 }], // Căn giữa thanh tiến trình
    flexDirection: "row",
    padding: 5,
    borderRadius: 15,
  },
  dot: {
    width: width * 0.02, // 2% chiều rộng màn hình
    height: width * 0.02,
    borderRadius: width * 0.01,
    marginHorizontal: width * 0.01,
    
  },
  activeDot: {
    backgroundColor: "#FAC840",
    width: width * 0.04,
  },
  inactiveDot: {
    backgroundColor: "#1A6EFC",
  },
});

export default ImageListWithDots;
