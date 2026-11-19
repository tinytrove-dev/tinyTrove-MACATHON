import { useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Dimensions, Keyboard, ScrollView } from 'react-native';

// Keeps a form's inputs above the keyboard and lets the form scroll past it.
//
// On the ScrollView:  ref={scrollRef}  onScroll={onScroll}  scrollEventThrottle={16}
//                     contentContainerStyle={{ paddingBottom: 32 + keyboardPadding }}
// On each TextInput:  onFocus={() => scrollToInput(inputRef)}
export function useKeyboardScroll() {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const focusedInput = useRef<{ current: any } | null>(null);
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  function scrollToInput(inputRef: { current: any }) {
    focusedInput.current = inputRef;
    setTimeout(() => {
      inputRef.current?.measureInWindow((_x: number, y: number, _w: number, height: number) => {
        const limit = (keyboardTop.current ?? Dimensions.get('window').height) - 24;
        const overlap = y + height - limit;
        if (overlap > 0) {
          scrollRef.current?.scrollTo({ y: Math.max(scrollY.current + overlap, 0), animated: true });
        }
      });
    }, 100);
  }

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      keyboardTop.current = e.endCoordinates.screenY;
      setKeyboardPadding(e.endCoordinates.height);
      if (focusedInput.current) scrollToInput(focusedInput.current);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardPadding(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  function onScroll(e: { nativeEvent: { contentOffset: { y: number } } }) {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }

  return { scrollRef, onScroll, keyboardPadding, scrollToInput };
}
