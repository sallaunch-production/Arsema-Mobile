import React, { useRef } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';

interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
}

export const OtpInput = ({
  value,
  onChangeText,
  length = 6,
}: OtpInputProps) => {
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(filtered);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.boxesContainer} onPress={handlePress}>
        {Array.from({ length }, (_, index) => {
          const digit = value[index] || '';
          const isFocused = index === value.length;

          return (
            <View
              key={index}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                digit ? styles.boxFilled : null,
              ]}
            >
              <Text style={styles.digit}>{digit}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.grayBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  boxFocused: {
    borderColor: Colors.primary,
  },
  boxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  digit: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.black,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
