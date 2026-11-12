import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  widthSize?: "small" | "medium" | "large"| "icon";
  heightSize?: "small" | "medium" | "large"| "icon";
  textSize?: "small" | "medium" | "large";
  fitContent?: boolean;
  color?: string;
}

export default function Button({ children, onClick, color = "#71A5D3", widthSize = "medium", heightSize = "medium", textSize = "medium", fitContent = false }: ButtonProps) {
    return (
        <Pressable
        onPress={onClick}
        style={[
            styles.button,
            fitContent ? styles.fitContent : styles[widthSize],
            styles[`${heightSize}Height`],
        ]}
        >
        {typeof children === "string" ? (
            <Text
            style={[styles.text, styles[`${textSize}Text`]]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            >
            {children}
            </Text>
        ) : (
            children
        )}
        </Pressable>
    );
    }

    const styles = StyleSheet.create({
    button: {
        backgroundColor: "#71A5D3",
        borderColor: "#71A5D3",
        borderWidth: 1,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 1,
        paddingVertical: 0,
    },

    fitContent: {
        alignSelf: "flex-start",
    },

    small: {
        width: 90,
    },
    medium: {
        width: 140,
    },
    large: {
        width: 200,
    },
    icon: {
       width: 36,

    },

    smallHeight: {
        height: 36,
    },
    mediumHeight: {
        height: 50,
    },
    largeHeight: {
        height: 64,
    },
    iconHeight: {
        height: 36,
    },

    text: {
        textAlign: "center",
        width: "100%",
        fontWeight: "600",
        color: "#fff",
    },

    smallText: {
        fontSize: 12,
    },
    mediumText: {
        fontSize: 16,
    },
    largeText: {
        fontSize: 20,
    },
    });