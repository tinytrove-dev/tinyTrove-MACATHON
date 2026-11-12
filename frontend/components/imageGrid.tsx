import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ImageSourcePropType,
} from "react-native";

interface ImageItem {
  id: string;
  source: ImageSourcePropType;
  onClick?: () => void;
}

interface ImageGridProps {
  images: ImageItem[];
  columns?: number;
  gap?: number;
}

export default function ImageGrid({
  images,
  columns = 3,
  gap = 2,
}: ImageGridProps) {
  const { width } = useWindowDimensions();

  const horizontalPadding = 4;
  const totalGap = gap * (columns - 1);
  const imageSize = (width - horizontalPadding - totalGap) / columns;

  return (
    <FlatList
      data={images}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      contentContainerStyle={styles.list}
      columnWrapperStyle={{ gap }}
      renderItem={({ item }) => (
        <Pressable
          style={{
            width: imageSize,
            height: imageSize,
            marginBottom: gap,
          }}
          onPress={item.onClick}
        >
          <Image source={item.source} style={styles.image} resizeMode="cover" />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 2,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});