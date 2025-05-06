import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // Assuming you're using Feather icons

const { width } = Dimensions.get('window');

const ImageCarousel = ({ images, onBack, style }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);
  
  // Auto-slide functionality
  useEffect(() => {
    const autoSlideInterval = setInterval(() => {
      if (images && images.length > 1) {
        let nextIndex = activeIndex + 1;
        if (nextIndex >= images.length) {
          nextIndex = 0;
        }
        
        setActiveIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: width * nextIndex,
          animated: true,
        });
      }
    }, 3000); // Auto-slide every 3 seconds
    
    return () => clearInterval(autoSlideInterval);
  }, [activeIndex, images]);
  
  // Handle manual scroll
  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };
  
  if (!images || images.length === 0) {
    // Fallback when no images are available
    return (
      <View style={[styles.headerImg, { backgroundColor: 'black' }, style]}>
        <TouchableOpacity
          onPress={onBack}
          style={{...styles.backBtn, marginTop: 30}}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((image, index) => (
          <ImageBackground
            key={index}
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Indicator dots */}
      <View style={styles.dotsContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)' }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// These styles match your original headerImg style plus carousel-specific styles
const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,  // Adjust based on your original headerImg height
    position: 'relative',
    marginTop: 30,
  },
  image: {
    width,
    height: '100%',
  },
  headerImg: {
    width: '100%',
    height: 250,  // Make sure this matches your original headerImg
    justifyContent: 'flex-start',
  },
  backBtn: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default ImageCarousel;