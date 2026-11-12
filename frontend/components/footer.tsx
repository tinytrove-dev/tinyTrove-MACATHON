import React from "react";
import { View, StyleSheet } from "react-native";

interface FooterProps {
  children: React.ReactNode;
}

export default function Footer({ children }: FooterProps) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  footer: {
    width: "95%",
    alignSelf: "center",
    minHeight: 90,
    backgroundColor: "#FFE6C9",
    borderColor: "#222",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: "1%",
    paddingRight: "1%",
    paddingTop: "4%",
    paddingBottom: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});